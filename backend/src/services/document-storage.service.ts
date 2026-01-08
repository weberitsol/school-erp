import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Options for storing a document
 */
export interface StoreDocumentOptions {
  filePath: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  subjectId?: string;
  classId?: string;
  storageType?: 'disk' | 'database';
}

/**
 * Result of document retrieval
 */
export interface RetrievedDocument {
  document: any;
  buffer: Buffer;
  images: Array<{
    fileName: string;
    buffer: Buffer;
    mimeType: string;
  }>;
}

/**
 * Document Storage Service
 * Handles storing and retrieving Word documents from PostgreSQL database or disk
 */
class DocumentStorageService {
  /**
   * Store Word document in database or disk
   * Extracts images from Word file and stores them separately
   */
  async storeDocument(options: StoreDocumentOptions) {
    try {
      const {
        filePath,
        originalName,
        fileType,
        fileSize,
        uploadedById,
        subjectId,
        classId,
        storageType = 'database',
      } = options;

      console.log(`📁 Storing document: ${originalName} (${fileSize} bytes) - Storage: ${storageType}`);

      let binaryData: Buffer | null = null;
      let storagePath = filePath;

      // Read file into buffer if storing in database
      if (storageType === 'database') {
        try {
          binaryData = fs.readFileSync(filePath);
          console.log(`✅ Read file into buffer: ${binaryData.length} bytes`);
        } catch (error) {
          console.error('❌ Error reading file:', error);
          throw new Error(`Failed to read file: ${(error as Error).message}`);
        }
      }

      // Extract images from Word document
      let images: any[] = [];
      try {
        images = await this.extractImages(filePath);
        console.log(`📷 Extracted ${images.length} images from document`);
      } catch (error) {
        console.error('⚠️ Warning: Could not extract images:', error);
        // Don't fail entirely if image extraction fails
      }

      // Create document record in database
      console.log(`💾 Creating UploadedDocument record in database...`);
      const document = await prisma.uploadedDocument.create({
        data: {
          originalName,
          fileName: path.basename(filePath),
          fileType,
          fileSize,
          storagePath: storageType === 'database' ? originalName : storagePath,
          binaryData,
          storageType,
          hasEmbeddedImages: images.length > 0,
          imageCount: images.length,
          uploadedById,
          subjectId,
          classId,
          status: 'UPLOADED',
        },
      });

      console.log(`✅ Document created with ID: ${document.id}`);

      // Store images separately in database
      if (images.length > 0 && storageType === 'database') {
        try {
          await this.storeImages(document.id, images);
          console.log(`✅ Stored ${images.length} images in DocumentImage table`);
        } catch (error) {
          console.error('⚠️ Warning: Could not store images:', error);
          // Continue even if image storage fails
        }
      }

      console.log(`✨ Document storage completed successfully`);
      return document;
    } catch (error) {
      console.error('❌ Error in storeDocument:', error);
      throw error;
    }
  }

  /**
   * Extract images from Word document (.docx or .doc)
   * DOCX files are ZIP archives containing media files
   */
  private async extractImages(
    filePath: string
  ): Promise<
    Array<{
      data: Buffer;
      fileName: string;
      mimeType: string;
      relId?: string;
      order: number;
    }>
  > {
    const images: any[] = [];

    try {
      // Check if file is valid ZIP (DOCX is a ZIP)
      const zip = new AdmZip(filePath);
      const entries = zip.getEntries();

      if (!entries || entries.length === 0) {
        console.log('⚠️ No entries found in ZIP - might not be a valid DOCX');
        return images;
      }

      let order = 0;

      // Extract all media files from word/media/ directory
      for (const entry of entries) {
        if (entry.entryName.startsWith('word/media/')) {
          const buffer = entry.getData();
          const fileName = path.basename(entry.entryName);
          const ext = path.extname(fileName).toLowerCase();

          // Determine MIME type based on file extension
          const mimeTypes: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.wmf': 'image/x-wmf',
            '.emf': 'image/x-emf',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
          };

          const mimeType = mimeTypes[ext] || 'application/octet-stream';

          images.push({
            data: buffer,
            fileName,
            mimeType,
            order: order++,
          });

          console.log(
            `  📷 Found image: ${fileName} (${buffer.length} bytes, ${mimeType})`
          );
        }
      }

      // Extract relationship IDs from document.xml.rels
      // This maps image file names to their relationship IDs for linking
      try {
        const relsXml = zip.readAsText('word/_rels/document.xml.rels');
        if (relsXml) {
          // Parse XML to extract relationships
          const rIdMatches = relsXml.match(/Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g);
          if (rIdMatches) {
            for (const match of rIdMatches) {
              const idMatch = match.match(/Id="(rId\d+)"/);
              const targetMatch = match.match(/Target="media\/([^"]+)"/);
              if (idMatch && targetMatch) {
                const rId = idMatch[1];
                const fileName = targetMatch[1];
                // Find corresponding image and set relId
                const img = images.find((i) => i.fileName === fileName);
                if (img) {
                  img.relId = rId;
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Could not extract relationship IDs:', error);
        // Continue without relId - it's optional
      }

      console.log(`✅ Image extraction completed: ${images.length} images found`);
    } catch (error) {
      // If it's not a valid ZIP/DOCX, just return empty array
      console.log(
        `ℹ️ Could not extract images (might not be a Word document):`,
        (error as Error).message
      );
    }

    return images;
  }

  /**
   * Store extracted images in DocumentImage table
   */
  private async storeImages(documentId: string, images: any[]): Promise<void> {
    const imageRecords = images.map((img) => ({
      documentId,
      imageData: img.data,
      originalFileName: img.fileName,
      mimeType: img.mimeType,
      fileSize: img.data.length,
      imageOrder: img.order,
      relId: img.relId || null,
    }));

    // Batch insert for efficiency
    await prisma.documentImage.createMany({
      data: imageRecords,
    });
  }

  /**
   * Retrieve document from database
   */
  async getDocument(documentId: string): Promise<RetrievedDocument> {
    try {
      console.log(`📂 Retrieving document: ${documentId}`);

      const document = await prisma.uploadedDocument.findUnique({
        where: { id: documentId },
        include: {
          images: {
            orderBy: { imageOrder: 'asc' },
          },
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      console.log(`✅ Found document: ${document.originalName}`);

      let buffer: Buffer;

      // Retrieve file based on storage type
      if (document.storageType === 'database' && document.binaryData) {
        buffer = Buffer.from(document.binaryData);
        console.log(`📦 Retrieved from database: ${buffer.length} bytes`);
      } else {
        // Read from disk
        try {
          buffer = fs.readFileSync(document.storagePath);
          console.log(`📦 Retrieved from disk: ${buffer.length} bytes`);
        } catch (error) {
          throw new Error(
            `Failed to read file from disk at ${document.storagePath}: ${(error as Error).message}`
          );
        }
      }

      // Convert images to readable format
      const images = (document.images || []).map((img) => ({
        fileName: img.originalFileName,
        buffer: Buffer.from(img.imageData),
        mimeType: img.mimeType,
      }));

      console.log(`📷 Retrieved ${images.length} associated images`);

      return { document, buffer, images };
    } catch (error) {
      console.error('❌ Error retrieving document:', error);
      throw error;
    }
  }

  /**
   * Delete document and associated images
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      console.log(`🗑️  Deleting document: ${documentId}`);

      // DocumentImage records will cascade delete due to onDelete: Cascade
      await prisma.uploadedDocument.delete({
        where: { id: documentId },
      });

      console.log(`✅ Document and associated images deleted`);
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get document metadata without binary data
   * Useful for listing documents efficiently
   */
  async getDocumentMetadata(documentId: string): Promise<any> {
    try {
      console.log(`ℹ️  Retrieving document metadata: ${documentId}`);

      const document = await prisma.uploadedDocument.findUnique({
        where: { id: documentId },
        select: {
          id: true,
          originalName: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          storageType: true,
          hasEmbeddedImages: true,
          imageCount: true,
          subjectId: true,
          classId: true,
          status: true,
          createdAt: true,
          uploadedBy: {
            select: {
              id: true,
              email: true,
            },
          },
          _count: {
            select: {
              images: true,
              questions: true,
            },
          },
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      console.log(`✅ Retrieved metadata for: ${document.originalName}`);
      return document;
    } catch (error) {
      console.error('❌ Error retrieving metadata:', error);
      throw error;
    }
  }

  /**
   * List documents with pagination
   */
  async listDocuments(
    filters?: {
      subjectId?: string;
      classId?: string;
      status?: string;
      uploadedById?: string;
    },
    pagination?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{
    documents: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      console.log(`📋 Listing documents - Page ${page}, Limit ${limit}`);

      const where: any = {};

      if (filters?.subjectId) where.subjectId = filters.subjectId;
      if (filters?.classId) where.classId = filters.classId;
      if (filters?.status) where.status = filters.status;
      if (filters?.uploadedById) where.uploadedById = filters.uploadedById;

      const [documents, total] = await Promise.all([
        prisma.uploadedDocument.findMany({
          where,
          select: {
            id: true,
            originalName: true,
            fileSize: true,
            storageType: true,
            imageCount: true,
            status: true,
            createdAt: true,
            uploadedBy: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.uploadedDocument.count({ where }),
      ]);

      console.log(
        `✅ Retrieved ${documents.length} documents (Total: ${total})`
      );

      return {
        documents,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('❌ Error listing documents:', error);
      throw error;
    }
  }

  /**
   * Check storage usage in database
   */
  async getStorageStats(): Promise<{
    totalDocuments: number;
    totalImages: number;
    diskStorageCount: number;
    databaseStorageCount: number;
    totalBytesInDb: number;
    averageDocumentSize: number;
  }> {
    try {
      console.log(`📊 Calculating storage statistics...`);

      const [docCount, imageCount, storageStats] = await Promise.all([
        prisma.uploadedDocument.count(),
        prisma.documentImage.count(),
        prisma.uploadedDocument.groupBy({
          by: ['storageType'],
          _count: {
            id: true,
          },
          _sum: {
            fileSize: true,
          },
        }),
      ]);

      let diskStorageCount = 0;
      let databaseStorageCount = 0;
      let totalBytesInDb = 0;

      for (const stat of storageStats) {
        if (stat.storageType === 'disk') {
          diskStorageCount = stat._count.id;
        } else if (stat.storageType === 'database') {
          databaseStorageCount = stat._count.id;
          totalBytesInDb = stat._sum.fileSize || 0;
        }
      }

      const averageDocumentSize =
        docCount > 0 ? (totalBytesInDb || 0) / docCount : 0;

      console.log(`✅ Storage stats calculated`);

      return {
        totalDocuments: docCount,
        totalImages: imageCount,
        diskStorageCount,
        databaseStorageCount,
        totalBytesInDb,
        averageDocumentSize,
      };
    } catch (error) {
      console.error('❌ Error calculating storage stats:', error);
      throw error;
    }
  }

  /**
   * Migrate document from disk to database
   */
  async migrateDocumentToDatabase(documentId: string): Promise<any> {
    try {
      console.log(`🔄 Migrating document to database: ${documentId}`);

      const document = await prisma.uploadedDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      if (document.storageType === 'database') {
        console.log('ℹ️  Document already in database');
        return document;
      }

      // Read from disk
      console.log(`📖 Reading file from disk: ${document.storagePath}`);
      const binaryData = fs.readFileSync(document.storagePath);

      // Update database record
      const updated = await prisma.uploadedDocument.update({
        where: { id: documentId },
        data: {
          binaryData,
          storageType: 'database',
        },
      });

      console.log(`✅ Document migrated to database (${binaryData.length} bytes)`);
      return updated;
    } catch (error) {
      console.error('❌ Error migrating document:', error);
      throw error;
    }
  }

  /**
   * Export document from database to disk
   */
  async exportDocumentToDisk(documentId: string, outputPath: string): Promise<string> {
    try {
      console.log(`💾 Exporting document to disk: ${documentId}`);

      const { buffer } = await this.getDocument(documentId);

      // Ensure output directory exists
      const directory = path.dirname(outputPath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
        console.log(`📁 Created directory: ${directory}`);
      }

      // Write to disk
      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ Document exported to: ${outputPath} (${buffer.length} bytes)`);

      return outputPath;
    } catch (error) {
      console.error('❌ Error exporting document:', error);
      throw error;
    }
  }

  /**
   * Get document images as files
   */
  async getDocumentImages(
    documentId: string,
    outputDir?: string
  ): Promise<
    Array<{
      id: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      filePath?: string;
    }>
  > {
    try {
      console.log(`🖼️  Retrieving images for document: ${documentId}`);

      const document = await prisma.uploadedDocument.findUnique({
        where: { id: documentId },
        include: {
          images: {
            orderBy: { imageOrder: 'asc' },
          },
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const result: any[] = [];

      for (const img of document.images) {
        const item: any = {
          id: img.id,
          fileName: img.originalFileName,
          mimeType: img.mimeType,
          fileSize: img.fileSize,
        };

        // If output directory provided, save images to disk
        if (outputDir) {
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const filePath = path.join(outputDir, img.originalFileName);
          fs.writeFileSync(filePath, img.imageData);
          item.filePath = filePath;
          console.log(`  💾 Saved image: ${filePath}`);
        }

        result.push(item);
      }

      console.log(`✅ Retrieved ${result.length} images`);
      return result;
    } catch (error) {
      console.error('❌ Error retrieving images:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const documentStorageService = new DocumentStorageService();

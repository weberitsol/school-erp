import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { documentStorageService } from '../services/document-storage.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/documents/:id/download
 * Download original Word document
 * @param id - Document ID
 * @returns Word document file
 */
router.get(
  '/:id/download',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      console.log(`📥 Download request for document: ${id}`);

      // Retrieve document
      const { document, buffer } = await documentStorageService.getDocument(id);

      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(document.originalName)}"`
      );
      res.setHeader('Content-Length', buffer.length.toString());

      console.log(`✅ Sending document: ${document.originalName} (${buffer.length} bytes)`);
      res.send(buffer);
    } catch (error: any) {
      console.error('❌ Error downloading document:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download document',
      });
    }
  }
);

/**
 * GET /api/v1/documents/:id/metadata
 * Get document metadata without binary data
 * @param id - Document ID
 * @returns Document metadata
 */
router.get(
  '/:id/metadata',
  authorize('ADMIN', 'TEACHER', 'STUDENT'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      console.log(`ℹ️  Metadata request for document: ${id}`);

      const metadata = await documentStorageService.getDocumentMetadata(id);

      res.json({
        success: true,
        data: metadata,
      });
    } catch (error: any) {
      console.error('❌ Error retrieving metadata:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve metadata',
      });
    }
  }
);

/**
 * GET /api/v1/documents
 * List documents with filters and pagination
 * @query subjectId - Filter by subject
 * @query classId - Filter by class
 * @query status - Filter by status (UPLOADED, PROCESSING, COMPLETED, FAILED)
 * @query uploadedById - Filter by uploader
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 */
router.get(
  '/',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response) => {
    try {
      const { subjectId, classId, status, uploadedById, page, limit } = req.query;

      console.log(`📋 List documents request - Page: ${page}, Limit: ${limit}`);

      const filters: any = {};
      if (subjectId) filters.subjectId = subjectId;
      if (classId) filters.classId = classId;
      if (status) filters.status = status;
      if (uploadedById) filters.uploadedById = uploadedById;

      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      };

      const result = await documentStorageService.listDocuments(filters, pagination);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Error listing documents:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to list documents',
      });
    }
  }
);

/**
 * GET /api/v1/documents/:id/images
 * Get images from document
 * @param id - Document ID
 * @query download - If true, download images as files (optional)
 */
router.get(
  '/:id/images',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { download } = req.query;

      console.log(`🖼️  Image request for document: ${id}`);

      const images = await documentStorageService.getDocumentImages(id);

      res.json({
        success: true,
        data: {
          images,
          count: images.length,
        },
      });
    } catch (error: any) {
      console.error('❌ Error retrieving images:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve images',
      });
    }
  }
);

/**
 * DELETE /api/v1/documents/:id
 * Delete a document and associated images
 * @param id - Document ID
 */
router.delete(
  '/:id',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      console.log(`🗑️  Delete request for document: ${id} by user: ${user.id}`);

      // Get document first to verify ownership
      const document = await documentStorageService.getDocumentMetadata(id);

      // Only the uploader or admin can delete
      if (document.uploadedById !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this document',
        });
      }

      // Delete document
      await documentStorageService.deleteDocument(id);

      console.log(`✅ Document deleted: ${id}`);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      console.error('❌ Error deleting document:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete document',
      });
    }
  }
);

/**
 * POST /api/v1/documents/:id/migrate-to-db
 * Migrate document from disk to database
 * @param id - Document ID
 */
router.post(
  '/:id/migrate-to-db',
  authorize('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      console.log(`🔄 Migration request for document: ${id} (disk → database)`);

      const updated = await documentStorageService.migrateDocumentToDatabase(id);

      console.log(`✅ Migration completed for document: ${id}`);

      res.json({
        success: true,
        message: 'Document migrated to database successfully',
        data: {
          id: updated.id,
          storageType: updated.storageType,
          fileSize: updated.fileSize,
        },
      });
    } catch (error: any) {
      console.error('❌ Error migrating document:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to migrate document',
      });
    }
  }
);

/**
 * GET /api/v1/documents/storage/stats
 * Get storage statistics
 */
router.get(
  '/storage/stats',
  authorize('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      console.log(`📊 Storage stats request`);

      const stats = await documentStorageService.getStorageStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('❌ Error retrieving storage stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve storage statistics',
      });
    }
  }
);

export default router;

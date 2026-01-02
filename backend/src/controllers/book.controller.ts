import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { bookService, bookCategoryService } from '../services/book.service';
import { bookAccessService } from '../services/book-access.service';
import { bookQAService } from '../services/book-qa.service';
import { bookAnnotationService } from '../services/book-annotation.service';
import { pdfIndexingService } from '../services/pdf-indexing.service';
import { BookSourceType, AnnotationType } from '@prisma/client';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'books');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


// Ensure cache directory exists for external PDFs
const cacheDir = path.join(process.cwd(), 'uploads', 'books', 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Helper function to download file from URL
async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    const request = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(new Error("Failed to download: HTTP " + response.statusCode));
        return;
      }

      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });

    request.setTimeout(120000, () => {
      request.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error('Download timeout'));
    });
  });
}

function getDirectDownloadUrl(url: string): string {
  // Handle Google Drive links - drive.google.com/file/d/{id}
  const driveRegex = new RegExp('drive.google.com/file/d/([^/]+)');
  const driveMatch = url.match(driveRegex);
  if (driveMatch) return "https://drive.google.com/uc?export=download&id=" + driveMatch[1];

  // Handle Google Drive view links - drive.google.com/open?id={id}
  const viewRegex = new RegExp('drive.google.com/open\\?id=([^&]+)');
  const viewMatch = url.match(viewRegex);
  if (viewMatch) return "https://drive.google.com/uc?export=download&id=" + viewMatch[1];

  // Handle Dropbox links
  if (url.includes('dropbox.com')) return url.replace('dl=0', 'dl=1');

  return url;
}

// ==================== Category Controllers ====================

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, parentId, boardType, classLevel, subjectCode, displayOrder, iconName, color } = req.body;
    const schoolId = (req as any).user.schoolId;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const category = await bookCategoryService.create({
      name,
      description,
      parentId,
      boardType,
      classLevel,
      subjectCode,
      displayOrder,
      iconName,
      color,
      schoolId,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user.schoolId;
    const { boardType, classLevel } = req.query;

    const categories = boardType || classLevel
      ? await bookCategoryService.getTree(schoolId, boardType as string, classLevel as string)
      : await bookCategoryService.getAll(schoolId);

    res.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await bookCategoryService.getById(id);

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await bookCategoryService.update(id, req.body);
    res.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await bookCategoryService.delete(id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== Book Controllers ====================

export const uploadBook = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { title, description, author, publisher, publicationYear, isbn, categoryId, classLevel, subjectId, chapterNumber, tags, language } = req.body;
    const schoolId = (req as any).user.schoolId;
    const uploadedById = (req as any).user.id;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (!title || !categoryId) {
      return res.status(400).json({ success: false, error: 'Title and category are required' });
    }

    const book = await bookService.create({
      title,
      description,
      author,
      publisher,
      publicationYear: publicationYear ? parseInt(publicationYear) : undefined,
      isbn,
      sourceType: 'LOCAL_FILE' as BookSourceType,
      fileName: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      storagePath: file.path,
      mimeType: file.mimetype,
      categoryId,
      classLevel,
      subjectId: subjectId || undefined,
      chapterNumber: chapterNumber ? parseInt(chapterNumber) : undefined,
      tags: tags ? JSON.parse(tags) : [],
      language,
      schoolId,
      uploadedById,
    });

    res.status(201).json({ success: true, data: book });
  } catch (error: any) {
    console.error('Upload book error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addExternalBook = async (req: Request, res: Response) => {
  try {
    const { title, description, author, publisher, publicationYear, isbn, externalUrl, externalProvider, categoryId, classLevel, subjectId, chapterNumber, tags, language } = req.body;
    const schoolId = (req as any).user.schoolId;
    const uploadedById = (req as any).user.id;

    if (!title || !categoryId || !externalUrl) {
      return res.status(400).json({ success: false, error: 'Title, category, and URL are required' });
    }

    const book = await bookService.create({
      title,
      description,
      author,
      publisher,
      publicationYear,
      isbn,
      sourceType: 'EXTERNAL_URL' as BookSourceType,
      externalUrl,
      externalProvider,
      categoryId,
      classLevel,
      subjectId,
      chapterNumber,
      tags: tags || [],
      language,
      schoolId,
      uploadedById,
    });

    res.status(201).json({ success: true, data: book });
  } catch (error: any) {
    console.error('Add external book error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBooks = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user.schoolId;
    const { categoryId, subjectId, classLevel, status, search, tags, page, limit } = req.query;

    const result = await bookService.getAll(
      {
        schoolId,
        categoryId: categoryId as string,
        subjectId: subjectId as string,
        classLevel: classLevel as string,
        status: status as any,
        search: search as string,
        tags: tags ? (tags as string).split(',') : undefined,
      },
      {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      }
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Get books error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const book = await bookService.getById(id);

    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Increment view count
    await bookService.incrementViewCount(id);

    res.json({ success: true, data: book });
  } catch (error: any) {
    console.error('Get book error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const book = await bookService.update(id, req.body);
    res.json({ success: true, data: book });
  } catch (error: any) {
    console.error('Update book error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await bookService.delete(id);
    res.json({ success: true, message: 'Book deleted' });
  } catch (error: any) {
    console.error('Delete book error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const publishBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const book = await bookService.publish(id);
    res.json({ success: true, data: book });
  } catch (error: any) {
    console.error('Publish book error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAvailableBooks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const schoolId = user.schoolId;

    // If student, get books available to them
    if (user.role === 'STUDENT' && user.student?.id) {
      const books = await bookService.getAvailableBooks(user.student.id, schoolId);
      return res.json({ success: true, data: books });
    }

    // For teachers/admins, return all published books
    const result = await bookService.getAll({ schoolId, status: 'PUBLISHED' }, { limit: 100 });
    res.json({ success: true, data: result.books });
  } catch (error: any) {
    console.error('Get available books error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== Access Control Controllers ====================

export const grantAccess = async (req: Request, res: Response) => {
  try {
    const { id: bookId } = req.params;
    const { classId, sectionId, academicYearId, canDownload, canAnnotate, availableFrom, availableUntil } = req.body;
    const createdById = (req as any).user.id;

    if (!classId) {
      return res.status(400).json({ success: false, error: 'Class is required' });
    }

    const access = await bookAccessService.grantAccess({
      bookId,
      classId,
      sectionId,
      academicYearId,
      canDownload,
      canAnnotate,
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      availableUntil: availableUntil ? new Date(availableUntil) : undefined,
      createdById,
    });

    res.status(201).json({ success: true, data: access });
  } catch (error: any) {
    console.error('Grant access error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBookAccess = async (req: Request, res: Response) => {
  try {
    const { id: bookId } = req.params;
    const access = await bookAccessService.getBookAccess(bookId);
    res.json({ success: true, data: access });
  } catch (error: any) {
    console.error('Get access error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAccess = async (req: Request, res: Response) => {
  try {
    const { accessId } = req.params;
    const access = await bookAccessService.updateAccess(accessId, req.body);
    res.json({ success: true, data: access });
  } catch (error: any) {
    console.error('Update access error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const revokeAccess = async (req: Request, res: Response) => {
  try {
    const { accessId } = req.params;
    await bookAccessService.revokeAccess(accessId);
    res.json({ success: true, message: 'Access revoked' });
  } catch (error: any) {
    console.error('Revoke access error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== AI Q&A Controllers ====================

export const askQuestion = async (req: Request, res: Response) => {
  try {
    const { id: bookId } = req.params;
    const { question } = req.body;
    const userId = (req as any).user.id;

    if (!question) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    const answer = await bookQAService.askQuestion(bookId, question, userId);
    res.json({ success: true, data: answer });
  } catch (error: any) {
    console.error('Ask question error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getQAHistory = async (req: Request, res: Response) => {
  try {
    const { id: bookId } = req.params;
    const { limit } = req.query;
    const history = await bookQAService.getBookQAHistory(bookId, limit ? parseInt(limit as string) : 20);
    res.json({ success: true, data: history });
  } catch (error: any) {
    console.error('Get QA history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPopularQuestions = async (req: Request, res: Response) => {
  try {
    const { id: bookId } = req.params;
    const { limit } = req.query;
    const questions = await bookQAService.getPopularQuestions(bookId, limit ? parseInt(limit as string) : 10);
    res.json({ success: true, data: questions });
  } catch (error: any) {
    console.error('Get popular questions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== Annotation Controllers ====================

export const createAnnotation = async (req: Request, res: Response) => {
  try {
    const { id: bookId } = req.params;
    const userId = (req as any).user.id;
    const { pageNumber, annotationType, ...data } = req.body;

    if (!pageNumber || !annotationType) {
      return res.status(400).json({ success: false, error: 'Page number and annotation type are required' });
    }

    const annotation = await bookAnnotationService.create({
      bookId,
      userId,
      pageNumber,
      annotationType: annotationType as AnnotationType,
      ...data,
    });

    res.status(201).json({ success: true, data: annotation });
  } catch (error: any) {
    console.error('Create annotation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAnnotations = async (req: Request, res: Response) => {
  try {
    const { id: bookId } = req.params;
    const userId = (req as any).user.id;
    const annotations = await bookAnnotationService.getBookAnnotations(bookId, userId);
    res.json({ success: true, data: annotations });
  } catch (error: any) {
    console.error('Get annotations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPageAnnotations = async (req: Request, res: Response) => {
  try {
    const { id: bookId, page } = req.params;
    const userId = (req as any).user.id;
    const annotations = await bookAnnotationService.getPageAnnotations(bookId, userId, parseInt(page));
    res.json({ success: true, data: annotations });
  } catch (error: any) {
    console.error('Get page annotations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAnnotation = async (req: Request, res: Response) => {
  try {
    const { annotationId } = req.params;
    const userId = (req as any).user.id;
    const annotation = await bookAnnotationService.update(annotationId, userId, req.body);
    res.json({ success: true, data: annotation });
  } catch (error: any) {
    console.error('Update annotation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAnnotation = async (req: Request, res: Response) => {
  try {
    const { annotationId } = req.params;
    const userId = (req as any).user.id;
    await bookAnnotationService.delete(annotationId, userId);
    res.json({ success: true, message: 'Annotation deleted' });
  } catch (error: any) {
    console.error('Delete annotation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveCanvasState = async (req: Request, res: Response) => {
  try {
    const { id: bookId } = req.params;
    const userId = (req as any).user.id;
    const { pageNumber, canvasState } = req.body;

    if (pageNumber === undefined || pageNumber === null || !canvasState) {
      return res.status(400).json({ success: false, error: 'Page number and canvas state are required' });
    }

    const result = await bookAnnotationService.saveCanvasState(bookId, userId, pageNumber, canvasState);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Save canvas state error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSharedAnnotations = async (req: Request, res: Response) => {
  try {
    const { id: bookId } = req.params;
    const annotations = await bookAnnotationService.getSharedAnnotations(bookId);
    res.json({ success: true, data: annotations });
  } catch (error: any) {
    console.error('Get shared annotations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== Bulk Upload Controller ====================

export const bulkUploadBooks = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { categoryId, classLevel, subjectId } = req.body;
    const schoolId = (req as any).user.schoolId;
    const uploadedById = (req as any).user.id;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    if (!categoryId) {
      return res.status(400).json({ success: false, error: 'Category is required' });
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const file of files) {
      try {
        // Use filename as title (without extension)
        const title = path.basename(file.originalname, path.extname(file.originalname));

        const book = await bookService.create({
          title,
          sourceType: 'LOCAL_FILE' as BookSourceType,
          fileName: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          storagePath: file.path,
          mimeType: file.mimetype,
          categoryId,
          classLevel,
          subjectId: subjectId || undefined,
          schoolId,
          uploadedById,
        });

        results.success.push({ file: file.originalname, book });
      } catch (err: any) {
        results.failed.push({ file: file.originalname, error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        total: files.length,
        successful: results.success.length,
        failed: results.failed.length,
        results,
      },
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== File Download Controller ====================

export const downloadBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const book = await bookService.getById(id);

    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // For EXTERNAL_URL books, download and cache locally first
    if (book.sourceType === 'EXTERNAL_URL') {
      if (!book.externalUrl) {
        return res.status(400).json({ success: false, error: 'External URL not found' });
      }

      // Check if file is already cached
      const cachedFileName = id + '.pdf';
      const cachedFilePath = path.join(cacheDir, cachedFileName);

      if (!fs.existsSync(cachedFilePath)) {
        console.log('Downloading external PDF for book ' + id + ' from ' + book.externalUrl);

        try {
          const downloadUrl = getDirectDownloadUrl(book.externalUrl);
          console.log('Direct download URL: ' + downloadUrl);

          await downloadFile(downloadUrl, cachedFilePath);
          console.log('Successfully cached external PDF: ' + cachedFilePath);
        } catch (downloadError: any) {
          console.error('Failed to download external PDF:', downloadError.message);
          return res.status(500).json({
            success: false,
            error: 'Failed to download external PDF: ' + downloadError.message + '. The external URL may not be directly accessible.'
          });
        }
      }

      // Increment download count
      await bookService.incrementDownloadCount(id);

      // Serve the cached file
      const fileName = book.title ? book.title + '.pdf' : cachedFileName;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');
      return res.sendFile(cachedFilePath);
    }

    // For LOCAL_FILE books
    if (!book.storagePath || !fs.existsSync(book.storagePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Increment download count
    await bookService.incrementDownloadCount(id);

    const fileName = book.originalName || book.fileName;

    // Set headers for inline viewing (PDF opens in browser frame)
    res.setHeader('Content-Type', book.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');

    res.sendFile(book.storagePath);
  } catch (error: any) {
    console.error('Download book error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== Indexing Controllers ====================

export const getIndexingStatus = async (req: Request, res: Response) => {
  try {
    const status = await pdfIndexingService.getIndexingStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    console.error('Get indexing status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const indexBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pdfIndexingService.indexBook(id);

    if (result.success) {
      res.json({
        success: true,
        message: `Book indexed successfully (${result.pageCount} pages, ${result.characterCount} characters)`,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to index book',
      });
    }
  } catch (error: any) {
    console.error('Index book error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reindexBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pdfIndexingService.reindexBook(id);

    if (result.success) {
      res.json({
        success: true,
        message: `Book re-indexed successfully (${result.pageCount} pages, ${result.characterCount} characters)`,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to re-index book',
      });
    }
  } catch (error: any) {
    console.error('Reindex book error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const indexAllBooks = async (req: Request, res: Response) => {
  try {
    const results = await pdfIndexingService.indexAllUnindexed();

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Indexed ${successful} books successfully, ${failed} failed`,
      data: {
        total: results.length,
        successful,
        failed,
        results,
      },
    });
  } catch (error: any) {
    console.error('Index all books error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

import { Request, Response } from 'express';
import { wordGenerationService } from '../services/word-generation.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/v1/word-generation/question-paper
 * Generate a question paper in Word format
 */
export const generateQuestionPaper = async (req: Request, res: Response) => {
  try {
    const { testId, title, instructions, columnLayout = 'single', includeAnswers = false } =
      req.body;
    const user = (req as any).user;

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: 'testId is required',
      });
    }

    if (!['single', 'double'].includes(columnLayout)) {
      return res.status(400).json({
        success: false,
        message: 'columnLayout must be "single" or "double"',
      });
    }

    console.log(
      `📝 Generating question paper - Test: ${testId}, Layout: ${columnLayout}, Include Answers: ${includeAnswers}`
    );

    // Generate document
    const buffer = await wordGenerationService.generateQuestionPaper({
      testId,
      title: title || 'Question Paper',
      instructions,
      columnLayout,
      includeAnswers,
    });

    // Store generated document
    const generatedDoc = await prisma.generatedDocument.create({
      data: {
        fileName: `question_paper_${testId}_${Date.now()}.docx`,
        fileType: 'question_paper',
        testId,
        documentData: buffer,
        columnLayout,
        generatedById: user.id,
        metadata: {
          title,
          includeAnswers,
        },
      },
    });

    console.log(
      `✅ Generated question paper stored with ID: ${generatedDoc.id} (${buffer.length} bytes)`
    );

    // Send file to client
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(generatedDoc.fileName)}"`
    );
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (error: any) {
    console.error('❌ Error generating question paper:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate question paper',
    });
  }
};

/**
 * POST /api/v1/word-generation/report-card
 * Generate a student report card
 */
export const generateReportCard = async (req: Request, res: Response) => {
  try {
    const { studentId, termId, columnLayout = 'single' } = req.body;
    const user = (req as any).user;

    if (!studentId || !termId) {
      return res.status(400).json({
        success: false,
        message: 'studentId and termId are required',
      });
    }

    console.log(
      `📊 Generating report card - Student: ${studentId}, Term: ${termId}, Layout: ${columnLayout}`
    );

    const buffer = await wordGenerationService.generateReportCard({
      studentId,
      termId,
      columnLayout,
    });

    // Store generated document
    const generatedDoc = await prisma.generatedDocument.create({
      data: {
        fileName: `report_card_${studentId}_${Date.now()}.docx`,
        fileType: 'report_card',
        studentId,
        documentData: buffer,
        columnLayout,
        generatedById: user.id,
        metadata: { termId },
      },
    });

    console.log(
      `✅ Generated report card stored with ID: ${generatedDoc.id} (${buffer.length} bytes)`
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(generatedDoc.fileName)}"`
    );
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (error: any) {
    console.error('❌ Error generating report card:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate report card',
    });
  }
};

/**
 * POST /api/v1/word-generation/certificate
 * Generate a certificate for a student
 */
export const generateCertificate = async (req: Request, res: Response) => {
  try {
    const { studentId, certificateType, achievement, date } = req.body;
    const user = (req as any).user;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required',
      });
    }

    if (!certificateType) {
      return res.status(400).json({
        success: false,
        message: 'certificateType is required',
      });
    }

    console.log(
      `🎓 Generating certificate - Student: ${studentId}, Type: ${certificateType}`
    );

    const buffer = await wordGenerationService.generateCertificate({
      studentId,
      certificateType,
      achievement,
      date: date ? new Date(date) : new Date(),
    });

    const generatedDoc = await prisma.generatedDocument.create({
      data: {
        fileName: `certificate_${studentId}_${Date.now()}.docx`,
        fileType: 'certificate',
        studentId,
        documentData: buffer,
        columnLayout: 'single',
        generatedById: user.id,
        metadata: {
          certificateType,
          achievement,
        },
      },
    });

    console.log(
      `✅ Generated certificate stored with ID: ${generatedDoc.id} (${buffer.length} bytes)`
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(generatedDoc.fileName)}"`
    );
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (error: any) {
    console.error('❌ Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate certificate',
    });
  }
};

/**
 * POST /api/v1/word-generation/study-material
 * Generate study material from a chapter
 */
export const generateStudyMaterial = async (req: Request, res: Response) => {
  try {
    const { chapterId, includeQuestions = true, columnLayout = 'double' } = req.body;
    const user = (req as any).user;

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: 'chapterId is required',
      });
    }

    if (!['single', 'double'].includes(columnLayout)) {
      return res.status(400).json({
        success: false,
        message: 'columnLayout must be "single" or "double"',
      });
    }

    console.log(
      `📚 Generating study material - Chapter: ${chapterId}, Include Questions: ${includeQuestions}, Layout: ${columnLayout}`
    );

    const buffer = await wordGenerationService.generateStudyMaterial({
      chapterId,
      includeQuestions,
      columnLayout,
    });

    const generatedDoc = await prisma.generatedDocument.create({
      data: {
        fileName: `study_material_${chapterId}_${Date.now()}.docx`,
        fileType: 'study_material',
        documentData: buffer,
        columnLayout,
        generatedById: user.id,
        metadata: {
          chapterId,
          includeQuestions,
        },
      },
    });

    console.log(
      `✅ Generated study material stored with ID: ${generatedDoc.id} (${buffer.length} bytes)`
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(generatedDoc.fileName)}"`
    );
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (error: any) {
    console.error('❌ Error generating study material:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate study material',
    });
  }
};

/**
 * POST /api/v1/word-generation/question-bank-export
 * Export question bank to Word format
 */
export const exportQuestionBank = async (req: Request, res: Response) => {
  try {
    const { subjectId, classId, chapterId, columnLayout = 'single' } = req.body;
    const user = (req as any).user;

    if (!subjectId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'subjectId and classId are required',
      });
    }

    if (!['single', 'double'].includes(columnLayout)) {
      return res.status(400).json({
        success: false,
        message: 'columnLayout must be "single" or "double"',
      });
    }

    console.log(
      `📖 Exporting question bank - Subject: ${subjectId}, Class: ${classId}, Chapter: ${chapterId || 'all'}, Layout: ${columnLayout}`
    );

    const buffer = await wordGenerationService.exportQuestionBank(
      subjectId,
      classId,
      chapterId,
      columnLayout
    );

    const generatedDoc = await prisma.generatedDocument.create({
      data: {
        fileName: `question_bank_${subjectId}_${classId}_${Date.now()}.docx`,
        fileType: 'question_bank',
        documentData: buffer,
        columnLayout,
        generatedById: user.id,
        metadata: {
          subjectId,
          classId,
          chapterId,
        },
      },
    });

    console.log(
      `✅ Generated question bank stored with ID: ${generatedDoc.id} (${buffer.length} bytes)`
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(generatedDoc.fileName)}"`
    );
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (error: any) {
    console.error('❌ Error exporting question bank:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export question bank',
    });
  }
};

/**
 * GET /api/v1/word-generation/generated-documents
 * List generated documents with pagination
 */
export const listGeneratedDocuments = async (req: Request, res: Response) => {
  try {
    const { fileType, page = 1, limit = 10 } = req.query;
    const user = (req as any).user;

    const where: any = {
      generatedById: user.id,
    };

    if (fileType) {
      where.fileType = fileType;
    }

    const [documents, total] = await Promise.all([
      prisma.generatedDocument.findMany({
        where,
        select: {
          id: true,
          fileName: true,
          fileType: true,
          columnLayout: true,
          createdAt: true,
          metadata: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.generatedDocument.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        documents,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    });
  } catch (error: any) {
    console.error('❌ Error listing generated documents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list generated documents',
    });
  }
};

/**
 * GET /api/v1/word-generation/generated-documents/:id/download
 * Download a generated document
 */
export const downloadGeneratedDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    console.log(`📥 Downloading generated document: ${id}`);

    const document = await prisma.generatedDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Verify ownership or admin
    if (document.generatedById !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this document',
      });
    }

    const buffer = Buffer.from(document.documentData);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(document.fileName)}"`
    );
    res.setHeader('Content-Length', buffer.length.toString());

    console.log(`✅ Sending document: ${document.fileName} (${buffer.length} bytes)`);
    res.send(buffer);
  } catch (error: any) {
    console.error('❌ Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download document',
    });
  }
};

/**
 * DELETE /api/v1/word-generation/generated-documents/:id
 * Delete a generated document
 */
export const deleteGeneratedDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    console.log(`🗑️  Deleting generated document: ${id}`);

    const document = await prisma.generatedDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Verify ownership or admin
    if (document.generatedById !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this document',
      });
    }

    await prisma.generatedDocument.delete({
      where: { id },
    });

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
};

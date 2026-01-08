import { apiClient } from '@/lib/api-client';

/**
 * Payload for generating a question paper
 */
export interface GenerateQuestionPaperPayload {
  testId: string;
  title?: string;
  instructions?: string;
  columnLayout?: 'single' | 'double';
  includeAnswers?: boolean;
}

/**
 * Payload for generating a report card
 */
export interface GenerateReportCardPayload {
  studentId: string;
  termId: string;
  columnLayout?: 'single' | 'double';
}

/**
 * Payload for generating a certificate
 */
export interface GenerateCertificatePayload {
  studentId: string;
  certificateType: string;
  achievement?: string;
  date?: string;
}

/**
 * Payload for generating study material
 */
export interface GenerateStudyMaterialPayload {
  chapterId: string;
  includeQuestions?: boolean;
  columnLayout?: 'single' | 'double';
}

/**
 * Payload for exporting question bank
 */
export interface ExportQuestionBankPayload {
  subjectId: string;
  classId: string;
  chapterId?: string;
  columnLayout?: 'single' | 'double';
}

/**
 * Response from list generated documents endpoint
 */
export interface GeneratedDocument {
  id: string;
  fileName: string;
  fileType: string;
  columnLayout: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

/**
 * Response from list generated documents endpoint
 */
export interface ListGeneratedDocumentsResponse {
  success: boolean;
  data: {
    documents: GeneratedDocument[];
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * Word Generation Service
 * Handles all word document generation operations
 */
class WordGenerationService {
  private endpoint = '/api/v1/word-generation';

  /**
   * Generate a question paper
   * @param payload - Question paper generation payload
   * @returns Blob containing the generated Word document
   */
  async generateQuestionPaper(payload: GenerateQuestionPaperPayload): Promise<Blob> {
    try {
      const response = await fetch(`${apiClient['baseUrl'] || 'http://localhost:5000'}${this.endpoint}/question-paper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          testId: payload.testId,
          title: payload.title || 'Question Paper',
          instructions: payload.instructions,
          columnLayout: payload.columnLayout || 'single',
          includeAnswers: payload.includeAnswers || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate question paper');
      }

      return await response.blob();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate question paper');
    }
  }

  /**
   * Generate a report card
   * @param payload - Report card generation payload
   * @returns Blob containing the generated Word document
   */
  async generateReportCard(payload: GenerateReportCardPayload): Promise<Blob> {
    try {
      const response = await fetch(`${apiClient['baseUrl'] || 'http://localhost:5000'}${this.endpoint}/report-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          studentId: payload.studentId,
          termId: payload.termId,
          columnLayout: payload.columnLayout || 'single',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report card');
      }

      return await response.blob();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate report card');
    }
  }

  /**
   * Generate a certificate
   * @param payload - Certificate generation payload
   * @returns Blob containing the generated Word document
   */
  async generateCertificate(payload: GenerateCertificatePayload): Promise<Blob> {
    try {
      const response = await fetch(`${apiClient['baseUrl'] || 'http://localhost:5000'}${this.endpoint}/certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          studentId: payload.studentId,
          certificateType: payload.certificateType,
          achievement: payload.achievement,
          date: payload.date || new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate certificate');
      }

      return await response.blob();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate certificate');
    }
  }

  /**
   * Generate study material
   * @param payload - Study material generation payload
   * @returns Blob containing the generated Word document
   */
  async generateStudyMaterial(payload: GenerateStudyMaterialPayload): Promise<Blob> {
    try {
      const response = await fetch(`${apiClient['baseUrl'] || 'http://localhost:5000'}${this.endpoint}/study-material`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          chapterId: payload.chapterId,
          includeQuestions: payload.includeQuestions !== false,
          columnLayout: payload.columnLayout || 'double',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate study material');
      }

      return await response.blob();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate study material');
    }
  }

  /**
   * Export question bank
   * @param payload - Question bank export payload
   * @returns Blob containing the generated Word document
   */
  async exportQuestionBank(payload: ExportQuestionBankPayload): Promise<Blob> {
    try {
      const response = await fetch(`${apiClient['baseUrl'] || 'http://localhost:5000'}${this.endpoint}/question-bank-export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          subjectId: payload.subjectId,
          classId: payload.classId,
          chapterId: payload.chapterId,
          columnLayout: payload.columnLayout || 'single',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export question bank');
      }

      return await response.blob();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to export question bank');
    }
  }

  /**
   * List generated documents
   * @param filters - Filter options
   * @returns Response with document list
   */
  async listGeneratedDocuments(filters?: {
    fileType?: string;
    page?: number;
    limit?: number;
  }): Promise<ListGeneratedDocumentsResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.fileType) params.append('fileType', filters.fileType);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const queryString = params.toString();
      const url = `${apiClient['baseUrl'] || 'http://localhost:5000'}${this.endpoint}/generated-documents${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to list documents');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to list documents');
    }
  }

  /**
   * Download a generated document
   * @param documentId - Document ID
   * @returns Blob containing the Word document
   */
  async downloadGeneratedDocument(documentId: string): Promise<Blob> {
    try {
      const response = await fetch(
        `${apiClient['baseUrl'] || 'http://localhost:5000'}${this.endpoint}/generated-documents/${documentId}/download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download document');
      }

      return await response.blob();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to download document');
    }
  }

  /**
   * Delete a generated document
   * @param documentId - Document ID
   */
  async deleteGeneratedDocument(documentId: string): Promise<void> {
    try {
      const response = await fetch(
        `${apiClient['baseUrl'] || 'http://localhost:5000'}${this.endpoint}/generated-documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete document');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete document');
    }
  }

  /**
   * Download blob as file
   * @param blob - Blob to download
   * @param filename - Filename for the download
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get authorization token from storage
   */
  private getToken(): string {
    if (typeof window === 'undefined') return '';

    try {
      const stored = localStorage.getItem('school-erp-auth');
      if (stored) {
        const authData = JSON.parse(stored);
        return authData.state?.accessToken || authData.accessToken || '';
      }
    } catch (e) {
      console.error('Failed to get token:', e);
    }

    return '';
  }
}

export const wordGenerationService = new WordGenerationService();

// API Client for School ERP Backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Builds a query string from an object of parameters
 * Filters out null/undefined values and encodes special characters
 */
function buildQueryString(params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    // Skip null and undefined values
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'An error occurred',
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(
    endpoint: string,
    token?: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const queryString = buildQueryString(params);
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET', token });
  }

  async post<T>(
    endpoint: string,
    body: any,
    token?: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const queryString = buildQueryString(params);
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    });
  }

  async put<T>(
    endpoint: string,
    body: any,
    token?: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const queryString = buildQueryString(params);
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      token,
    });
  }

  async patch<T>(
    endpoint: string,
    body: any,
    token?: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const queryString = buildQueryString(params);
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    });
  }

  async delete<T>(
    endpoint: string,
    token?: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const queryString = buildQueryString(params);
    return this.request<T>(`${endpoint}${queryString}`, { method: 'DELETE', token });
  }
}

export const api = new ApiClient(API_URL);

// Auth API functions
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    profilePicture?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/api/v1/auth/login', credentials),

  register: (data: RegisterData) =>
    api.post<AuthResponse>('/api/v1/auth/register', data),

  refreshToken: (refreshToken: string, token: string) =>
    api.post<{ accessToken: string; refreshToken: string }>(
      '/api/v1/auth/refresh-token',
      { refreshToken },
      token
    ),

  logout: (token: string) => api.post('/api/v1/auth/logout', {}, token),

  getProfile: (token: string) =>
    api.get<AuthResponse['user']>('/api/v1/auth/profile', token),

  changePassword: (
    data: { currentPassword: string; newPassword: string },
    token: string
  ) => api.post('/api/v1/auth/change-password', data, token),
};

// ==================== Types ====================

// Question Types
export type QuestionType =
  | 'MCQ'
  | 'TRUE_FALSE'
  | 'FILL_BLANK'
  | 'FILL_IN_BLANK'
  | 'SHORT_ANSWER'
  | 'LONG_ANSWER'
  | 'MATCHING'
  | 'MATCH_THE_FOLLOWING'
  | 'SINGLE_CORRECT'
  | 'MULTIPLE_CORRECT'
  | 'INTEGER_TYPE'
  | 'NUMERICAL'
  | 'MATRIX_MATCH'
  | 'ASSERTION_REASONING'
  | 'COMPREHENSION';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionSource = 'EXTRACTED' | 'GENERATED' | 'MANUAL';
export type PatternType = 'JEE_MAIN' | 'JEE_ADVANCED' | 'NEET' | 'CUSTOM';

export interface Question {
  id: string;
  questionText: string;
  questionHtml?: string;
  questionImage?: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  options?: { id: string; text: string }[];
  correctAnswer?: string;
  correctAnswers?: string[]; // For multiple correct answers
  explanation?: string;
  subject?: { id: string; name: string };
  subjectId?: string;
  class?: { id: string; name: string };
  classId?: string;
  chapter?: string;
  topic?: string;
  tags?: string[];
  isVerified: boolean;
  source: QuestionSource;
  createdAt: string;
  updatedAt: string;
  // For matrix match questions
  matrixColumns?: {
    columnA: { id: string; text: string }[];
    columnB: { id: string; text: string }[];
  };
}

export interface CreateQuestionData {
  questionText: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  subjectId: string;
  chapter?: string;
  topic?: string;
  tags?: string[];
}

// Test Types
export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type TestType = 'PRACTICE' | 'GRADED' | 'MOCK' | 'ASSIGNMENT';
export type AttemptStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'ABANDONED';

export interface Test {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  subject?: { id: string; name: string };
  subjectId: string;
  class?: { id: string; name: string };
  classId: string;
  section?: { id: string; name: string };
  sectionId?: string;
  totalMarks: number;
  passingMarks: number;
  duration: number; // in minutes
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
  startDateTime?: string;
  endDateTime?: string;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  showAnswers: boolean;
  allowReview: boolean;
  status: TestStatus;
  testType: TestType;
  questionCount?: number;
  attemptCount?: number;
  averageScore?: number;
  questions?: TestQuestion[];
  _count?: { questions?: number; attempts?: number };
  createdAt: string;
  updatedAt: string;
}

export interface TestQuestion {
  id: string;
  testId: string;
  questionId: string;
  question: Question;
  order: number;
  marks: number;
}

export interface CreateTestData {
  title: string;
  description?: string;
  instructions?: string;
  subjectId: string;
  classId: string;
  sectionId?: string;
  totalMarks: number;
  passingMarks: number;
  duration: number;
  startTime?: string;
  endTime?: string;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  showAnswers?: boolean;
  allowReview?: boolean;
  testType?: TestType;
  questionIds: string[];
}

export interface TestAttempt {
  id: string;
  testId: string;
  test?: {
    id: string;
    title: string;
    description?: string;
    instructions?: string;
    durationMinutes: number;
    totalMarks: number;
    passingMarks?: number;
    shuffleOptions: boolean;
    showResultsImmediately: boolean;
    showCorrectAnswers: boolean;
    allowReview: boolean;
  };
  studentId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  totalScore?: number;
  percentage?: number;
  questionsAnswered: number;
  correctAnswers: number;
  status: AttemptStatus;
  responses?: TestResponse[];
}

export interface TestResponse {
  id: string;
  attemptId: string;
  testQuestionId: string;
  testQuestion?: {
    id: string;
    sequenceOrder: number;
    marks: number;
    negativeMarks: number;
    question: {
      id: string;
      questionText: string;
      questionHtml?: string;
      questionImage?: string;
      questionType: QuestionType;
      options?: { id: string; text: string; isCorrect?: boolean }[];
      marks: number;
      negativeMarks?: number;
      correctAnswer?: string;
      answerExplanation?: string;
      matrixColumns?: {
        columnA: { id: string; text: string }[];
        columnB: { id: string; text: string }[];
      };
    };
  };
  selectedOptions?: string[];
  responseText?: string;
  isCorrect?: boolean;
  marksObtained?: number;
  timeSpentSeconds?: number;
  answeredAt?: string;
  flaggedForReview: boolean;
}

// Document Types
export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface UploadedDocument {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  subjectId?: string;
  subject?: { id: string; name: string };
  classId?: string;
  class?: { id: string; name: string };
  extractedQuestions?: number;
  processingError?: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Types
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalTests: number;
  totalQuestions: number;
  attendanceToday: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  recentActivity: {
    type: string;
    message: string;
    time: string;
  }[];
  upcomingEvents: {
    title: string;
    date: string;
    type: string;
  }[];
}

export interface StudentDashboardStats {
  upcomingTests: Test[];
  recentResults: TestAttempt[];
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  assignmentsDue: number;
  classScheduleToday: {
    subject: string;
    time: string;
    teacher: string;
  }[];
}

// Subject & Class Types
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Class {
  id: string;
  name: string;
  section?: string;
  academicYear?: string;
  displayOrder?: number;
  _count?: {
    students?: number;
  };
}

// Pattern Types
export interface PatternSection {
  name: string;
  subjectId?: string;           // Subject for this section
  subjectCode?: string;         // Subject code (PHY, CHEM, MATH, etc.)
  subjectName?: string;         // Subject name for display
  questionCount: number;
  marksPerQuestion: number;
  negativeMarks: number;
  questionTypes: QuestionType[];
  questionRange?: {             // Question range for Word file mapping
    start: number;              // e.g., 1
    end: number;                // e.g., 25
  };
  duration?: number;            // Duration in minutes for this section
  partialMarking?: boolean;     // Enable partial marking for this section
  isOptional?: boolean;
  optionalCount?: number;
}

export interface TestPattern {
  id: string;
  name: string;
  patternType: PatternType;
  isDefault: boolean;
  sections: PatternSection[];
  scoringRules: {
    partialMarking?: boolean;
    partialMarkingRules?: Record<string, number>;
    negativeMarkingEnabled?: boolean;
  };
  totalMarks: number;
  totalQuestions: number;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatternData {
  name: string;
  patternType?: PatternType;
  sections: PatternSection[];
  scoringRules?: TestPattern['scoringRules'];
  totalMarks: number;
  totalQuestions: number;
  totalDuration: number;
}

// Chapter Types
export interface Chapter {
  id: string;
  name: string;
  chapterNumber: number;
  subjectId: string;
  subject?: Subject;
  description?: string;
  questionCount?: number;
}

// ==================== API Services ====================

// Questions API
export const questionsApi = {
  getAll: (token: string, params?: {
    page?: number;
    limit?: number;
    subjectId?: string;
    questionType?: QuestionType;
    difficulty?: DifficultyLevel;
    isVerified?: boolean;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return api.get<{ questions: Question[]; total: number; page: number; limit: number }>(
      `/api/v1/questions${queryString ? `?${queryString}` : ''}`,
      token
    );
  },

  getById: (id: string, token: string) =>
    api.get<Question>(`/api/v1/questions/${id}`, token),

  getStats: (token: string) =>
    api.get<{
      total: number;
      verified: number;
      byType: Record<QuestionType, number>;
      byDifficulty: Record<DifficultyLevel, number>;
      bySource: Record<QuestionSource, number>;
    }>('/api/v1/questions/stats', token),

  create: (data: CreateQuestionData, token: string) =>
    api.post<Question>('/api/v1/questions', data, token),

  bulkCreate: (questions: CreateQuestionData[], token: string) =>
    api.post<{ created: number; questions: Question[] }>('/api/v1/questions/bulk', { questions }, token),

  update: (id: string, data: Partial<CreateQuestionData>, token: string) =>
    api.put<Question>(`/api/v1/questions/${id}`, data, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/questions/${id}`, token),

  verify: (id: string, token: string) =>
    api.patch<Question>(`/api/v1/questions/${id}/verify`, {}, token),

  getChaptersAndTopics: (subjectId: string, token: string) =>
    api.get<{ chapters: string[]; topics: Record<string, string[]> }>(
      `/api/v1/questions/subject/${subjectId}/chapters`,
      token
    ),

  getRandom: (data: {
    subjectId: string;
    count: number;
    difficulty?: DifficultyLevel;
    questionTypes?: QuestionType[];
  }, token: string) =>
    api.post<Question[]>('/api/v1/questions/random', data, token),
};

// Tests API
export const testsApi = {
  getAll: (token: string, params?: {
    page?: number;
    limit?: number;
    subjectId?: string;
    classId?: string;
    status?: TestStatus;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return api.get<{ tests: Test[]; total: number; page: number; limit: number }>(
      `/api/v1/tests${queryString ? `?${queryString}` : ''}`,
      token
    );
  },

  getById: (id: string, token: string) =>
    api.get<Test>(`/api/v1/tests/${id}`, token),

  getAnalytics: (id: string, token: string) =>
    api.get<{
      totalAttempts: number;
      averageScore: number;
      highestScore: number;
      lowestScore: number;
      passRate: number;
      questionAnalytics: {
        questionId: string;
        correctRate: number;
        averageTime: number;
      }[];
    }>(`/api/v1/tests/${id}/analytics`, token),

  create: (data: CreateTestData, token: string) =>
    api.post<Test>('/api/v1/tests', data, token),

  update: (id: string, data: Partial<CreateTestData>, token: string) =>
    api.put<Test>(`/api/v1/tests/${id}`, data, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/tests/${id}`, token),

  publish: (id: string, token: string) =>
    api.post<Test>(`/api/v1/tests/${id}/publish`, {}, token),

  close: (id: string, token: string) =>
    api.post<Test>(`/api/v1/tests/${id}/close`, {}, token),

  // Student-specific endpoints
  getAvailable: (studentId: string, token: string) =>
    api.get<Test[]>(`/api/v1/tests/available/${studentId}`, token),

  startAttempt: (data: { testId: string; studentId: string }, token: string) =>
    api.post<TestAttempt>('/api/v1/tests/start', data, token),

  saveResponse: (data: {
    attemptId: string;
    questionId: string;
    selectedAnswer?: string[];
    textAnswer?: string;
  }, token: string) =>
    api.post<{ success: boolean }>('/api/v1/tests/save-response', data, token),

  submitTest: (data: {
    attemptId: string;
    responses: {
      testQuestionId: string;
      selectedOptions?: string[];
      responseText?: string;
      timeSpentSeconds?: number;
    }[];
  }, token: string) =>
    api.post<TestAttempt>('/api/v1/tests/submit', data, token),

  getAttempt: (attemptId: string, token: string) =>
    api.get<TestAttempt>(`/api/v1/tests/attempts/${attemptId}`, token),

  getStudentAttempts: (studentId: string, token: string) =>
    api.get<TestAttempt[]>(`/api/v1/tests/student/${studentId}/attempts`, token),

  getResults: (attemptId: string, token: string) =>
    api.get<TestAttempt>(`/api/v1/tests/attempts/${attemptId}/results`, token),

  duplicate: (id: string, newTitle: string, token: string) =>
    api.post<Test>(`/api/v1/tests/${id}/duplicate`, { title: newTitle }, token),

  assign: (id: string, data: { classId?: string; sectionId?: string }, token: string) =>
    api.post<Test>(`/api/v1/tests/${id}/assign`, data, token),
};

// Test Upload API (Pattern-based Word file upload)
export const testUploadApi = {
  // Parse Word file with pattern
  parseWithPattern: async (file: File, patternId: string, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patternId', patternId);

    const response = await fetch(`${API_URL}/api/v1/tests/upload/parse`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return {
      success: response.ok,
      data: response.ok ? data.data : undefined,
      error: !response.ok ? data.error || 'Failed to parse file' : undefined,
    };
  },

  // Create test from parsed questions
  createTestFromParsed: (data: {
    testName: string;
    description?: string;
    patternId: string;
    subjectId: string; // Primary subject for the test
    subjectIds?: string[]; // All subjects (for multi-subject tests)
    classId: string;
    sectionId?: string;
    durationMinutes: number;
    questions: any[];
    publish?: boolean;
  }, token: string) =>
    api.post<Test>('/api/v1/tests/upload/create', data, token),

  // Upload and create test in one step
  uploadAndCreate: async (file: File, data: {
    title: string;
    description?: string;
    patternId: string;
    classId: string;
    sectionId?: string;
    publish?: boolean;
  }, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('patternId', data.patternId);
    formData.append('classId', data.classId);
    if (data.sectionId) formData.append('sectionId', data.sectionId);
    if (data.publish) formData.append('publish', 'true');

    const response = await fetch(`${API_URL}/api/v1/tests/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    return {
      success: response.ok,
      data: response.ok ? result.data : undefined,
      error: !response.ok ? result.error || 'Failed to upload' : undefined,
    };
  },

  // Verify questions with AI
  verifyWithAI: (questions: any[], token: string) =>
    api.post<{
      verificationResults: {
        questionNumber: number;
        isCorrect: boolean;
        confidence: 'high' | 'medium' | 'low';
        aiSolution?: string;
        suggestedAnswer?: string;
        reasoning?: string;
      }[];
      summary: {
        total: number;
        verified: number;
        needsReview: number;
        highConfidence: number;
        mediumConfidence: number;
        lowConfidence: number;
      };
    }>('/api/v1/tests/upload/verify-with-ai', { questions }, token),
};

// Documents API
export const documentsApi = {
  getAll: (token: string, params?: {
    page?: number;
    limit?: number;
    status?: DocumentStatus;
    subjectId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return api.get<{ documents: UploadedDocument[]; total: number }>(
      `/api/v1/documents${queryString ? `?${queryString}` : ''}`,
      token
    );
  },

  getById: (id: string, token: string) =>
    api.get<UploadedDocument>(`/api/v1/documents/${id}`, token),

  getStats: (token: string) =>
    api.get<{
      total: number;
      processing: number;
      completed: number;
      failed: number;
      totalQuestionsExtracted: number;
    }>('/api/v1/documents/stats', token),

  upload: async (file: File, data: { subjectId?: string; classId?: string; chapter?: string }, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (data.subjectId) formData.append('subjectId', data.subjectId);
    if (data.classId) formData.append('classId', data.classId);
    if (data.chapter) formData.append('chapter', data.chapter);

    try {
      const response = await fetch(`${API_URL}/api/v1/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || result.error || 'Upload failed',
        };
      }

      return {
        success: true,
        data: result.data || result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  process: (id: string, token: string) =>
    api.post<UploadedDocument>(`/api/v1/documents/${id}/process`, {}, token),

  addQuestions: (id: string, questions: CreateQuestionData[], token: string) =>
    api.post<{ created: number }>(`/api/v1/documents/${id}/questions`, { questions }, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/documents/${id}`, token),
};

// Dashboard API
export const dashboardApi = {
  getAdminDashboard: (token: string) =>
    api.get<{
      stats: {
        totalStudents: number;
        totalTeachers: number;
        totalClasses: number;
        feeCollection: number;
        studentChange?: string;
        teacherChange?: string;
        classChange?: string;
        feeChange?: string;
      };
      recentActivities: {
        id: string | number;
        type: string;
        message: string;
        time: string;
      }[];
      upcomingEvents: {
        id: string | number;
        title: string;
        date: string;
        time: string;
        type: string;
        color: string;
      }[];
      pendingTasks: {
        id: string | number;
        task: string;
        priority: string;
        progress: number;
      }[];
    }>('/api/v1/dashboard/admin', token),

  getTeacherDashboard: (token: string) =>
    api.get<{
      myClasses: { id: string; name: string; studentCount: number }[];
      todaySchedule: { subject: string; class: string; time: string }[];
      pendingAssignments: number;
      recentTests: Test[];
    }>('/api/v1/dashboard/teacher', token),

  getStudentDashboard: (token: string) =>
    api.get<StudentDashboardStats>('/api/v1/dashboard/student', token),

  getParentDashboard: (token: string) =>
    api.get<{
      children: {
        id: string;
        name: string;
        class: string;
        attendance: number;
        recentGrades: { subject: string; score: number }[];
      }[];
      pendingFees: number;
      announcements: { title: string; date: string }[];
    }>('/api/v1/dashboard/parent', token),
};

// Subjects API
export const subjectsApi = {
  getAll: (token: string) =>
    api.get<Subject[]>('/api/v1/subjects', token),

  getById: (id: string, token: string) =>
    api.get<Subject>(`/api/v1/subjects/${id}`, token),

  create: (data: { name: string; code?: string; description?: string }, token: string) =>
    api.post<Subject>('/api/v1/subjects', data, token),

  update: (id: string, data: { name?: string; code?: string; description?: string }, token: string) =>
    api.put<Subject>(`/api/v1/subjects/${id}`, data, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/subjects/${id}`, token),
};

// Section type
export interface Section {
  id: string;
  name: string;
  capacity: number;
  classTeacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    students: number;
  };
}

// Classes API
export const classesApi = {
  getAll: (token: string) =>
    api.get<Class[]>('/api/v1/classes', token),

  getById: (id: string, token: string) =>
    api.get<Class>(`/api/v1/classes/${id}`, token),

  create: (data: { name: string; displayOrder?: number }, token: string) =>
    api.post<Class>('/api/v1/classes', data, token),

  update: (id: string, data: { name?: string; displayOrder?: number }, token: string) =>
    api.put<Class>(`/api/v1/classes/${id}`, data, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/classes/${id}`, token),

  getSections: (classId: string, token: string) =>
    api.get<Section[]>(`/api/v1/classes/${classId}/sections`, token),

  getStudents: (classId: string, token: string, sectionId?: string) => {
    const url = sectionId
      ? `/api/v1/classes/${classId}/students?sectionId=${sectionId}`
      : `/api/v1/classes/${classId}/students`;
    return api.get<{ id: string; firstName: string; lastName: string; admissionNo: string; rollNo?: string }[]>(
      url,
      token
    );
  },

  createSection: (classId: string, data: { name: string; capacity?: number }, token: string) =>
    api.post<Section>(`/api/v1/classes/${classId}/sections`, data, token),

  updateSection: (sectionId: string, data: { name?: string; capacity?: number; classTeacherId?: string | null }, token: string) =>
    api.put<Section>(`/api/v1/classes/sections/${sectionId}`, data, token),

  deleteSection: (sectionId: string, token: string) =>
    api.delete(`/api/v1/classes/sections/${sectionId}`, token),
};

// Patterns API
export const patternsApi = {
  getAll: (token: string, params?: { patternType?: PatternType; isDefault?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return api.get<TestPattern[]>(
      `/api/v1/patterns${queryString ? `?${queryString}` : ''}`,
      token
    );
  },

  getById: (id: string, token: string) =>
    api.get<TestPattern>(`/api/v1/patterns/${id}`, token),

  getDefaults: (token: string) =>
    api.get<TestPattern[]>('/api/v1/patterns/defaults', token),

  create: (data: CreatePatternData, token: string) =>
    api.post<TestPattern>('/api/v1/patterns', data, token),

  update: (id: string, data: Partial<CreatePatternData>, token: string) =>
    api.put<TestPattern>(`/api/v1/patterns/${id}`, data, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/patterns/${id}`, token),
};

// Chapters API
export const chaptersApi = {
  getAll: (token: string, params?: { subjectId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.subjectId) {
      searchParams.append('subjectId', params.subjectId);
    }
    const queryString = searchParams.toString();
    return api.get<Chapter[]>(
      `/api/v1/chapters${queryString ? `?${queryString}` : ''}`,
      token
    );
  },

  getById: (id: string, token: string) =>
    api.get<Chapter>(`/api/v1/chapters/${id}`, token),

  getBySubject: (subjectId: string, token: string) =>
    api.get<Chapter[]>(`/api/v1/chapters/subject/${subjectId}`, token),

  getQuestions: (chapterId: string, token: string, params?: { questionType?: QuestionType; difficulty?: DifficultyLevel }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return api.get<Question[]>(
      `/api/v1/chapters/${chapterId}/questions${queryString ? `?${queryString}` : ''}`,
      token
    );
  },
};

// ==================== Result Analysis Types ====================

export interface TopicPerformance {
  topic: string;
  chapterId?: string;
  chapterName?: string;
  correct: number;
  total: number;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface QuestionTypePerformance {
  type: QuestionType;
  correct: number;
  total: number;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface TimeAnalysis {
  totalTimeSeconds: number;
  avgTimePerQuestion: number;
  fastestQuestionTime: number;
  slowestQuestionTime: number;
  questionsUnderAvgTime: number;
  questionsOverAvgTime: number;
}

export interface ComparisonStats {
  yourScore: number;
  topperScore: number;
  classAverage: number;
  lowestScore: number;
  yourRank: number;
  totalStudents: number;
  percentile: number;
  scoreDifference: {
    fromTopper: number;
    fromAverage: number;
  };
}

export interface DetailedAnalysis {
  attemptId: string;
  test: {
    id: string;
    title: string;
    subject: { id: string; name: string; code: string };
    class: { id: string; name: string };
    totalMarks: number;
    passingMarks: number;
    durationMinutes: number;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    rollNo: string | null;
  };
  overview: {
    score: number;
    totalMarks: number;
    percentage: number;
    isPassed: boolean;
    rank: number;
    totalStudents: number;
    percentile: number;
    questionsAnswered: number;
    correctAnswers: number;
    totalQuestions: number;
    timeTaken: number;
    submittedAt: string | null;
  };
  comparison: ComparisonStats;
  topicWise: TopicPerformance[];
  questionTypeWise: QuestionTypePerformance[];
  timeAnalysis: TimeAnalysis;
  weakAreas: string[];
  strengths: string[];
  questionBreakdown: {
    questionId: string;
    questionText: string;
    questionType: QuestionType;
    chapter: string;
    topic: string;
    marks: number;
    marksObtained: number;
    isCorrect: boolean | null;
    timeSpent: number;
    selectedOptions: any;
    correctAnswer: string | null;
  }[];
}

export interface PerformanceInsights {
  attemptId: string;
  insights: string[];
  recommendations: string[];
  summary: {
    overallGrade: string;
    performanceLevel: string;
    improvement: number;
    strongestTopic: string | null;
    weakestTopic: string | null;
  };
}

export interface AIExplanation {
  explanation: string;
  concept: string;
  formula?: string;
  steps: string[];
  commonMistake?: string;
  tip?: string;
}

export interface ShortcutsResponse {
  shortcuts: {
    title: string;
    description: string;
    example?: string;
  }[];
  timeEstimate: string;
  applicableTo: string[];
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
}

export interface YouTubeChannel {
  name: string;
  description: string;
  url: string;
}

// ==================== Reports Types ====================

export interface TestReport {
  test: {
    id: string;
    title: string;
    subject: { id: string; name: string; code: string };
    class: { id: string; name: string };
    section?: { id: string; name: string };
    totalMarks: number;
    passingMarks: number;
    durationMinutes: number;
    totalQuestions: number;
    status: TestStatus;
    startDateTime: string | null;
    endDateTime: string | null;
  };
  stats: {
    totalAttempts: number;
    completedAttempts: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    medianScore: number;
    passCount: number;
    failCount: number;
    averagePercentage: number;
    passRate: number;
  };
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  studentPerformances: {
    studentId: string;
    studentName: string;
    rollNo: string | null;
    score: number;
    percentage: number;
    rank: number;
    status: 'PASS' | 'FAIL' | 'NOT_ATTEMPTED';
    submittedAt: string | null;
  }[];
  topPerformers: {
    studentId: string;
    studentName: string;
    rollNo: string | null;
    score: number;
    percentage: number;
    rank: number;
    status: 'PASS' | 'FAIL' | 'NOT_ATTEMPTED';
    submittedAt: string | null;
  }[];
  studentsNeedingAttention: {
    studentId: string;
    studentName: string;
    rollNo: string | null;
    score: number;
    percentage: number;
    rank: number;
    status: 'PASS' | 'FAIL' | 'NOT_ATTEMPTED';
    submittedAt: string | null;
  }[];
  questionAnalysis: {
    questionId: string;
    questionText: string;
    questionType: string;
    totalAttempts: number;
    correctAttempts: number;
    successRate: number;
    avgTimeSeconds: number;
  }[];
}

export interface ClassReport {
  class: {
    id: string;
    name: string;
    sections: { id: string; name: string }[];
  };
  summary: {
    totalTests: number;
    totalAttempts: number;
    subjectsCount: number;
    studentsCount: number;
  };
  subjectPerformance: {
    subjectId: string;
    subjectName: string;
    testCount: number;
    avgScore: number;
    totalAttempts: number;
  }[];
  topPerformers: {
    studentId: string;
    studentName: string;
    rollNo: string | null;
    testsTaken: number;
    avgPercentage: number;
    rank: number;
  }[];
  studentsNeedingSupport: {
    studentId: string;
    studentName: string;
    rollNo: string | null;
    testsTaken: number;
    avgPercentage: number;
    rank: number;
  }[];
  allStudents: {
    studentId: string;
    studentName: string;
    rollNo: string | null;
    testsTaken: number;
    avgPercentage: number;
    rank: number;
  }[];
}

export interface StudentReport {
  student: {
    id: string;
    name: string;
    rollNo: string | null;
    class: { id: string; name: string } | null;
    section: { id: string; name: string } | null;
  };
  overallStats: {
    totalTests: number;
    averagePercentage: number;
    bestPercentage: number;
    worstPercentage: number;
    testsAbove80: number;
    testsBelow50: number;
  };
  subjectWise: {
    subjectId: string;
    subjectName: string;
    testCount: number;
    avgPercentage: number;
  }[];
  chapterPerformance: {
    chapterId: string;
    chapterName: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
  weakChapters: {
    chapterId: string;
    chapterName: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
  progressTrend: {
    index: number;
    testTitle: string;
    percentage: number;
    date: string | null;
  }[];
  testHistory: {
    testId: string;
    testTitle: string;
    subject: { id: string; name: string; code: string };
    score: number;
    totalMarks: number;
    percentage: number;
    submittedAt: string | null;
    questionsAnswered: number;
    correctAnswers: number;
  }[];
  recommendations: string[];
}

// ==================== Results API ====================

export const resultsApi = {
  // Analysis endpoints
  getDetailedAnalysis: (attemptId: string, token: string) =>
    api.get<DetailedAnalysis>(`/api/v1/results/${attemptId}/analysis`, token),

  getComparisonStats: (attemptId: string, token: string) =>
    api.get<ComparisonStats>(`/api/v1/results/${attemptId}/comparison`, token),

  getPerformanceInsights: (attemptId: string, token: string) =>
    api.get<PerformanceInsights>(`/api/v1/results/${attemptId}/insights`, token),

  getSubjectWeakAreas: (studentId: string, subjectId: string, token: string) =>
    api.get<{
      studentId: string;
      subjectId: string;
      totalAttempts: number;
      chapterStats: { chapterId: string; chapterName: string; correct: number; total: number; percentage: number }[];
      weakChapters: { chapterId: string; chapterName: string; correct: number; total: number; percentage: number }[];
      strongChapters: { chapterId: string; chapterName: string; correct: number; total: number; percentage: number }[];
      recommendations: { chapter: string; message: string }[];
    }>(`/api/v1/results/student/${studentId}/weak-areas?subjectId=${subjectId}`, token),

  // AI Doubt Clearing endpoints
  explainQuestion: (questionId: string, query: string | undefined, token: string) =>
    api.post<AIExplanation>(`/api/v1/results/question/${questionId}/explain`, { query }, token),

  getShortcutsTricks: (questionId: string, token: string) =>
    api.get<ShortcutsResponse>(`/api/v1/results/question/${questionId}/shortcuts`, token),

  getSimilarQuestions: (questionId: string, token: string, limit?: number) =>
    api.get<{
      id: string;
      questionText: string;
      questionType: QuestionType;
      difficulty: DifficultyLevel;
      topic: string | null;
      chapter: string | null;
    }[]>(`/api/v1/results/question/${questionId}/similar${limit ? `?limit=${limit}` : ''}`, token),

  analyzeWrongAnswer: (questionId: string, selectedAnswer: string, correctAnswer: string, token: string) =>
    api.post<{
      analysis: string;
      conceptGap: string;
      suggestion: string;
    }>(`/api/v1/results/question/${questionId}/analyze-wrong`, { selectedAnswer, correctAnswer }, token),

  getQuestionInsights: (questionId: string, token: string) =>
    api.get<{
      questionId: string;
      question: {
        text: string;
        type: QuestionType;
        difficulty: DifficultyLevel;
        correctAnswer: string | null;
        explanation: string | null;
      } | null;
      stats: {
        totalAttempts: number;
        correctAttempts: number;
        successRate: number;
        avgTimeSeconds: number;
        difficultyRating: string;
      };
      commonMistakes: { answer: string; count: number; percentage: number }[];
    }>(`/api/v1/results/question/${questionId}/insights`, token),

  // YouTube Video endpoints
  getQuestionVideos: (questionId: string, token: string) =>
    api.get<{
      videos: YouTubeVideo[];
      channels: YouTubeChannel[];
    }>(`/api/v1/results/question/${questionId}/videos`, token),

  searchVideos: (query: string, token: string, params?: { maxResults?: number; language?: string }) => {
    const searchParams = new URLSearchParams({ query });
    if (params?.maxResults) searchParams.append('maxResults', String(params.maxResults));
    if (params?.language) searchParams.append('language', params.language);
    return api.get<YouTubeVideo[]>(`/api/v1/results/videos/search?${searchParams.toString()}`, token);
  },

  getVideosByTopic: (subject: string, token: string, params?: { chapter?: string; topic?: string }) => {
    const searchParams = new URLSearchParams({ subject });
    if (params?.chapter) searchParams.append('chapter', params.chapter);
    if (params?.topic) searchParams.append('topic', params.topic);
    return api.get<YouTubeVideo[]>(`/api/v1/results/videos/topics?${searchParams.toString()}`, token);
  },

  getCuratedChannels: (token: string) =>
    api.get<YouTubeChannel[]>('/api/v1/results/channels', token),
};

// ==================== Reports API ====================

export const reportsApi = {
  // Test Reports (Teacher/Admin)
  getTestReport: (testId: string, token: string) =>
    api.get<TestReport>(`/api/v1/reports/test/${testId}`, token),

  getTestExportData: (testId: string, token: string) =>
    api.get<{
      testTitle: string;
      subject: string;
      class: string;
      totalMarks: number;
      data: {
        rank: number;
        rollNo: string;
        admissionNo: string;
        studentName: string;
        score: number;
        percentage: number;
        questionsAnswered: number;
        correctAnswers: number;
        submittedAt: string | null;
      }[];
    }>(`/api/v1/reports/test/${testId}/export`, token),

  exportTestReportCsv: async (testId: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/reports/test/${testId}/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Export failed' };
    }
  },

  // Class Reports (Teacher/Admin)
  getClassReport: (classId: string, token: string, params?: { subjectId?: string; dateFrom?: string; dateTo?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.subjectId) searchParams.append('subjectId', params.subjectId);
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
    const queryString = searchParams.toString();
    return api.get<ClassReport>(`/api/v1/reports/class/${classId}${queryString ? `?${queryString}` : ''}`, token);
  },

  // Student Reports
  getStudentReport: (studentId: string, token: string, params?: { subjectId?: string; dateFrom?: string; dateTo?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.subjectId) searchParams.append('subjectId', params.subjectId);
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
    const queryString = searchParams.toString();
    return api.get<StudentReport>(`/api/v1/reports/student/${studentId}${queryString ? `?${queryString}` : ''}`, token);
  },

  // Dashboard
  getDashboardSummary: (token: string) =>
    api.get<{ message: string; endpoints: Record<string, string> }>('/api/v1/reports/dashboard', token),
};

// ==================== Books/Library Types ====================

export type BookSourceType = 'LOCAL_FILE' | 'EXTERNAL_URL';
export type BookStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AnnotationType = 'HIGHLIGHT' | 'NOTE' | 'FREEHAND' | 'SHAPE' | 'STAMP' | 'BOOKMARK';

export interface BookCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: BookCategory;
  children?: BookCategory[];
  boardType?: string;
  classLevel?: string;
  subjectCode?: string;
  displayOrder: number;
  iconName?: string;
  isActive: boolean;
  _count?: { books: number };
}

export interface Book {
  id: string;
  title: string;
  description?: string;
  author?: string;
  coverImage?: string;
  sourceType: BookSourceType;
  fileName?: string;
  originalName?: string;
  fileSize?: number;
  storagePath?: string;
  pageCount?: number;
  externalUrl?: string;
  externalProvider?: string;
  categoryId: string;
  category?: BookCategory;
  subjectId?: string;
  subject?: Subject;
  classLevel?: string;
  chapterNumber?: number;
  isIndexed: boolean;
  status: BookStatus;
  uploadedById: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BookAccess {
  id: string;
  bookId: string;
  book?: Book;
  classId: string;
  class?: Class;
  sectionId?: string;
  section?: Section;
  canDownload: boolean;
  canAnnotate: boolean;
  availableFrom?: string;
  availableUntil?: string;
}

export interface BookAnnotation {
  id: string;
  bookId: string;
  userId: string;
  pageNumber: number;
  annotationType: AnnotationType;
  selectedText?: string;
  textRanges?: any;
  highlightColor?: string;
  noteContent?: string;
  notePosition?: any;
  drawingPaths?: any;
  strokeColor?: string;
  strokeWidth?: number;
  shapeType?: string;
  shapeData?: any;
  fillColor?: string;
  stampType?: string;
  canvasState?: any;
  isPrivate: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string };
}

export interface BookQAResponse {
  id?: string;
  answer: string;
  answerHtml?: string;
  sourcePages: number[];
  confidence: number;
  cached: boolean;
  cacheType?: 'exact' | 'semantic';
  tokensUsed?: number;
}

export interface PopularQuestion {
  id: string;
  question: string;
  useCount: number;
  lastUsedAt: string;
}

export interface CreateBookCategoryData {
  name: string;
  description?: string;
  parentId?: string;
  boardType?: string;
  classLevel?: string;
  subjectCode?: string;
  displayOrder?: number;
  iconName?: string;
}

export interface CreateBookAccessData {
  classId: string;
  sectionId?: string;
  canDownload?: boolean;
  canAnnotate?: boolean;
  availableFrom?: string;
  availableUntil?: string;
}

export interface CreateAnnotationData {
  pageNumber: number;
  annotationType: AnnotationType;
  selectedText?: string;
  textRanges?: any;
  highlightColor?: string;
  noteContent?: string;
  notePosition?: any;
  drawingPaths?: any;
  strokeColor?: string;
  strokeWidth?: number;
  shapeType?: string;
  shapeData?: any;
  fillColor?: string;
  stampType?: string;
  canvasState?: any;
  isPrivate?: boolean;
  isShared?: boolean;
}

// ==================== Books API ====================

export const booksApi = {
  // ==================== Categories ====================
  getCategories: (token: string) =>
    api.get<BookCategory[]>('/api/v1/books/categories', token),

  getCategoryById: (id: string, token: string) =>
    api.get<BookCategory>(`/api/v1/books/categories/${id}`, token),

  createCategory: (data: CreateBookCategoryData, token: string) =>
    api.post<BookCategory>('/api/v1/books/categories', data, token),

  updateCategory: (id: string, data: Partial<CreateBookCategoryData>, token: string) =>
    api.put<BookCategory>(`/api/v1/books/categories/${id}`, data, token),

  deleteCategory: (id: string, token: string) =>
    api.delete(`/api/v1/books/categories/${id}`, token),

  // ==================== Books ====================
  getAll: (token: string, params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    subjectId?: string;
    classLevel?: string;
    status?: BookStatus;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return api.get<{ books: Book[]; total: number; page: number; limit: number }>(
      `/api/v1/books${queryString ? `?${queryString}` : ''}`,
      token
    );
  },

  getAvailable: (token: string, params?: {
    categoryId?: string;
    subjectId?: string;
    classLevel?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return api.get<Book[]>(
      `/api/v1/books/available${queryString ? `?${queryString}` : ''}`,
      token
    );
  },

  getById: (id: string, token: string) =>
    api.get<Book>(`/api/v1/books/${id}`, token),

  getFileUrl: (id: string, token?: string) => {
    const baseUrl = `${API_URL}/api/v1/books/${id}/file`;
    return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
  },

  upload: async (file: File, data: {
    title: string;
    description?: string;
    author?: string;
    categoryId: string;
    subjectId?: string;
    classLevel?: string;
    chapterNumber?: number;
    tags?: string[];
  }, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    try {
      const response = await fetch(`${API_URL}/api/v1/books`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.message || result.error || 'Upload failed' };
      }
      return { success: true, data: result.data || result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  addExternal: (data: {
    title: string;
    description?: string;
    author?: string;
    externalUrl: string;
    externalProvider?: string;
    categoryId: string;
    subjectId?: string;
    classLevel?: string;
    chapterNumber?: number;
    tags?: string[];
  }, token: string) =>
    api.post<Book>('/api/v1/books/external', data, token),

  bulkUpload: async (files: File[], data: {
    categoryId: string;
    subjectId?: string;
    classLevel?: string;
  }, token: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    try {
      const response = await fetch(`${API_URL}/api/v1/books/bulk-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.message || result.error || 'Bulk upload failed' };
      }
      return { success: true, data: result.data || result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  update: (id: string, data: Partial<{
    title: string;
    description: string;
    author: string;
    categoryId: string;
    subjectId: string;
    classLevel: string;
    chapterNumber: number;
    tags: string[];
  }>, token: string) =>
    api.put<Book>(`/api/v1/books/${id}`, data, token),

  publish: (id: string, token: string) =>
    api.post<Book>(`/api/v1/books/${id}/publish`, {}, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/books/${id}`, token),

  // ==================== Access Control ====================
  getAccess: (bookId: string, token: string) =>
    api.get<BookAccess[]>(`/api/v1/books/${bookId}/access`, token),

  grantAccess: (bookId: string, data: CreateBookAccessData, token: string) =>
    api.post<BookAccess>(`/api/v1/books/${bookId}/access`, data, token),

  updateAccess: (bookId: string, accessId: string, data: Partial<CreateBookAccessData>, token: string) =>
    api.put<BookAccess>(`/api/v1/books/${bookId}/access/${accessId}`, data, token),

  revokeAccess: (bookId: string, accessId: string, token: string) =>
    api.delete(`/api/v1/books/${bookId}/access/${accessId}`, token),

  // ==================== AI Q&A ====================
  askQuestion: (bookId: string, question: string, token: string) =>
    api.post<BookQAResponse>(`/api/v1/books/${bookId}/ask`, { question }, token),

  getQAHistory: (bookId: string, token: string, limit?: number) =>
    api.get<{
      id: string;
      question: string;
      answer: string;
      sourcePages: number[];
      confidence: number;
      useCount: number;
      lastUsedAt: string;
      createdAt: string;
    }[]>(`/api/v1/books/${bookId}/qa${limit ? `?limit=${limit}` : ''}`, token),

  getPopularQuestions: (bookId: string, token: string, limit?: number) =>
    api.get<PopularQuestion[]>(`/api/v1/books/${bookId}/qa/popular${limit ? `?limit=${limit}` : ''}`, token),

  // ==================== Annotations ====================
  getAnnotations: (bookId: string, token: string) =>
    api.get<BookAnnotation[]>(`/api/v1/books/${bookId}/annotations`, token),

  getPageAnnotations: (bookId: string, page: number, token: string) =>
    api.get<BookAnnotation[]>(`/api/v1/books/${bookId}/annotations/page/${page}`, token),

  getSharedAnnotations: (bookId: string, token: string) =>
    api.get<BookAnnotation[]>(`/api/v1/books/${bookId}/annotations/shared`, token),

  createAnnotation: (bookId: string, data: CreateAnnotationData, token: string) =>
    api.post<BookAnnotation>(`/api/v1/books/${bookId}/annotations`, data, token),

  saveCanvasState: (bookId: string, data: { pageNumber: number; canvasState: any }, token: string) =>
    api.post<BookAnnotation>(`/api/v1/books/${bookId}/annotations/canvas`, data, token),

  updateAnnotation: (bookId: string, annotationId: string, data: Partial<CreateAnnotationData>, token: string) =>
    api.put<BookAnnotation>(`/api/v1/books/${bookId}/annotations/${annotationId}`, data, token),

  deleteAnnotation: (bookId: string, annotationId: string, token: string) =>
    api.delete(`/api/v1/books/${bookId}/annotations/${annotationId}`, token),
};

// ==================== Attendance Types ====================

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY';

export interface StudentAttendance {
  id: string;
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    rollNo?: string;
    profileImage?: string;
  };
  sectionId: string;
  section?: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  markedById?: string;
  markedAt: string;
}

export interface StudentWithAttendance {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  rollNo?: string;
  profileImage?: string;
  attendance?: {
    id: string;
    status: AttendanceStatus;
    remarks?: string;
  } | null;
}

export interface AttendanceBySection {
  date: string;
  section: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
  students: StudentWithAttendance[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    unmarked: number;
  };
}

export interface AttendanceReport {
  section: {
    id: string;
    name: string;
    class: { id: string; name: string };
  };
  dateRange: { start: string; end: string };
  students: Array<{
    student: {
      id: string;
      firstName: string;
      lastName: string;
      admissionNo: string;
      rollNo?: string;
    };
    stats: {
      totalDays: number;
      present: number;
      absent: number;
      late: number;
      halfDay: number;
      percentage: number;
    };
  }>;
  summary: {
    totalStudents: number;
    averageAttendance: number;
  };
}

export interface AttendanceStats {
  date: string;
  students: {
    total: number;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
  };
  teachers: {
    total: number;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
  };
}

// ==================== Attendance API ====================

export const attendanceApi = {
  // Get attendance for a section on a specific date
  getByDateAndSection: (sectionId: string, date: string, token: string) =>
    api.get<AttendanceBySection>(`/api/v1/attendance/students/section?sectionId=${sectionId}&date=${date}`, token),

  // Get student attendance with filters
  getStudentAttendance: (params: {
    sectionId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    status?: AttendanceStatus;
  }, token: string) => {
    const queryParams = new URLSearchParams();
    if (params.sectionId) queryParams.append('sectionId', params.sectionId);
    if (params.studentId) queryParams.append('studentId', params.studentId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);
    return api.get<StudentAttendance[]>(`/api/v1/attendance/students?${queryParams.toString()}`, token);
  },

  // Mark single student attendance
  markStudentAttendance: (data: {
    studentId: string;
    sectionId: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
  }, token: string) =>
    api.post<StudentAttendance>('/api/v1/attendance/students', data, token),

  // Bulk mark attendance for a section
  bulkMarkStudentAttendance: (data: {
    sectionId: string;
    date: string;
    attendances: Array<{
      studentId: string;
      status: AttendanceStatus;
      remarks?: string;
    }>;
  }, token: string) =>
    api.post<{
      success: Array<{ studentId: string; attendance: StudentAttendance }>;
      failed: Array<{ studentId: string; error: string }>;
    }>('/api/v1/attendance/students/bulk', data, token),

  // Get attendance report for a section
  getReport: (sectionId: string, startDate: string, endDate: string, token: string) =>
    api.get<AttendanceReport>(`/api/v1/attendance/students/report?sectionId=${sectionId}&startDate=${startDate}&endDate=${endDate}`, token),

  // Get attendance stats for dashboard
  getStats: (date: string, token: string) =>
    api.get<AttendanceStats>(`/api/v1/attendance/stats?date=${date}`, token),
};

// ==================== Students API ====================

export type Category = 'GENERAL' | 'OBC_NCL' | 'OBC_CL' | 'SC' | 'ST' | 'EWS';
export type PwDType = 'NONE' | 'LOCOMOTOR' | 'VISUAL' | 'HEARING' | 'SPEECH' | 'INTELLECTUAL' | 'MENTAL_ILLNESS' | 'MULTIPLE' | 'AUTISM' | 'SPECIFIC_LEARNING' | 'CEREBRAL_PALSY' | 'MUSCULAR_DYSTROPHY' | 'CHRONIC_NEUROLOGICAL' | 'BLOOD_DISORDER' | 'ACID_ATTACK_VICTIM';

export interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  rollNo?: string;
  bloodGroup?: string;
  profileImage?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  previousSchool?: string;
  medicalConditions?: string;
  allergies?: string;
  isActive: boolean;
  currentClassId?: string;
  currentSectionId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  currentClass?: {
    id: string;
    name: string;
    code: string;
  };
  currentSection?: {
    id: string;
    name: string;
  };
  // NEET/JEE Eligibility Fields
  category?: Category;
  subCategory?: string;
  isCreamyLayer?: boolean;
  domicileState?: string;
  isDomicile?: boolean;
  domicileCertNo?: string;
  nationality?: string;
  pwdType?: PwDType;
  pwdPercentage?: number;
  pwdCertNo?: string;
  annualFamilyIncome?: number;
  isEWS?: boolean;
  ewsCertNo?: string;
  isDefenseQuota?: boolean;
  isKashmiriMigrant?: boolean;
  isSingleGirl?: boolean;
  aadharNo?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
}

export interface CreateStudentData {
  admissionNo: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  rollNo?: string;
  bloodGroup?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  currentClassId?: string;
  currentSectionId?: string;
  previousSchool?: string;
  medicalConditions?: string;
  allergies?: string;
  // NEET/JEE Eligibility Fields
  category?: Category;
  subCategory?: string;
  isCreamyLayer?: boolean;
  domicileState?: string;
  isDomicile?: boolean;
  domicileCertNo?: string;
  nationality?: string;
  pwdType?: PwDType;
  pwdPercentage?: number;
  pwdCertNo?: string;
  annualFamilyIncome?: number;
  isEWS?: boolean;
  ewsCertNo?: string;
  isDefenseQuota?: boolean;
  isKashmiriMigrant?: boolean;
  isSingleGirl?: boolean;
  aadharNo?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
}

export interface UpdateStudentData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  rollNo?: string;
  bloodGroup?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  currentClassId?: string;
  currentSectionId?: string;
  previousSchool?: string;
  medicalConditions?: string;
  allergies?: string;
  isActive?: boolean;
}

export interface StudentFilters {
  classId?: string;
  sectionId?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ImportPreviewRow {
  row: number;
  data: Partial<CreateStudentData>;
  errors: string[];
  isValid: boolean;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  data: ImportPreviewRow[];
}

export interface ImportResult {
  success: string[];
  failed: Array<{
    row: number;
    admissionNo: string;
    errors: string[];
  }>;
  summary: {
    total: number;
    imported: number;
    failed: number;
  };
}

export const studentsApi = {
  // Get all students with filters and pagination
  getAll: (token: string, params?: StudentFilters) => {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append('classId', params.classId);
    if (params?.sectionId) queryParams.append('sectionId', params.sectionId);
    if (params?.gender) queryParams.append('gender', params.gender);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    const query = queryParams.toString();
    return api.get<{ students: Student[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/v1/students${query ? `?${query}` : ''}`,
      token
    );
  },

  // Get single student by ID
  getById: (id: string, token: string) =>
    api.get<Student>(`/api/v1/students/${id}`, token),

  // Create single student
  create: (data: CreateStudentData, token: string) =>
    api.post<Student>('/api/v1/students', data, token),

  // Update student
  update: (id: string, data: UpdateStudentData, token: string) =>
    api.put<Student>(`/api/v1/students/${id}`, data, token),

  // Delete student (soft delete)
  delete: (id: string, token: string) =>
    api.delete<void>(`/api/v1/students/${id}`, token),

  // Download import template
  downloadTemplate: async (format: 'csv' | 'xlsx', token: string): Promise<Blob> => {
    const response = await fetch(`${API_URL}/api/v1/students/template?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to download template');
    }
    return response.blob();
  },

  // Preview import file
  previewImport: async (file: File, token: string): Promise<ApiResponse<ImportPreviewResult>> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/v1/students/import/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || data.message || 'Preview failed' };
      }
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  // Import students from file
  importStudents: async (file: File, token: string): Promise<ApiResponse<ImportResult>> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/v1/students/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || data.message || 'Import failed', data: data.data };
      }
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },
};

// ==================== Admin Master Data Types ====================

// Branch Types
export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    classes: number;
    teachers: number;
    students: number;
  };
}

export interface CreateBranchData {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  category?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagData {
  name: string;
  category?: string;
  color?: string;
}

// Assessment Reason Types
export interface AssessmentReason {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentReasonData {
  name: string;
  code: string;
  description?: string;
}

// Task Types
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedToId?: string;
  assignedTo?: { id: string; email: string };
  createdById: string;
  createdBy?: { id: string; email: string };
  dueDate?: string;
  completedAt?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assignedToId?: string;
  dueDate?: string;
  priority?: TaskPriority;
  category?: string;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  category?: string;
  isActive?: boolean;
  dueBefore?: string;
  dueAfter?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

// Batch Transfer Types
export interface BatchTransfer {
  id: string;
  studentId: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
  };
  fromClassId: string;
  fromSectionId: string;
  toClassId: string;
  toSectionId: string;
  fromClass?: { id: string; name: string };
  fromSection?: { id: string; name: string };
  toClass?: { id: string; name: string };
  toSection?: { id: string; name: string };
  reason?: string;
  effectiveDate: string;
  transferredById: string;
  transferredBy?: { id: string; email: string };
  createdAt: string;
}

export interface TransferStudentData {
  studentId: string;
  toClassId: string;
  toSectionId: string;
  reason?: string;
}

// Teacher Types
export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  departmentId?: string;
  department?: { id: string; name: string; code: string };
  branchId?: string;
  branch?: { id: string; name: string; code: string };
  salary?: number;
  bankAccount?: string;
  bankName?: string;
  ifscCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

export interface CreateTeacherData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  dateOfBirth?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  departmentId?: string;
  branchId?: string;
  salary?: number;
  bankAccount?: string;
  bankName?: string;
  ifscCode?: string;
}

export interface TeacherFilters {
  branchId?: string;
  departmentId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TeacherImportPreviewRow {
  row: number;
  data: Partial<CreateTeacherData>;
  errors: string[];
  isValid: boolean;
}

export interface TeacherImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  data: TeacherImportPreviewRow[];
}

export interface TeacherImportResult {
  success: string[];
  failed: Array<{ employeeId: string; error: string }>;
  summary: {
    total: number;
    imported: number;
    failed: number;
  };
}

// ==================== Admin Master Data API ====================

// Branch API
export const branchesApi = {
  getAll: (token: string, params?: { search?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    const query = queryParams.toString();
    return api.get<Branch[]>(`/api/v1/branches${query ? `?${query}` : ''}`, token);
  },

  getById: (id: string, token: string) =>
    api.get<Branch>(`/api/v1/branches/${id}`, token),

  create: (data: CreateBranchData, token: string) =>
    api.post<Branch>('/api/v1/branches', data, token),

  update: (id: string, data: Partial<CreateBranchData> & { isActive?: boolean }, token: string) =>
    api.put<Branch>(`/api/v1/branches/${id}`, data, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/branches/${id}`, token),
};

// Tag API
export const tagsApi = {
  getAll: (token: string, params?: { search?: string; category?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    const query = queryParams.toString();
    return api.get<Tag[]>(`/api/v1/tags${query ? `?${query}` : ''}`, token);
  },

  getById: (id: string, token: string) =>
    api.get<Tag>(`/api/v1/tags/${id}`, token),

  search: (query: string, token: string, limit?: number) =>
    api.get<Tag[]>(`/api/v1/tags/search?q=${encodeURIComponent(query)}${limit ? `&limit=${limit}` : ''}`, token),

  getCategories: (token: string) =>
    api.get<string[]>('/api/v1/tags/categories', token),

  create: (data: CreateTagData, token: string) =>
    api.post<Tag>('/api/v1/tags', data, token),

  update: (id: string, data: Partial<CreateTagData> & { isActive?: boolean }, token: string) =>
    api.put<Tag>(`/api/v1/tags/${id}`, data, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/tags/${id}`, token),
};

// Assessment Reason API
export const assessmentReasonsApi = {
  getAll: (token: string, params?: { search?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    const query = queryParams.toString();
    return api.get<AssessmentReason[]>(`/api/v1/assessment-reasons${query ? `?${query}` : ''}`, token);
  },

  getById: (id: string, token: string) =>
    api.get<AssessmentReason>(`/api/v1/assessment-reasons/${id}`, token),

  create: (data: CreateAssessmentReasonData, token: string) =>
    api.post<AssessmentReason>('/api/v1/assessment-reasons', data, token),

  update: (id: string, data: Partial<CreateAssessmentReasonData> & { isActive?: boolean }, token: string) =>
    api.put<AssessmentReason>(`/api/v1/assessment-reasons/${id}`, data, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/assessment-reasons/${id}`, token),
};

// Task API
export const tasksApi = {
  getAll: (token: string, params?: TaskFilters) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return api.get<{
      data: Task[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/v1/tasks${query ? `?${query}` : ''}`, token);
  },

  getMyTasks: (token: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString();
    return api.get<{ data: Task[]; total: number }>(`/api/v1/tasks/my${query ? `?${query}` : ''}`, token);
  },

  getStats: (token: string) =>
    api.get<TaskStats>('/api/v1/tasks/stats', token),

  getById: (id: string, token: string) =>
    api.get<Task>(`/api/v1/tasks/${id}`, token),

  create: (data: CreateTaskData, token: string) =>
    api.post<Task>('/api/v1/tasks', data, token),

  update: (id: string, data: Partial<CreateTaskData> & { status?: TaskStatus; isActive?: boolean }, token: string) =>
    api.put<Task>(`/api/v1/tasks/${id}`, data, token),

  updateStatus: (id: string, status: TaskStatus, token: string) =>
    api.patch<Task>(`/api/v1/tasks/${id}/status`, { status }, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/tasks/${id}`, token),
};

// Batch Transfer API
export const transfersApi = {
  getHistory: (token: string, params?: {
    studentId?: string;
    fromClassId?: string;
    toClassId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return api.get<{ data: BatchTransfer[]; total: number }>(`/api/v1/transfers${query ? `?${query}` : ''}`, token);
  },

  getStudentHistory: (studentId: string, token: string) =>
    api.get<BatchTransfer[]>(`/api/v1/transfers/student/${studentId}`, token),

  getById: (id: string, token: string) =>
    api.get<BatchTransfer>(`/api/v1/transfers/${id}`, token),

  transfer: (data: TransferStudentData, token: string) =>
    api.post<BatchTransfer>('/api/v1/transfers', data, token),

  bulkTransfer: (data: {
    studentIds: string[];
    toClassId: string;
    toSectionId: string;
    reason?: string;
  }, token: string) =>
    api.post<{
      success: string[];
      failed: Array<{ studentId: string; error: string }>;
    }>('/api/v1/transfers/bulk', data, token),
};

// Teacher API
export const teachersApi = {
  getAll: (token: string, params?: TeacherFilters) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return api.get<{
      data: Teacher[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/v1/teachers${query ? `?${query}` : ''}`, token);
  },

  getById: (id: string, token: string) =>
    api.get<Teacher>(`/api/v1/teachers/${id}`, token),

  getClasses: (id: string, token: string) =>
    api.get<any[]>(`/api/v1/teachers/${id}/classes`, token),

  getSubjects: (id: string, token: string) =>
    api.get<any[]>(`/api/v1/teachers/${id}/subjects`, token),

  create: (data: CreateTeacherData, token: string) =>
    api.post<Teacher>('/api/v1/teachers', data, token),

  update: (id: string, data: Partial<CreateTeacherData>, token: string) =>
    api.put<Teacher>(`/api/v1/teachers/${id}`, data, token),

  delete: (id: string, token: string) =>
    api.delete(`/api/v1/teachers/${id}`, token),

  bulkCreate: (teachers: CreateTeacherData[], token: string) =>
    api.post<{
      success: string[];
      failed: Array<{ employeeId: string; error: string }>;
    }>('/api/v1/teachers/bulk', { teachers }, token),

  downloadTemplate: async (format: 'csv' | 'xlsx', token: string): Promise<Blob> => {
    const response = await fetch(`${API_URL}/api/v1/teachers/template?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to download template');
    }
    return response.blob();
  },

  previewImport: async (file: File, token: string): Promise<ApiResponse<TeacherImportPreviewResult>> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/v1/teachers/import/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || data.message || 'Preview failed' };
      }
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  importTeachers: async (file: File, token: string): Promise<ApiResponse<TeacherImportResult>> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/v1/teachers/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || data.message || 'Import failed', data: data.data };
      }
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },
};

// ==================== Practice MCQ Types ====================

export type PracticeDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type PracticeMode = 'READING' | 'TEST';

export interface PracticeQuestionOption {
  id: string;
  text: string;
}

export interface PracticeQuestion {
  id: string;
  bookId: string;
  questionText: string;
  questionHtml?: string;
  options: PracticeQuestionOption[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: PracticeDifficulty;
  timeSeconds: number;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

export interface PracticeSession {
  id: string;
  studentId: string;
  bookId: string;
  book?: {
    id: string;
    title: string;
    coverImage?: string;
  };
  mode: PracticeMode;
  questionCount: number;
  totalTimeSeconds?: number;
  startedAt: string;
  completedAt?: string;
  score?: number;
  totalQuestions: number;
  questionOrder?: string[];
  questions?: PracticeQuestion[];
  attempts?: PracticeAttempt[];
}

export interface PracticeAttempt {
  id: string;
  questionId: string;
  question?: PracticeQuestion;
  studentId: string;
  selectedAnswer?: string;
  isCorrect?: boolean;
  timeSpentSeconds?: number;
  attemptedAt: string;
  sessionId?: string;
}

export interface PracticeProgress {
  bookId: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
  byDifficulty: {
    easy: { total: number; attempted: number; correct: number };
    medium: { total: number; attempted: number; correct: number };
    hard: { total: number; attempted: number; correct: number };
  };
  shouldGenerateMore: boolean;
}

export interface BookPracticeStats {
  totalQuestions: number;
  byDifficulty: { easy: number; medium: number; hard: number };
  isIndexed: boolean;
  canGenerateMore: boolean;
}

export interface BookWithPractice {
  id: string;
  title: string;
  coverImage?: string;
  subject?: string;
  isIndexed: boolean;
  totalQuestions: number;
  progress: PracticeProgress;
}

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

// ==================== Practice MCQ API ====================

export const practiceApi = {
  // Get books with practice available
  getBooksWithPractice: (token: string) =>
    api.get<BookWithPractice[]>('/api/v1/practice', token),

  // Get practice stats for a book
  getBookStats: (bookId: string, token: string) =>
    api.get<BookPracticeStats>(`/api/v1/practice/book/${bookId}/stats`, token),

  // Start a new session
  startSession: (data: {
    bookId: string;
    mode: PracticeMode;
    questionCount: 10 | 20 | 30 | 50;
  }, token: string) =>
    api.post<PracticeSession>('/api/v1/practice/session/start', data, token),

  // Get session with questions
  getSession: (sessionId: string, token: string) =>
    api.get<PracticeSession>(`/api/v1/practice/session/${sessionId}`, token),

  // Complete session (Test Mode)
  completeSession: (sessionId: string, token: string) =>
    api.post<PracticeSession>(`/api/v1/practice/session/${sessionId}/complete`, {}, token),

  // Get next unattempted question (Reading Mode)
  getNextQuestion: (bookId: string, token: string) =>
    api.get<PracticeQuestion | null>(`/api/v1/practice/book/${bookId}/next`, token),

  // Submit answer
  answerQuestion: (data: {
    questionId: string;
    selectedAnswer: string;
    timeSpentSeconds?: number;
    sessionId?: string;
  }, token: string) =>
    api.post<AnswerResult>('/api/v1/practice/answer', data, token),

  // Get progress for a book
  getProgress: (bookId: string, token: string) =>
    api.get<PracticeProgress>(`/api/v1/practice/book/${bookId}/progress`, token),

  // Get all practice sessions
  getHistory: (token: string, bookId?: string) => {
    const params = bookId ? `?bookId=${bookId}` : '';
    return api.get<PracticeSession[]>(`/api/v1/practice/history${params}`, token);
  },

  // Generate new questions (Admin/Teacher)
  generateQuestions: (bookId: string, count: number, token: string) =>
    api.post<{ generated: number; questions: PracticeQuestion[] }>(
      `/api/v1/practice/book/${bookId}/generate`,
      { count },
      token
    ),

  // List all questions for a book (Admin/Teacher)
  listQuestions: (bookId: string, token: string, page = 1, limit = 20) =>
    api.get<{
      questions: PracticeQuestion[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/v1/practice/book/${bookId}/questions?page=${page}&limit=${limit}`, token),
};

// ==================== YouTube Video Learning Types ====================

export type VideoStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface SchoolYouTubeVideo {
  id: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  status: VideoStatus;
  publishedAt?: string;
  subjectId?: string;
  subject?: { id: string; name: string };
  schoolId: string;
  createdById: string;
  createdBy?: { id: string; email: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  videoTags?: { id: string; tag: Tag }[];
  videoAccess?: VideoAccess[];
  comprehensionQuestions?: VideoComprehensionQuestion[];
  _count?: {
    watchSessions?: number;
    videoAccess?: number;
    comprehensionQuestions?: number;
  };
  lastSession?: VideoWatchSession | null;
  watchProgress?: number;
}

export interface VideoAccess {
  id: string;
  videoId: string;
  classId: string;
  class?: { id: string; name: string };
  sectionId?: string;
  section?: { id: string; name: string };
  academicYearId?: string;
  academicYear?: { id: string; name: string };
  availableFrom?: string;
  availableUntil?: string;
}

export interface VideoComprehensionQuestion {
  id: string;
  videoId: string;
  questionText: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  isAIGenerated: boolean;
  sequenceOrder: number;
}

export interface VideoWatchSession {
  id: string;
  videoId: string;
  studentId: string;
  startedAt: string;
  endedAt?: string;
  totalWatchTimeSeconds: number;
  lastPositionSeconds: number;
  verificationsCompleted: number;
  verificationsFailed: number;
  questionsAnswered: number;
  questionsCorrect: number;
  isCompleted: boolean;
  video?: SchoolYouTubeVideo;
}

export interface VideoVerification {
  verificationId: string;
  word: string;
  atSeconds: number;
}

export interface VideoWatchStats {
  totalVideos: number;
  totalWatchTime: number;
  completedVideos: number;
  averageWatchTime: number;
  verificationsCompleted: number;
  verificationSuccessRate: number;
  questionsAnswered: number;
  questionsCorrect: number;
  questionAccuracy: number;
}

export interface VideoEngagementReport {
  video: {
    id: string;
    title: string;
    duration: number | null;
    subject: string | null;
  };
  stats: {
    totalSessions: number;
    uniqueStudents: number;
    totalWatchTime: number;
    averageWatchTime: number;
    completionRate: number;
    verificationRate: number;
    questionAccuracy: number;
  };
  studentBreakdown: StudentVideoStats[];
}

export interface StudentVideoStats {
  studentId: string;
  studentName: string;
  rollNo: string | null;
  totalVideos: number;
  totalWatchTime: number;
  completedVideos: number;
  verificationSuccessRate: number;
  questionAccuracy: number;
}

export interface TagWithVideoCount extends Tag {
  videoCount: number;
}

// ==================== YouTube Video Learning API ====================

export const videosApi = {
  // ==================== Admin/Teacher ====================

  // Get all videos
  getAll: (token: string, params?: { status?: VideoStatus; subjectId?: string; tagId?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const query = searchParams.toString();
    return api.get<SchoolYouTubeVideo[]>(`/api/v1/videos${query ? `?${query}` : ''}`, token);
  },

  // Get video by ID
  getById: (id: string, token: string) =>
    api.get<SchoolYouTubeVideo>(`/api/v1/videos/${id}`, token),

  // Create video
  create: (data: {
    youtubeUrl: string;
    title: string;
    description?: string;
    subjectId?: string;
    tagIds?: string[];
  }, token: string) =>
    api.post<SchoolYouTubeVideo>('/api/v1/videos', data, token),

  // Update video
  update: (id: string, data: {
    title?: string;
    description?: string;
    subjectId?: string;
    tagIds?: string[];
    status?: VideoStatus;
  }, token: string) =>
    api.put<SchoolYouTubeVideo>(`/api/v1/videos/${id}`, data, token),

  // Delete video
  delete: (id: string, token: string) =>
    api.delete(`/api/v1/videos/${id}`, token),

  // Publish video
  publish: (id: string, token: string) =>
    api.post<SchoolYouTubeVideo>(`/api/v1/videos/${id}/publish`, {}, token),

  // ==================== Access Control ====================

  // Grant access
  grantAccess: (id: string, data: {
    classId: string;
    sectionId?: string;
    academicYearId?: string;
    availableFrom?: string;
    availableUntil?: string;
  }, token: string) =>
    api.post<VideoAccess>(`/api/v1/videos/${id}/access`, data, token),

  // Get access rules
  getAccess: (id: string, token: string) =>
    api.get<VideoAccess[]>(`/api/v1/videos/${id}/access`, token),

  // Revoke access
  revokeAccess: (videoId: string, accessId: string, token: string) =>
    api.delete(`/api/v1/videos/${videoId}/access/${accessId}`, token),

  // ==================== Questions ====================

  // Add question
  addQuestion: (videoId: string, data: {
    questionText: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    explanation?: string;
  }, token: string) =>
    api.post<VideoComprehensionQuestion>(`/api/v1/videos/${videoId}/questions`, data, token),

  // Get questions
  getQuestions: (videoId: string, token: string) =>
    api.get<VideoComprehensionQuestion[]>(`/api/v1/videos/${videoId}/questions`, token),

  // Update question
  updateQuestion: (videoId: string, questionId: string, data: {
    questionText?: string;
    options?: { id: string; text: string }[];
    correctAnswer?: string;
    explanation?: string;
  }, token: string) =>
    api.put<VideoComprehensionQuestion>(`/api/v1/videos/${videoId}/questions/${questionId}`, data, token),

  // Delete question
  deleteQuestion: (videoId: string, questionId: string, token: string) =>
    api.delete(`/api/v1/videos/${videoId}/questions/${questionId}`, token),

  // Generate AI questions
  generateQuestions: (videoId: string, count: number, token: string) =>
    api.post<VideoComprehensionQuestion[]>(`/api/v1/videos/${videoId}/questions/generate`, { count }, token),

  // ==================== Student ====================

  // Get available videos
  getAvailable: (token: string) =>
    api.get<SchoolYouTubeVideo[]>('/api/v1/videos/available', token),

  // Get tags with videos
  getTags: (token: string) =>
    api.get<TagWithVideoCount[]>('/api/v1/videos/tags', token),

  // Get videos by tag
  getByTag: (tagId: string, token: string) =>
    api.get<SchoolYouTubeVideo[]>(`/api/v1/videos/by-tag/${tagId}`, token),

  // Get video for watching (student view)
  getForWatching: (id: string, token: string) =>
    api.get<{
      id: string;
      youtubeVideoId: string;
      title: string;
      description?: string;
      thumbnailUrl?: string;
      duration?: number;
      subject?: { id: string; name: string };
      videoTags?: { id: string; tag: Tag }[];
    }>(`/api/v1/videos/watch/${id}`, token),

  // ==================== Watch Session ====================

  // Start watch session
  startWatch: (videoId: string, token: string) =>
    api.post<VideoWatchSession>(`/api/v1/videos/${videoId}/watch/start`, {}, token),

  // Update watch progress
  updateProgress: (videoId: string, sessionId: string, currentSeconds: number, token: string) =>
    api.post<{
      session: VideoWatchSession;
      needsVerification: boolean;
      needsQuestions: boolean;
    }>(`/api/v1/videos/${videoId}/watch/progress`, { sessionId, currentSeconds }, token),

  // End watch session
  endWatch: (videoId: string, sessionId: string, token: string) =>
    api.post<VideoWatchSession>(`/api/v1/videos/${videoId}/watch/end`, { sessionId }, token),

  // Get verification word
  getVerification: (videoId: string, sessionId: string, token: string) =>
    api.get<VideoVerification | null>(`/api/v1/videos/${videoId}/watch/verify?sessionId=${sessionId}`, token),

  // Submit verification
  submitVerification: (videoId: string, data: {
    sessionId: string;
    verificationId: string;
    word: string;
  }, token: string) =>
    api.post<{ isCorrect: boolean }>(`/api/v1/videos/${videoId}/watch/verify`, data, token),

  // Get questions for session
  getSessionQuestions: (videoId: string, sessionId: string, token: string) =>
    api.get<{ id: string; questionText: string; options: { id: string; text: string }[] }[]>(
      `/api/v1/videos/${videoId}/watch/questions?sessionId=${sessionId}`,
      token
    ),

  // Submit question answer
  submitAnswer: (videoId: string, data: {
    sessionId: string;
    questionId: string;
    answer: string;
  }, token: string) =>
    api.post<{
      isCorrect: boolean;
      correctAnswer: string;
      explanation?: string;
    }>(`/api/v1/videos/${videoId}/watch/answer`, data, token),

  // Get my stats
  getMyStats: (token: string) =>
    api.get<VideoWatchStats>('/api/v1/videos/my-stats', token),

  // ==================== Reports ====================

  // Get video engagement report
  getVideoReport: (videoId: string, token: string) =>
    api.get<VideoEngagementReport>(`/api/v1/videos/${videoId}/reports`, token),

  // Get batch report
  getBatchReport: (classId: string, token: string, sectionId?: string) => {
    const query = sectionId ? `?sectionId=${sectionId}` : '';
    return api.get<any>(`/api/v1/videos/reports/batch/${classId}${query}`, token);
  },

  // Get student report
  getStudentReport: (studentId: string, token: string) =>
    api.get<any>(`/api/v1/videos/reports/student/${studentId}`, token),

  // Get child report (parent view)
  getChildReport: (childId: string, token: string) =>
    api.get<any>(`/api/v1/videos/reports/parent/${childId}`, token),
};

// ==================== STUDY PLANNER API ====================

export interface StudyPlan {
  id: string;
  studentId: string;
  subjectId: string;
  chapterId: string;
  diagnosticScore: number | null;
  weakAreas: any;
  aiRecommendedHours: number;
  aiAnalysis: any;
  totalDays: number;
  hoursPerDay: number;
  startDate: string;
  targetEndDate: string;
  currentDay: number;
  totalTimeSpentMinutes: number;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string };
  chapter?: { id: string; name: string; chapterNumber: number };
  studyDays?: StudyPlanDay[];
  completedDays?: number;
  progress?: number;
}

export interface StudyPlanDay {
  id: string;
  studyPlanId: string;
  dayNumber: number;
  status: 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  youtubeVideoIds: string[];
  bookContentPageStart: number | null;
  bookContentPageEnd: number | null;
  practiceQuestionIds: string[];
  summaryNotes: string | null;
  estimatedMinutes: number;
  actualTimeSpentMinutes: number;
  videosWatched: number;
  videosTotal: number;
  readingCompleted: boolean;
  practiceCompleted: boolean;
  requiredPassPercent: number;
  currentPassRequirement: number;
  unlockedAt: string | null;
  completedAt: string | null;
  nextAttemptAt: string | null;
}

export interface DiagnosticQuestion {
  id: string;
  questionText: string;
  questionHtml?: string;
  questionType: string;
  options: any;
  difficulty: string;
  marks: number;
  topic?: string;
}

export interface AIRecommendation {
  totalHours: number;
  weakAreas: { topic: string; score: number; priorityLevel?: string }[];
  dailyPlan: {
    dayNumber: number;
    topics: string[];
    videoKeywords: string[];
    estimatedMinutes: number;
  }[];
  summaryNotes: string[];
  analysis: string;
}

export const studyPlannerApi = {
  // ==================== Subject & Chapter Selection ====================

  // Get subjects with chapters
  getSubjectsWithChapters: (token: string) =>
    api.get<any[]>('/api/v1/study-planner/subjects', token),

  // ==================== Diagnostic Test ====================

  // Start diagnostic test
  startDiagnostic: (subjectId: string, chapterId: string, token: string) =>
    api.post<{
      questions: DiagnosticQuestion[];
      totalQuestions: number;
      timeLimit: number;
      subjectName: string;
      chapterName: string;
    }>('/api/v1/study-planner/diagnostic', { subjectId, chapterId }, token),

  // Submit diagnostic and get AI recommendation
  submitDiagnostic: (
    data: {
      subjectId: string;
      chapterId: string;
      responses: { questionId: string; selectedAnswer: string }[];
    },
    token: string
  ) =>
    api.post<{
      diagnosticScore: number;
      correctCount: number;
      totalCount: number;
      weakAreas: { topic: string; score: number; questionCount: number }[];
      aiRecommendation: AIRecommendation;
    }>('/api/v1/study-planner/diagnostic/submit', data, token),

  // ==================== Study Plan CRUD ====================

  // Create study plan
  createPlan: (
    data: {
      subjectId: string;
      chapterId: string;
      diagnosticScore: number;
      aiRecommendation: AIRecommendation;
      totalDays: number;
    },
    token: string
  ) => api.post<StudyPlan>('/api/v1/study-planner/create', data, token),

  // Get student's study plans
  getPlans: (token: string) => api.get<StudyPlan[]>('/api/v1/study-planner/plans', token),

  // Get study plan details
  getPlanDetails: (planId: string, token: string) =>
    api.get<StudyPlan & { progress: any }>(`/api/v1/study-planner/plan/${planId}`, token),

  // Get study plan progress
  getPlanProgress: (planId: string, token: string) =>
    api.get<any>(`/api/v1/study-planner/plan/${planId}/progress`, token),

  // ==================== Day Operations ====================

  // Get day details with content
  getDayDetails: (dayId: string, token: string) =>
    api.get<
      StudyPlanDay & {
        videos: any[];
        practiceQuestions: any[];
        canStartTest: boolean;
        cooldownRemaining: number;
        lastAttemptScore: number | null;
        isLocked?: boolean;
        message?: string;
      }
    >(`/api/v1/study-planner/day/${dayId}`, token),

  // Update day progress
  updateDayProgress: (
    dayId: string,
    updates: {
      videoWatched?: string;
      readingCompleted?: boolean;
      practiceCompleted?: boolean;
      timeSpentMinutes?: number;
    },
    token: string
  ) => api.patch<StudyPlanDay>(`/api/v1/study-planner/day/${dayId}/progress`, updates, token),

  // ==================== Day Test ====================

  // Start day test
  startDayTest: (dayId: string, token: string) =>
    api.post<{
      attemptId: string;
      attemptNumber: number;
      passingPercent: number;
      questions: {
        id: string;
        questionText: string;
        questionHtml?: string;
        options: any;
        questionType: string;
      }[];
      totalQuestions: number;
      timeLimit: number;
    }>(`/api/v1/study-planner/day/${dayId}/test/start`, {}, token),

  // Submit day test
  submitDayTest: (
    dayId: string,
    data: {
      attemptId: string;
      responses: { questionId: string; selectedAnswer: string }[];
    },
    token: string
  ) =>
    api.post<{
      passed: boolean;
      percentage: number;
      correctCount: number;
      totalQuestions: number;
      requiredPercent: number;
      cooldownEndsAt: string | null;
      timeTakenSeconds: number;
    }>(`/api/v1/study-planner/day/${dayId}/test/submit`, data, token),

  // ==================== Progress Tracking (Parent/Teacher Views) ====================

  // Get student progress (for parents/teachers)
  getStudentProgress: (studentId: string, token: string) =>
    api.get<StudyPlan[]>(`/api/v1/study-planner/student/${studentId}/progress`, token),

  // ==================== Reports ====================

  // Get student report
  getStudentReport: (studentId: string, token: string) =>
    api.get<{
      summary: {
        totalPlans: number;
        completedPlans: number;
        activePlans: number;
        completionRate: number;
        totalTestAttempts: number;
        testPassRate: number;
        totalTimeSpentMinutes: number;
      };
      plans: any[];
    }>(`/api/v1/study-planner/reports/student/${studentId}`, token),

  // Get class report (teachers/admin)
  getClassReport: (classId: string, token: string) =>
    api.get<{
      summary: {
        totalStudents: number;
        studentsWithPlans: number;
        adoptionRate: number;
        totalPlansCreated: number;
        completedPlans: number;
        completionRate: number;
      };
      students: any[];
    }>(`/api/v1/study-planner/reports/class/${classId}`, token),

  // Get admin report
  getAdminReport: (token: string) =>
    api.get<{
      summary: {
        totalStudents: number;
        studentsWithPlans: number;
        adoptionRate: number;
        totalPlans: number;
        activePlans: number;
        completedPlans: number;
        averageCompletionRate: number;
      };
      popularSubjects: { name: string; count: number }[];
    }>('/api/v1/study-planner/reports/admin', token),
};

// ==================== FINANCE TYPES ====================

export interface FeeStructure {
  id: string;
  name: string;
  description?: string;
  schoolId: string;
  academicYearId: string;
  classId?: string;
  class?: Class;
  amount: number;
  frequency: string; // Monthly, Quarterly, Annually, One-time
  dueDay?: number;
  lateFee: number;
  lateFeeAfterDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  student?: Student;
  feeStructureId: string;
  feeStructure?: FeeStructure;
  invoiceId?: string;
  invoice?: FeeInvoice;
  amount: number;
  lateFee: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE';
  paymentDate?: string;
  transactionId?: string;
  paidById?: string;
  forMonth?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  feeStructureId: string;
  feeStructure?: FeeStructure;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
}

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  schoolId: string;
  studentId: string;
  student?: Student;
  lineItems?: InvoiceLineItem[];
  payments?: FeePayment[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReport {
  payments: FeePayment[];
  summary: {
    totalCollected: number;
    totalFees: number;
    totalDiscounts: number;
    totalLateFees: number;
    paymentCount: number;
  };
}

export interface InvoiceStats {
  totalInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  totalPartial: number;
  outstanding: number;
  byStatus: {
    pending: number;
    paid: number;
    partial: number;
    overdue: number;
    cancelled: number;
  };
}

// ==================== FINANCE API ====================

export const financeApi = {
  // ==================== Fee Structure ====================

  // Get all fee structures
  getFeeStructures: (
    token: string,
    filters?: { search?: string; classId?: string; academicYearId?: string; isActive?: boolean; page?: number; limit?: number }
  ) =>
    api.get<{ data: FeeStructure[]; total: number }>('/api/v1/fees/structure', token, filters),

  // Create fee structure
  createFeeStructure: (token: string, data: Partial<FeeStructure>) =>
    api.post<FeeStructure>('/api/v1/fees/structure', data, token),

  // Get fee structure by ID
  getFeeStructureById: (id: string, token: string) =>
    api.get<FeeStructure>(`/api/v1/fees/structure/${id}`, token),

  // Update fee structure
  updateFeeStructure: (id: string, token: string, data: Partial<FeeStructure>) =>
    api.put<FeeStructure>(`/api/v1/fees/structure/${id}`, data, token),

  // Delete fee structure
  deleteFeeStructure: (id: string, token: string) =>
    api.delete(`/api/v1/fees/structure/${id}`, token),

  // ==================== Payments ====================

  // Get all payments
  getPayments: (
    token: string,
    filters?: {
      studentId?: string;
      classId?: string;
      paymentStatus?: string;
      paymentMethod?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) =>
    api.get<{ data: FeePayment[]; total: number }>('/api/v1/fees/payments', token, filters),

  // Record a payment
  recordPayment: (token: string, data: Partial<FeePayment>) =>
    api.post<FeePayment>('/api/v1/fees/payments', data, token),

  // Get pending dues
  getPendingDues: (token: string, filters?: { studentId?: string; classId?: string }) =>
    api.get<FeePayment[]>('/api/v1/fees/dues', token, filters),

  // Get payment report
  getPaymentReport: (token: string, dateFrom: string, dateTo: string) =>
    api.get<PaymentReport>('/api/v1/fees/report', token, { dateFrom, dateTo }),

  // ==================== Invoices ====================

  // Get all invoices
  getInvoices: (
    token: string,
    filters?: {
      studentId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) =>
    api.get<{ data: FeeInvoice[]; total: number }>('/api/v1/invoices', token, filters),

  // Generate single invoice
  generateInvoice: (token: string, data: { studentId: string; feeStructureIds: string[]; discount?: number; tax?: number; dueDate: string }) =>
    api.post<FeeInvoice>('/api/v1/invoices/generate', data, token),

  // Bulk generate invoices
  bulkGenerateInvoices: (
    token: string,
    data: { classId?: string; sectionId?: string; feeStructureIds: string[]; discount?: number; tax?: number; dueDate: string }
  ) =>
    api.post<FeeInvoice[]>('/api/v1/invoices/bulk-generate', data, token),

  // Get invoice by ID
  getInvoiceById: (id: string, token: string) =>
    api.get<FeeInvoice>(`/api/v1/invoices/${id}`, token),

  // Update invoice status
  updateInvoiceStatus: (id: string, token: string, status: string) =>
    api.put<FeeInvoice>(`/api/v1/invoices/${id}/status`, { status }, token),

  // Cancel invoice
  cancelInvoice: (id: string, token: string) =>
    api.put<FeeInvoice>(`/api/v1/invoices/${id}/cancel`, {}, token),

  // Get invoice statistics
  getInvoiceStats: (token: string) =>
    api.get<InvoiceStats>('/api/v1/invoices/stats', token),

  // Get overdue invoices
  getOverdueInvoices: (token: string) =>
    api.get<FeeInvoice[]>('/api/v1/invoices/overdue', token),

  // Download receipt PDF
  downloadReceiptPDF: async (paymentId: string, token: string): Promise<void> => {
    const response = await fetch(`/api/v1/fees/payments/${paymentId}/receipt`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download receipt');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Download invoice PDF
  downloadInvoicePDF: async (invoiceId: string, token: string): Promise<void> => {
    const response = await fetch(`/api/v1/invoices/${invoiceId}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

// =====================================================
// TRANSPORTATION MODULE APIS
// =====================================================

// Types
export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: 'BUS' | 'VAN' | 'CAR' | 'AUTO' | 'TEMPO';
  manufacturer: string;
  model: string;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'RETIRED';
  latitude?: number;
  longitude?: number;
  speed?: number;
  lastUpdated?: string;
  currentDriver?: Driver;
  currentRoute?: Route;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseExpiry: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED';
  assignedVehicle?: Vehicle;
}

export interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  stops: RouteStop[];
  assignedVehicles: Vehicle[];
}

export interface RouteStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
  type: 'PICKUP' | 'DROP' | 'BOTH';
}

export interface Trip {
  id: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  actualPickupTime?: string;
  actualDropTime?: string;
  studentCount: number;
  boardedCount: number;
  alightedCount: number;
  absentCount: number;
  route: Route;
  vehicle: Vehicle;
  driver: Driver;
}

export interface VehicleLocation {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: string;
}

export const transportationApi = {
  // VEHICLES
  getVehicles: (token: string) =>
    api.get<Vehicle[]>('/api/v1/transportation/vehicles', token),

  getVehicle: (id: string, token: string) =>
    api.get<Vehicle>(`/api/v1/transportation/vehicles/${id}`, token),

  createVehicle: (data: Partial<Vehicle>, token: string) =>
    api.post<Vehicle>('/api/v1/transportation/vehicles', data, token),

  updateVehicle: (id: string, data: Partial<Vehicle>, token: string) =>
    api.put<Vehicle>(`/api/v1/transportation/vehicles/${id}`, data, token),

  deleteVehicle: (id: string, token: string) =>
    api.delete(`/api/v1/transportation/vehicles/${id}`, token),

  getVehicleLocation: (id: string, token: string) =>
    api.get<VehicleLocation>(`/api/v1/transportation/vehicles/${id}/location`, token),

  getVehicleTrack: (id: string, token: string) =>
    api.get<VehicleLocation[]>(`/api/v1/transportation/vehicles/${id}/track`, token),

  // DRIVERS
  getDrivers: (token: string) =>
    api.get<Driver[]>('/api/v1/transportation/drivers', token),

  getDriver: (id: string, token: string) =>
    api.get<Driver>(`/api/v1/transportation/drivers/${id}`, token),

  createDriver: (data: Partial<Driver>, token: string) =>
    api.post<Driver>('/api/v1/transportation/drivers', data, token),

  updateDriver: (id: string, data: Partial<Driver>, token: string) =>
    api.put<Driver>(`/api/v1/transportation/drivers/${id}`, data, token),

  deleteDriver: (id: string, token: string) =>
    api.delete(`/api/v1/transportation/drivers/${id}`, token),

  assignDriverToVehicle: (driverId: string, vehicleId: string, token: string) =>
    api.post(`/api/v1/transportation/drivers/${driverId}/assign/${vehicleId}`, {}, token),

  // ROUTES
  getRoutes: (token: string) =>
    api.get<Route[]>('/api/v1/transportation/routes', token),

  getRoute: (id: string, token: string) =>
    api.get<Route>(`/api/v1/transportation/routes/${id}`, token),

  createRoute: (data: Partial<Route>, token: string) =>
    api.post<Route>('/api/v1/transportation/routes', data, token),

  updateRoute: (id: string, data: Partial<Route>, token: string) =>
    api.put<Route>(`/api/v1/transportation/routes/${id}`, data, token),

  deleteRoute: (id: string, token: string) =>
    api.delete(`/api/v1/transportation/routes/${id}`, token),

  // STOPS
  createStop: (routeId: string, data: Partial<RouteStop>, token: string) =>
    api.post<RouteStop>(`/api/v1/transportation/routes/${routeId}/stops`, data, token),

  updateStop: (routeId: string, stopId: string, data: Partial<RouteStop>, token: string) =>
    api.put<RouteStop>(`/api/v1/transportation/routes/${routeId}/stops/${stopId}`, data, token),

  deleteStop: (routeId: string, stopId: string, token: string) =>
    api.delete(`/api/v1/transportation/routes/${routeId}/stops/${stopId}`, token),

  // TRIPS
  getTrips: (filters?: { date?: string; status?: string }, token?: string) => {
    let endpoint = '/api/v1/transportation/trips';
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return api.get<Trip[]>(endpoint, token);
  },

  getTrip: (id: string, token: string) =>
    api.get<Trip>(`/api/v1/transportation/trips/${id}`, token),

  createTrip: (data: Partial<Trip>, token: string) =>
    api.post<Trip>('/api/v1/transportation/trips', data, token),

  startTrip: (id: string, token: string) =>
    api.post(`/api/v1/transportation/trips/${id}/start`, {}, token),

  completeTrip: (id: string, token: string) =>
    api.post(`/api/v1/transportation/trips/${id}/complete`, {}, token),

  cancelTrip: (id: string, reason: string, token: string) =>
    api.post(`/api/v1/transportation/trips/${id}/cancel`, { reason }, token),

  // VEHICLE TRACKING (Dashboard)
  getAllVehicleLocations: (token: string) =>
    api.get<VehicleLocation[]>('/api/v1/transportation/vehicles/locations', token),

  getActiveTripsByVehicle: (vehicleId: string, token: string) =>
    api.get<Trip[]>(`/api/v1/transportation/vehicles/${vehicleId}/active-trips`, token),
};

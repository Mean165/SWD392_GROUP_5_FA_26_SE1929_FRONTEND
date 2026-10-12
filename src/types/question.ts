export type QuestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

export type QuestionSource = 'MANUAL' | 'LECTURER_MANUAL' | 'AI_GENERATED' | 'IMPORTED';

export interface RubricCriteria {
  id?: string | number;
  criteriaId?: string;
  questionId?: string | number;
  criteriaName: string;
  maxScore?: number; // Mặc định thang điểm 10
  weightRatio: number; // 0.01 - 1.00 (tổng = 1.00 - 100%)
  description?: string; // Mô tả mức độ đạt điểm
  expectedKnowledgePoints: string; // Nội dung kiến thức kỳ vọng
}

export interface Question {
  id: string;
  questionId?: string;
  content: string; // Nội dung câu hỏi (chính)
  questionText: string; // Tương thích backend
  chapter?: string; // Tên chương / môn học
  topic?: string;
  topicId: string;
  topicName?: string;
  bloomLevel: BloomLevel;
  status: QuestionStatus;
  approvalStatus?: QuestionStatus | string;
  sourceType?: QuestionSource | string;
  createdBy?: string; // Giảng viên khởi tạo
  rubrics: RubricCriteria[];
  createdAt?: string;
  updatedAt?: string;

  // Thuộc tính tương thích bổ sung
  subjectId?: number | string;
  subjectCode?: string;
  difficulty?: string;
}

export interface Topic {
  id: string;
  name: string;
  code?: string;
  description?: string;
  subjectId?: number | string;
}

export interface CreateQuestionRequest {
  content?: string;
  questionText?: string;
  chapter?: string;
  topicId: string;
  topicName?: string;
  bloomLevel: BloomLevel;
  sourceType?: 'MANUAL' | 'LECTURER_MANUAL' | 'AI_GENERATED' | string;
  createdBy?: string;
  rubrics: Omit<RubricCriteria, 'id'>[];
  status?: QuestionStatus;
}

export interface QuestionFilterParams {
  topicId?: string;
  chapter?: string;
  bloomLevel?: BloomLevel | string;
  status?: QuestionStatus | string;
  keyword?: string;
}

export interface UpdateQuestionStatusRequest {
  status: QuestionStatus;
}

export interface QuestionImportRequest {
  fileName?: string;
  fileType?: string;
  content?: string;
}

export interface QuestionGenerationRequest {
  prompt: string;
  subjectCode?: string;
  topicCode?: string;
  numberOfQuestions?: number;
}

export interface RubricRequest {
  questionId: string;
  criteriaName: string;
  expectedKnowledgePoints: string;
  weightRatio: number;
}

export interface BackendQuestionResponse {
  questionId: string;
  topicId: string;
  createdBy: string;
  questionText: string;
  bloomLevel: string;
  sourceType: string;
  approvalStatus: string;
  createdAt: string;
}

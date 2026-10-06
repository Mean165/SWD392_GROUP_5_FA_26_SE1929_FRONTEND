export type QuestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

export type QuestionSource = 'MANUAL' | 'AI_GENERATED' | 'IMPORTED';

export interface RubricCriteria {
  id?: string | number;
  questionId?: string | number;
  criteriaName: string;
  maxScore?: number; // Mặc định thang điểm 10
  weightRatio: number; // 0.01 - 1.00 (tổng = 1.00 - 100%)
  description?: string; // Mô tả mức độ đạt điểm
  expectedKnowledgePoints: string; // Nội dung kiến thức kỳ vọng
}

export interface Question {
  id: string | number;
  content: string; // Nội dung câu hỏi (chính)
  questionText: string; // Tương thích ngược
  chapter?: string; // Tên chương theo môn học
  topic?: string;
  topicId: string | number;
  topicName?: string;
  bloomLevel: BloomLevel;
  status: QuestionStatus;
  sourceType?: QuestionSource | string;
  createdBy?: string; // Giảng viên khởi tạo
  rubrics: RubricCriteria[];
  createdAt?: string;
  updatedAt?: string;

  // Thuộc tính tương thích bổ sung
  subjectId?: number;
  difficulty?: string;
}

export interface Topic {
  id: string | number;
  name: string;
  code?: string;
  description?: string;
  subjectId?: number;
}

export interface CreateQuestionRequest {
  content?: string;
  questionText?: string;
  chapter?: string;
  topicId: string | number;
  topicName?: string;
  bloomLevel: BloomLevel;
  sourceType?: 'MANUAL' | string;
  createdBy?: string;
  rubrics: Omit<RubricCriteria, 'id'>[];
  status?: QuestionStatus;
}

export interface QuestionFilterParams {
  topicId?: string | number;
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

export interface GenerateQuestionRequest {
  prompt: string;
  subjectId?: number;
  count?: number;
}

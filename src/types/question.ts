export type QuestionStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
export type QuestionSource = 'MANUAL' | 'AI_GENERATED' | 'IMPORTED';

export interface Question {
  id?: number;
  content: string;
  subjectId?: number;
  topicId?: number;
  difficulty?: string;
  bloomLevel?: BloomLevel;
  status?: QuestionStatus;
  source?: QuestionSource;
  rubricId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Topic {
  id?: number;
  name: string;
  description?: string;
  subjectId?: number;
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

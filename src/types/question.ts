export type QuestionStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';
export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE';
export type QuestionSource = 'AI_GENERATED' | 'AI' | 'MANUAL' | 'IMPORTED';
export type LegacyQuestionStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type LegacyBloomLevel = BloomLevel | 'EVALUATE' | 'CREATE';

export interface Question {
  id?: number;
  content: string;
  subjectId?: number;
  topicId?: number;
  difficulty?: string;
  bloomLevel?: LegacyBloomLevel;
  status?: LegacyQuestionStatus;
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

export type GenerationJobStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';
export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface SubjectOption {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
}

export interface TopicOption {
  topicId: string;
  topicCode: string;
  topicName: string;
  description: string | null;
}

export interface QuestionDocument {
  documentId: string;
  subjectId: string;
  topicId: string;
  uploadedBy: string;
  filename: string;
  contentType: string;
  size: number;
  status: DocumentStatus;
  errorReason: string | null;
  uploadedAt: string;
  processedAt: string | null;
}

export interface GenerationJob {
  jobId: string;
  subjectId: string;
  topicId: string;
  status: GenerationJobStatus;
  progress: number;
  generatedCount: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  questionIds: string[];
}

export interface GenerationRubricCriterion {
  criteriaId?: string;
  name: string;
  description: string;
  maxPoints: number;
  weight: number;
}

export interface QuestionCitation {
  documentId: string;
  chunkId: string;
  filename: string;
  location: string;
}

export interface QuestionDetail {
  questionId: string;
  subjectId: string;
  topicId: string;
  createdBy: string;
  questionText: string;
  referenceAnswer: string | null;
  bloomLevel: BloomLevel;
  sourceType: QuestionSource;
  status: QuestionStatus;
  estimatedDifficulty: number | null;
  suggestedAnswerMinutes: number | null;
  generationJobId: string | null;
  rubric: GenerationRubricCriterion[];
  citations: QuestionCitation[];
}

export interface QuestionSummary {
  questionId: string;
  subjectId: string;
  topicId: string;
  questionText: string;
  referenceAnswer: string | null;
  bloomLevel: BloomLevel;
  sourceType: QuestionSource;
  status: QuestionStatus;
  estimatedDifficulty: number | null;
  suggestedAnswerMinutes: number | null;
  createdAt: string;
  generationJobId: string | null;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface CreateGenerationJobRequest {
  subjectId: string;
  topicId: string;
  documentIds: string[];
  numberOfQuestions: number;
  bloomDistribution: Record<BloomLevel, number>;
  language: 'vi' | 'en';
  generateRubric: boolean;
  rubricTotalPoints: number;
}

export interface UpdateQuestionRequest {
  questionText: string;
  referenceAnswer: string | null;
  bloomLevel: BloomLevel;
  estimatedDifficulty: number | null;
  suggestedAnswerMinutes: number | null;
  rubric: GenerationRubricCriterion[];
}

export interface QuestionListQuery {
  jobId?: string;
  documentId?: string;
  subjectId?: string;
  topicId?: string;
  status?: QuestionStatus;
  bloomLevel?: BloomLevel;
  sourceType?: QuestionSource;
  page?: number;
  size?: number;
  bankOnly?: boolean;
}

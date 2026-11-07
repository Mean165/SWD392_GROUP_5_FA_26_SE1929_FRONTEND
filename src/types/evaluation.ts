export interface Evaluation {
  id?: number;
  interviewId?: number;
  studentId?: number;
  lecturerId?: number;
  status?: string;
  finalScore?: number;
  aiSuggestedScore?: number;
  createdAt?: string;
}

export interface AIScoreSuggestion {
  overallScore?: number;
  questionScores?: Record<string, number>;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface LecturerFinalScore {
  evaluationId?: number;
  finalScore: number;
  adjustedReason?: string;
  reviewedAt?: string;
}

export interface GradingQueueEntry {
  submissionId: string;
  examId: string;
  examName: string;
  studentId: string;
  studentName: string;
  attemptNo: number;
  status: string;
  aiStatus: string;
  priorityScore: number;
  sessionFinishedAt: string | null;
  aiScoredAt: string | null;
  finalizedAt: string | null;
  lecturerTotalScore: number | null;
  version: number;
}

export interface GradingQueuePage {
  items: GradingQueueEntry[];
  page: number;
  size: number;
  total: number;
}

export interface GradingSubmissionTurn {
  turnId: string;
  questionId: string | null;
  turnOrder: number;
  turnType: string;
  bloomLevel: string | null;
  questionText: string;
  transcriptText: string | null;
  normalizedText: string | null;
  needsHumanReview: boolean;
}

export interface GradingSuggestion {
  questionId: string | null;
  criteriaId: string | null;
  criteriaName: string;
  points: number | null;
  missingConcepts: string | null;
  reasoning: string | null;
}

export interface GradingRubricCriterion {
  criterionId: string;
  name: string;
  expectedPoints: string;
  weight: number;
}

export interface LecturerCriterionScore {
  questionId: string;
  criterionId: string;
  score: number;
  maxScore: number;
  source: string;
  comment: string | null;
  overrideReason: string | null;
}

export interface GradingSubmissionDetail extends GradingQueueEntry {
  turns: GradingSubmissionTurn[];
  aiSuggestions: GradingSuggestion[];
  rubricCriteria: GradingRubricCriterion[];
  lecturerScores: LecturerCriterionScore[];
  questionMaxScores: Record<string, number>;
}

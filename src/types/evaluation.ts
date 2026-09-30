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

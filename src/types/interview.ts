export interface InteractionTurnResponse {
  turnId: string;
  attemptId: string;
  mainQuestionId: string;
  turnOrder: number;
  turnType: string;
  aiQuestionText: string;
  transcriptText: string | null;
  audioSegmentUrl: string | null;
  aiReasoning: string | null;
  createdAt: string;
}

export interface InterviewResponse {
  attemptId: string;
  assignmentId: string;
  sessionId: string;
  studentId: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  currentTurn: InteractionTurnResponse | null;
  turns: InteractionTurnResponse[];
}

export interface SubmitAnswerResponse {
  turnId: string;
  transcriptText: string | null;
  completed: boolean;
  followUpGenerated: boolean;
  nextTurn: InteractionTurnResponse | null;
  answerClassification: string | null;
  analysisSummary: string | null;
  assessments: Array<{
    assessmentId: string;
    criteriaId: string;
    criteriaName: string;
    semanticSimilarity: number | null;
    complianceStatus: string | null;
    aiSuggestedPoints: number | null;
    missingConcepts: string | null;
    aiExplanationReasoning: string | null;
  }>;
}

export type SubmitAnswerPayload =
  | {
      attemptId: string;
      turnId: string;
      audioSegmentUrl: string;
      transcriptText?: never;
    }
  | {
      attemptId: string;
      turnId: string;
      transcriptText: string;
      audioSegmentUrl?: never;
    };

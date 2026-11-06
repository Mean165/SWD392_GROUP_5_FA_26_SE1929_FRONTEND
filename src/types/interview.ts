export interface InteractionTurnResponse {
  turnId: string;
  attemptId: string;
  mainQuestionId: string;
  turnOrder: number;
  turnType: string;
  aiQuestionText: string;
  transcriptText: string | null;
  audioSegmentUrl: string | null;
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
  questionPlan?: PlannedQuestionResponse[];
  examAttemptId?: string;
  attemptNo?: number;
}

export interface PlannedQuestionResponse {
  questionId: string;
  position: number;
  bloomLevel: string;
  questionText: string;
}


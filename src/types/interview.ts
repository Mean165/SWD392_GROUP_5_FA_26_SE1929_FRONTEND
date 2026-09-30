export interface Interview {
  id?: number;
  examId?: number;
  studentId?: number;
  lecturerId?: number;
  status?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface InterviewQuestion {
  id?: number;
  interviewId?: number;
  questionId?: number;
  content?: string;
  order?: number;
  isFollowUp?: boolean;
}

export interface InterviewAnswer {
  id?: number;
  interviewQuestionId?: number;
  answerText?: string;
  audioUrl?: string;
  confidenceScore?: number;
  submittedAt?: string;
}

export interface FollowUpQuestion {
  id?: number;
  interviewId?: number;
  prompt: string;
  reason?: string;
  createdAt?: string;
}

export interface Transcript {
  id?: number;
  interviewId?: number;
  speaker?: string;
  text: string;
  createdAt?: string;
}

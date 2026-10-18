import type { Interview, InterviewAnswer, InterviewQuestion, Transcript, FollowUpQuestion } from '../../types/interview';
import { backendUnavailable } from '../api/backendUnavailable';

export const startInterview = async (examId: number, studentId: number): Promise<Interview> => {
  void examId;
  void studentId;
  return backendUnavailable('Interview');
};

export const getInterview = async (interviewId: number): Promise<Interview | null> => {
  void interviewId;
  return backendUnavailable('Interview');
};

export const getCurrentQuestion = async (interviewId: number): Promise<InterviewQuestion | null> => {
  void interviewId;
  return backendUnavailable('Interview question');
};

export const submitAnswer = async (interviewId: number, payload: Partial<InterviewAnswer>): Promise<InterviewAnswer> => {
  void interviewId;
  void payload;
  return backendUnavailable('Interview answer');
};

export const getTranscript = async (interviewId: number): Promise<Transcript[]> => {
  void interviewId;
  return backendUnavailable('Interview transcript');
};

export const getFollowUpQuestion = async (interviewId: number): Promise<FollowUpQuestion | null> => {
  void interviewId;
  return backendUnavailable('Interview follow-up question');
};

export const finishInterview = async (interviewId: number): Promise<Interview> => {
  void interviewId;
  return backendUnavailable('Interview');
};

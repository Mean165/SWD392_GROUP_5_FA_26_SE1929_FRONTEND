import apiClient from '../api/apiClient';
import type { Interview, InterviewAnswer, InterviewQuestion, Transcript, FollowUpQuestion } from '../../types/interview';

export const startInterview = async (examId: number, studentId: number): Promise<Interview> => {
  // TODO: connect to backend /interview/start
  return Promise.resolve({} as Interview);
};

export const getInterview = async (interviewId: number): Promise<Interview | null> => {
  // TODO: connect to backend /interview/:id
  return Promise.resolve(null);
};

export const getCurrentQuestion = async (interviewId: number): Promise<InterviewQuestion | null> => {
  // TODO: connect to backend /interview/:id/current-question
  return Promise.resolve(null);
};

export const submitAnswer = async (interviewId: number, payload: Partial<InterviewAnswer>): Promise<InterviewAnswer> => {
  // TODO: connect to backend /interview/:id/answer
  return Promise.resolve({} as InterviewAnswer);
};

export const getTranscript = async (interviewId: number): Promise<Transcript[]> => {
  // TODO: connect to backend /interview/:id/transcript
  return Promise.resolve([]);
};

export const getFollowUpQuestion = async (interviewId: number): Promise<FollowUpQuestion | null> => {
  // TODO: connect to backend /interview/:id/follow-up-question
  return Promise.resolve(null);
};

export const finishInterview = async (interviewId: number): Promise<Interview> => {
  // TODO: connect to backend /interview/:id/finish
  return Promise.resolve({} as Interview);
};

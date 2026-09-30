import apiClient from '../api/apiClient';
import type { Question, GenerateQuestionRequest, QuestionImportRequest } from '../../types/question';
import type { Rubric } from '../../types/rubric';

export const getQuestions = async (): Promise<Question[]> => {
  // TODO: connect to backend /question
  return Promise.resolve([]);
};

export const getQuestionById = async (id: number): Promise<Question | null> => {
  // TODO: connect to backend /question/:id
  return Promise.resolve(null);
};

export const createQuestion = async (payload: Partial<Question>): Promise<Question> => {
  // TODO: connect to backend /question
  return Promise.resolve({} as Question);
};

export const updateQuestion = async (id: number, payload: Partial<Question>): Promise<Question> => {
  // TODO: connect to backend /question/:id
  return Promise.resolve({} as Question);
};

export const deleteQuestion = async (id: number): Promise<void> => {
  // TODO: connect to backend /question/:id
};

export const importQuestions = async (payload: QuestionImportRequest): Promise<Question[]> => {
  // TODO: connect to backend /question/import
  return Promise.resolve([]);
};

export const generateQuestions = async (payload: GenerateQuestionRequest): Promise<Question[]> => {
  // TODO: connect to backend /question/generate
  return Promise.resolve([]);
};

export const getRubric = async (questionId?: number): Promise<Rubric | null> => {
  // TODO: connect to backend /question/rubric or /rubric
  return Promise.resolve(null);
};

export const createRubric = async (payload: Rubric): Promise<Rubric> => {
  // TODO: connect to backend /question/rubric
  return Promise.resolve({} as Rubric);
};

export const updateRubric = async (id: number, payload: Rubric): Promise<Rubric> => {
  // TODO: connect to backend /question/rubric/:id
  return Promise.resolve({} as Rubric);
};

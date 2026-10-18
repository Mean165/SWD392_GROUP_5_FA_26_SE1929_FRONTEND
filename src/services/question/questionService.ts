import type { Question, GenerateQuestionRequest, QuestionImportRequest } from '../../types/question';
import type { Rubric } from '../../types/rubric';
import { backendUnavailable } from '../api/backendUnavailable';

export const getQuestions = async (): Promise<Question[]> => {
  return backendUnavailable('Question bank');
};

export const getQuestionById = async (id: number): Promise<Question | null> => {
  void id;
  return backendUnavailable('Question bank');
};

export const createQuestion = async (payload: Partial<Question>): Promise<Question> => {
  void payload;
  return backendUnavailable('Question bank');
};

export const updateQuestion = async (id: number, payload: Partial<Question>): Promise<Question> => {
  void id;
  void payload;
  return backendUnavailable('Question bank');
};

export const deleteQuestion = async (id: number): Promise<void> => {
  void id;
  return backendUnavailable('Question bank');
};

export const importQuestions = async (payload: QuestionImportRequest): Promise<Question[]> => {
  void payload;
  return backendUnavailable('Question import');
};

export const generateQuestions = async (payload: GenerateQuestionRequest): Promise<Question[]> => {
  void payload;
  return backendUnavailable('AI/RAG question generation');
};

export const getRubric = async (questionId?: number): Promise<Rubric | null> => {
  void questionId;
  return backendUnavailable('Rubric');
};

export const createRubric = async (payload: Rubric): Promise<Rubric> => {
  void payload;
  return backendUnavailable('Rubric');
};

export const updateRubric = async (id: number, payload: Rubric): Promise<Rubric> => {
  void id;
  void payload;
  return backendUnavailable('Rubric');
};

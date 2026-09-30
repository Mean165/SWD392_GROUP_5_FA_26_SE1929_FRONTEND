import apiClient from '../api/apiClient';
import type { AIScoreSuggestion, Evaluation, LecturerFinalScore } from '../../types/evaluation';

export const getEvaluations = async (): Promise<Evaluation[]> => {
  // TODO: connect to backend /evaluation
  return Promise.resolve([]);
};

export const getEvaluationById = async (id: number): Promise<Evaluation | null> => {
  // TODO: connect to backend /evaluation/:id
  return Promise.resolve(null);
};

export const getAIScoreSuggestion = async (evaluationId: number): Promise<AIScoreSuggestion | null> => {
  // TODO: connect to backend /evaluation/:id/ai-score-suggestion
  return Promise.resolve(null);
};

export const submitLecturerScore = async (evaluationId: number, payload: LecturerFinalScore): Promise<Evaluation> => {
  // TODO: connect to backend /evaluation/:id/score
  return Promise.resolve({} as Evaluation);
};

export const updateEvaluation = async (id: number, payload: Partial<Evaluation>): Promise<Evaluation> => {
  // TODO: connect to backend /evaluation/:id
  return Promise.resolve({} as Evaluation);
};

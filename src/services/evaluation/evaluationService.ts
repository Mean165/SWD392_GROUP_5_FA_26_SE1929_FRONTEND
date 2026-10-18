import type { AIScoreSuggestion, Evaluation, LecturerFinalScore } from '../../types/evaluation';
import { backendUnavailable } from '../api/backendUnavailable';

export const getEvaluations = async (): Promise<Evaluation[]> => {
  return backendUnavailable('Evaluation');
};

export const getEvaluationById = async (id: number): Promise<Evaluation | null> => {
  void id;
  return backendUnavailable('Evaluation');
};

export const getAIScoreSuggestion = async (evaluationId: number): Promise<AIScoreSuggestion | null> => {
  void evaluationId;
  return backendUnavailable('AI score suggestion');
};

export const submitLecturerScore = async (evaluationId: number, payload: LecturerFinalScore): Promise<Evaluation> => {
  void evaluationId;
  void payload;
  return backendUnavailable('Lecturer final score');
};

export const updateEvaluation = async (id: number, payload: Partial<Evaluation>): Promise<Evaluation> => {
  void id;
  void payload;
  return backendUnavailable('Evaluation');
};

import type { RubricCriteria } from './question';

export type { RubricCriteria };

export interface RubricCriterion {
  id?: number | string;
  questionId?: string | number;
  name?: string;
  criteriaName?: string;
  description?: string;
  expectedKnowledgePoints?: string;
  maxScore?: number;
  weight?: number;
  weightRatio?: number;
  order?: number;
}

export interface Rubric {
  id?: number | string;
  questionId?: string | number;
  name?: string;
  description?: string;
  criteria?: RubricCriterion[] | RubricCriteria[];
  subjectId?: number;
  createdAt?: string;
}

export interface RubricCriterion {
  id?: number;
  name: string;
  description?: string;
  maxScore: number;
  weight?: number;
  order?: number;
}

export interface Rubric {
  id?: number;
  name: string;
  description?: string;
  criteria: RubricCriterion[];
  subjectId?: number;
  createdAt?: string;
}

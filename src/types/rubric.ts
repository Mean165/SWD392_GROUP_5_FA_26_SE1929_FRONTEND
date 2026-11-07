export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
export const BLOOM_LEVELS: BloomLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

export interface RubricCriterionInput {
  criteriaName: string;
  expectedKnowledgePoints: string;
  weightRatio: number;
}
export interface SubjectRubricInput {
  name: string;
  description?: string | null;
  criteria: RubricCriterionInput[];
}
export interface RubricCriterion extends RubricCriterionInput {
  criteriaId: string;
  rubricId: string | null;
  questionId: string | null;
}
export interface SubjectRubric {
  rubricId: string;
  subjectId: string | null;
  topicId: null;
  bloomLevel: null;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  source: 'SUBJECT';
  criteria: RubricCriterion[];
}
export interface SubjectRubricStats {
  subjectId: string;
  activeRubricId: string | null;
  criteriaCount: number;
  approvedQuestionsByBloom: Record<BloomLevel, number>;
  topicId: null;
  levels: null;
}

// Kept for question-editing workspaces that still use the legacy rubric model.
export interface Criterion extends RubricCriterionInput { criteriaId?: string; rubricId?: string | null; questionId?: string | null }
export interface Rubric extends Omit<SubjectRubric, 'topicId' | 'bloomLevel'> { topicId?: string | null; bloomLevel?: BloomLevel | null }
export interface MatrixLevel {
  bloomLevel: BloomLevel;
  hasActiveRubric: boolean;
  criteriaCount: number;
  approvedQuestionCount: number;
  missingRubricQuestionCount: number;
  rubric?: Rubric;
  activeRubric?: Rubric;
}
export interface BloomLevelOption { code: BloomLevel; label: string }
export type RubricWriteRequest = SubjectRubricInput;
export interface LegacyRubricCriterion { id?: number; name: string; description?: string; maxScore: number; weight?: number; order?: number }

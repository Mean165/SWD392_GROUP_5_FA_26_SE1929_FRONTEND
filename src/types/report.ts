export interface StudentReport {
  studentId?: number;
  examId?: number;
  totalScore?: number;
  passed?: boolean;
  comments?: string[];
}

export interface ClassReport {
  examId?: number;
  averageScore?: number;
  passRate?: number;
  highScore?: number;
  lowScore?: number;
}

export interface QuestionStatistics {
  questionId?: number;
  correctRate?: number;
  averageScore?: number;
  difficulty?: string;
}

export interface ScoreDistribution {
  label: string;
  value: number;
}

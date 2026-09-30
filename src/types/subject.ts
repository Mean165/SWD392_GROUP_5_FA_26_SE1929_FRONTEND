export interface Subject {
  id: number;
  code: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

export interface SubjectAssignment {
  id: number;
  subjectId: number;
  lecturerId: number;
  assignedAt?: string;
  status?: string;
}

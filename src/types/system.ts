export type LanguageCode = 'VI' | 'EN';

export interface LanguageDefaults {
  sttLanguage: LanguageCode;
  ttsLanguage: LanguageCode;
}

export interface AdminLecturer {
  userId: string;
  fullName: string;
  email: string;
  studentOrStaffCode: string | null;
  isActive: boolean;
}

export interface AdminSubjectAssignment {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  lecturerIds: string[];
  lecturers: AdminLecturer[];
  description?: string | null;
  topicCount?: number;
}

export interface AdminTopic {
  topicId: string;
  topicCode: string;
  topicName: string;
  description: string | null;
}

export interface AdminTopicRequest {
  topicCode: string;
  topicName: string;
  description: string;
}

export interface AdminSubject extends AdminSubjectAssignment {
  description: string | null;
  topicCount: number;
  topics: AdminTopic[];
}

export interface AdminSubjectRequest {
  subjectCode: string;
  subjectName: string;
  description: string | null;
}

export interface CreateAdminSubjectRequest extends AdminSubjectRequest {
  topics: AdminTopicRequest[];
}

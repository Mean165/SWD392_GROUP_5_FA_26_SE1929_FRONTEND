import type {
  AdminLecturer,
  AdminSubject,
  AdminSubjectAssignment,
  AdminTopicRequest,
  CreateAdminSubjectRequest,
  AdminSubjectRequest,
  LanguageDefaults,
} from '../../types/system';
import apiClient from '../api/apiClient';
import type { ApiResponse } from '../../types/user';

const unwrap = <T>(payload: ApiResponse<T>): T => {
  if (!payload || payload.success !== true || payload.data === null || payload.data === undefined) {
    throw new Error(payload?.message || 'The server returned an invalid response.');
  }
  return payload.data;
};

export const getAdminSubjects = async (keyword = '', signal?: AbortSignal): Promise<AdminSubject[]> => {
  const normalizedKeyword = keyword.trim();
  const response = await apiClient.get<ApiResponse<AdminSubject[]>>(
    '/system/admin/subjects',
    {
      ...(normalizedKeyword ? { params: { keyword: normalizedKeyword } } : {}),
      ...(signal ? { signal } : {}),
    },
  );
  return unwrap(response.data);
};

export const getAdminSubjectById = async (subjectId: string, signal?: AbortSignal): Promise<AdminSubject> => {
  const response = await apiClient.get<ApiResponse<AdminSubject>>(
    `/system/admin/subjects/${encodeURIComponent(subjectId)}`,
    signal ? { signal } : undefined,
  );
  return unwrap(response.data);
};

export const createAdminSubject = async (payload: CreateAdminSubjectRequest): Promise<AdminSubject> => {
  const response = await apiClient.post<ApiResponse<AdminSubject>>('/system/admin/subjects', payload);
  return unwrap(response.data);
};

export const addAdminSubjectTopics = async (
  subjectId: string,
  topics: AdminTopicRequest[],
): Promise<AdminSubject> => {
  const response = await apiClient.post<ApiResponse<AdminSubject>>(
    `/system/admin/subjects/${encodeURIComponent(subjectId)}/topics`,
    { topics },
  );
  return unwrap(response.data);
};

export const updateAdminSubject = async (subjectId: string, payload: AdminSubjectRequest): Promise<AdminSubject> => {
  const response = await apiClient.put<ApiResponse<AdminSubject>>(
    `/system/admin/subjects/${encodeURIComponent(subjectId)}`,
    payload,
  );
  return unwrap(response.data);
};

export const getLanguageDefaults = async (): Promise<LanguageDefaults> => {
  const response = await apiClient.get<ApiResponse<LanguageDefaults>>('/system/admin/language-defaults');
  return unwrap(response.data);
};

export const updateLanguageDefaults = async (payload: LanguageDefaults): Promise<LanguageDefaults> => {
  const response = await apiClient.put<ApiResponse<LanguageDefaults>>('/system/admin/language-defaults', payload);
  return unwrap(response.data);
};

export const getAdminLecturers = async (): Promise<AdminLecturer[]> => {
  const response = await apiClient.get<ApiResponse<AdminLecturer[]>>('/system/admin/lecturers');
  return unwrap(response.data);
};

export const getSubjectAssignments = async (): Promise<AdminSubjectAssignment[]> => {
  const response = await apiClient.get<ApiResponse<AdminSubjectAssignment[]>>('/system/admin/subjects');
  return unwrap(response.data);
};

export const getLecturerSubjects = async (lecturerId: string): Promise<AdminSubjectAssignment[]> => {
  const response = await apiClient.get<ApiResponse<AdminSubjectAssignment[]>>(
    `/system/admin/lecturers/${encodeURIComponent(lecturerId)}/subjects`,
  );
  return unwrap(response.data);
};

export const assignLecturersToSubject = async (
  subjectId: string,
  lecturerIds: string[],
): Promise<AdminSubjectAssignment> => {
  const response = await apiClient.post<ApiResponse<AdminSubjectAssignment>>(
    `/system/admin/subjects/${encodeURIComponent(subjectId)}/lecturers`,
    { lecturerIds },
  );
  return unwrap(response.data);
};

export const unassignLecturerFromSubject = async (
  subjectId: string,
  lecturerId: string,
): Promise<AdminSubjectAssignment> => {
  const response = await apiClient.delete<ApiResponse<AdminSubjectAssignment>>(
    `/system/admin/subjects/${encodeURIComponent(subjectId)}/lecturers/${encodeURIComponent(lecturerId)}`,
  );
  return unwrap(response.data);
};


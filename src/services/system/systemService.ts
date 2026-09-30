import apiClient from '../api/apiClient';
import type { SystemConfiguration, SystemLanguageConfig } from '../../types/system';

export const getConfigurations = async (): Promise<SystemConfiguration[]> => {
  // TODO: connect to backend /system/configurations
  return Promise.resolve([]);
};

export const updateConfiguration = async (key: string, value: string): Promise<SystemConfiguration> => {
  // TODO: connect to backend /system/configurations/:key
  return Promise.resolve({} as SystemConfiguration);
};

export const getLanguageConfiguration = async (): Promise<SystemLanguageConfig | null> => {
  // TODO: connect to backend /system/language
  return Promise.resolve(null);
};

export const getSubjectAssignments = async (): Promise<Record<string, unknown>[]> => {
  // TODO: connect to backend /system/subject-assignments
  return Promise.resolve([]);
};

export const assignLecturer = async (subjectId: number, lecturerId: number): Promise<unknown> => {
  // TODO: connect to backend /system/assign-lecturer
  return Promise.resolve({});
};

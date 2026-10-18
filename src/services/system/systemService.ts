import type { SystemConfiguration, SystemLanguageConfig } from '../../types/system';
import { backendUnavailable } from '../api/backendUnavailable';

export const getConfigurations = async (): Promise<SystemConfiguration[]> => {
  return backendUnavailable('System configuration');
};

export const updateConfiguration = async (key: string, value: string): Promise<SystemConfiguration> => {
  void key;
  void value;
  return backendUnavailable('System configuration');
};

export const getLanguageConfiguration = async (): Promise<SystemLanguageConfig | null> => {
  return backendUnavailable('System language configuration');
};

export const getSubjectAssignments = async (): Promise<Record<string, unknown>[]> => {
  return backendUnavailable('Subject assignment');
};

export const assignLecturer = async (subjectId: number, lecturerId: number): Promise<unknown> => {
  void subjectId;
  void lecturerId;
  return backendUnavailable('Lecturer assignment');
};

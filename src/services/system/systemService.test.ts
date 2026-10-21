import type { AxiosAdapter } from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import apiClient from '../api/apiClient';
import {
  addAdminSubjectTopics,
  assignLecturersToSubject,
  createAdminSubject,
  getAdminSubjectById,
  getAdminLecturers,
  getAdminSubjects,
  getLanguageDefaults,
  getLecturerSubjects,
  getSubjectAssignments,
  unassignLecturerFromSubject,
  updateAdminSubject,
  updateLanguageDefaults,
} from './systemService';

describe('admin system service', () => {
  const originalAdapter = apiClient.defaults.adapter;

  beforeEach(() => localStorage.setItem('accessToken', 'admin-token'));
  afterEach(() => { apiClient.defaults.adapter = originalAdapter; });

  it('requests subjects with an optional trimmed server-side keyword and unwraps the envelope', async () => {
    const requests: Array<{ url?: string; params?: unknown; authorization?: string }> = [];
    const subjects = [{
      subjectId: 'subject-1',
      subjectCode: 'SWD392',
      subjectName: 'Software Development Project',
      description: null,
      lecturerIds: [],
      lecturers: [],
      topicCount: 1,
    }];
    apiClient.defaults.adapter = async (config) => {
      requests.push({ url: config.url, params: config.params, authorization: config.headers.get('Authorization') as string });
      return { data: { success: true, message: 'ok', data: subjects, timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };

    await expect(getAdminSubjects()).resolves.toEqual(subjects);
    await expect(getAdminSubjects('  OOP  ')).resolves.toEqual(subjects);
    expect(requests).toEqual([
      { url: '/system/admin/subjects', params: undefined, authorization: 'Bearer admin-token' },
      { url: '/system/admin/subjects', params: { keyword: 'OOP' }, authorization: 'Bearer admin-token' },
    ]);
  });

  it('loads subject detail by UUID and sends full create/update payloads', async () => {
    const requests: Array<{ url?: string; method?: string; data?: unknown }> = [];
    const subject = {
      subjectId: 'subject-1',
      subjectCode: 'SWD392',
      subjectName: 'Software Development Project',
      description: null,
      lecturerIds: ['le-1'],
      lecturers: [{ userId: 'le-1', fullName: 'Lecturer One', email: 'one@example.test', studentOrStaffCode: 'LE1', isActive: true }],
      topicCount: 1,
    };
    apiClient.defaults.adapter = async (config) => {
      requests.push({ url: config.url, method: config.method, data: config.data ? JSON.parse(config.data as string) : undefined });
      return { data: { success: true, message: 'ok', data: subject, timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };
    const updatePayload = { subjectCode: 'SWD392', subjectName: 'Software Development Project', description: null };
    const topic = { topicCode: 'SWD392-DESIGN', topicName: 'Software Design', description: 'Design principles' };
    const createPayload = { ...updatePayload, topics: [topic] };

    await expect(getAdminSubjectById('subject/1')).resolves.toEqual(subject);
    await expect(createAdminSubject(createPayload)).resolves.toEqual(subject);
    await expect(updateAdminSubject('subject/1', updatePayload)).resolves.toEqual(subject);
    await expect(addAdminSubjectTopics('subject/1', [topic])).resolves.toEqual(subject);
    expect(requests).toEqual([
      { url: '/system/admin/subjects/subject%2F1', method: 'get', data: undefined },
      { url: '/system/admin/subjects', method: 'post', data: createPayload },
      { url: '/system/admin/subjects/subject%2F1', method: 'put', data: updatePayload },
      { url: '/system/admin/subjects/subject%2F1/topics', method: 'post', data: { topics: [topic] } },
    ]);
  });

  it('loads lecturers, subject assignments, and lecturer-specific subjects', async () => {
    const requests: Array<{ url?: string; method?: string; authorization?: string }> = [];
    apiClient.defaults.adapter = async (config) => {
      requests.push({ url: config.url, method: config.method, authorization: config.headers.get('Authorization') as string });
      return { data: { success: true, message: 'ok', data: [], timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };

    await getAdminLecturers();
    await getSubjectAssignments();
    await getLecturerSubjects('lecturer/uuid');

    expect(requests).toEqual([
      { url: '/system/admin/lecturers', method: 'get', authorization: 'Bearer admin-token' },
      { url: '/system/admin/subjects', method: 'get', authorization: 'Bearer admin-token' },
      { url: '/system/admin/lecturers/lecturer%2Fuuid/subjects', method: 'get', authorization: 'Bearer admin-token' },
    ]);
  });

  it('sends one batch assignment request and returns the updated assignment', async () => {
    let sentConfig: Parameters<AxiosAdapter>[0] | undefined;
    const assignment = { subjectId: 'subject-1', subjectCode: 'S1', subjectName: 'Subject', lecturerIds: ['le-1'], lecturers: [] };
    const adapter: AxiosAdapter = async (config) => {
      sentConfig = config;
      return { data: { success: true, message: 'assigned', data: assignment, timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };
    apiClient.defaults.adapter = adapter;

    await expect(assignLecturersToSubject('subject-1', ['le-1', 'le-2'])).resolves.toEqual(assignment);
    expect(sentConfig?.url).toBe('/system/admin/subjects/subject-1/lecturers');
    expect(sentConfig?.method).toBe('post');
    expect(JSON.parse(sentConfig?.data as string)).toEqual({ lecturerIds: ['le-1', 'le-2'] });
  });

  it('deletes one lecturer assignment using both returned IDs', async () => {
    let sentConfig: Parameters<AxiosAdapter>[0] | undefined;
    const assignment = { subjectId: 'subject-1', subjectCode: 'S1', subjectName: 'Subject', lecturerIds: [], lecturers: [] };
    const adapter: AxiosAdapter = async (config) => {
      sentConfig = config;
      return { data: { success: true, message: 'removed', data: assignment, timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };
    apiClient.defaults.adapter = adapter;

    await expect(unassignLecturerFromSubject('subject/1', 'lecturer/2')).resolves.toEqual(assignment);
    expect(sentConfig?.url).toBe('/system/admin/subjects/subject%2F1/lecturers/lecturer%2F2');
    expect(sentConfig?.method).toBe('delete');
    expect(sentConfig?.data).toBeUndefined();
  });

  it('loads and saves uppercase VI/EN default language codes', async () => {
    const sent: Array<{ url?: string; method?: string; data?: unknown }> = [];
    const defaults = { sttLanguage: 'VI', ttsLanguage: 'EN' } as const;
    apiClient.defaults.adapter = async (config) => {
      sent.push({ url: config.url, method: config.method, data: config.data ? JSON.parse(config.data as string) : undefined });
      return { data: { success: true, message: 'ok', data: defaults, timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };

    await expect(getLanguageDefaults()).resolves.toEqual(defaults);
    await expect(updateLanguageDefaults(defaults)).resolves.toEqual(defaults);
    expect(sent).toEqual([
      { url: '/system/admin/language-defaults', method: 'get', data: undefined },
      { url: '/system/admin/language-defaults', method: 'put', data: defaults },
    ]);
  });
});

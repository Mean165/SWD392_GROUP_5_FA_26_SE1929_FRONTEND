import type { AxiosAdapter } from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import apiClient from '../api/apiClient';
import { createUser, deleteStudentAccount, getAdminUsers, getUserById, lockUser, resetUserPassword, unlockUser, updateUser } from './userService';

const pageResponse = {
  content: [],
  page: 1,
  size: 20,
  totalElements: 0,
  totalPages: 0,
};

describe('admin user service', () => {
  const originalAdapter = apiClient.defaults.adapter;

  beforeEach(() => localStorage.setItem('accessToken', 'test-access-token'));
  afterEach(() => { apiClient.defaults.adapter = originalAdapter; });

  it('requests server-side users with the exact filters and unwraps ApiResponse.data', async () => {
    let sentConfig: Parameters<AxiosAdapter>[0] | undefined;
    const adapter: AxiosAdapter = async (config) => {
      sentConfig = config;
      return {
        data: { success: true, message: 'Page loaded', data: pageResponse, timestamp: 'now' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    apiClient.defaults.adapter = adapter;
    const result = await getAdminUsers({ page: 1, size: 20, keyword: 'linh', roleCode: 'LE', isActive: false });

    expect(sentConfig?.url).toBe('/users/admin');
    expect(sentConfig?.params).toEqual({ page: 1, size: 20, keyword: 'linh', roleCode: 'LE', isActive: false });
    expect(sentConfig?.headers.get('Authorization')).toBe('Bearer test-access-token');
    expect(result).toEqual(pageResponse);
  });

  it('uses dedicated lock and unlock endpoints', async () => {
    const sent: Array<{ url?: string; method?: string }> = [];
    const adapter: AxiosAdapter = async (config) => {
      sent.push({ url: config.url, method: config.method });
      return { data: { success: true, message: 'ok', data: { userId: 'uuid' }, timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };

    apiClient.defaults.adapter = adapter;
    await lockUser('user/one');
    await unlockUser('user/one');
    expect(sent).toEqual([
      { url: '/users/user%2Fone/lock', method: 'post' },
      { url: '/users/user%2Fone/unlock', method: 'post' },
    ]);
  });

  it('creates, loads by UUID, and updates an account using the confirmed request fields', async () => {
    const requests: Array<{ url?: string; method?: string; data?: unknown; authorization?: string }> = [];
    const user = { userId: 'user-id', fullName: 'Nguyen Van A', email: 'a@example.test', roleName: 'Lecturer' };
    apiClient.defaults.adapter = async (config) => {
      requests.push({
        url: config.url,
        method: config.method,
        data: config.data ? JSON.parse(config.data as string) : undefined,
        authorization: config.headers.get('Authorization') as string,
      });
      return { data: { success: true, message: 'ok', data: user, timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };

    const created = await createUser({ fullName: 'Nguyen Van A', email: 'a@example.test', password: 'InitialPass-123', roleCode: 'LE' });
    await getUserById('user-id');
    const updated = await updateUser('user-id', { fullName: 'Nguyen Van B', roleCode: 'ST' });

    expect(created).toEqual(user);
    expect(updated).toEqual(user);
    expect(requests).toEqual([
      { url: '/users', method: 'post', data: { fullName: 'Nguyen Van A', email: 'a@example.test', password: 'InitialPass-123', roleCode: 'LE' }, authorization: 'Bearer test-access-token' },
      { url: '/users/user-id', method: 'get', data: undefined, authorization: 'Bearer test-access-token' },
      { url: '/users/user-id', method: 'put', data: { fullName: 'Nguyen Van B', roleCode: 'ST' }, authorization: 'Bearer test-access-token' },
    ]);
  });

  it('sends the password reset body and never expects a password in the response', async () => {
    let sentConfig: Parameters<AxiosAdapter>[0] | undefined;
    const adapter: AxiosAdapter = async (config) => {
      sentConfig = config;
      return { data: { success: true, message: 'reset', data: null, timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };

    apiClient.defaults.adapter = adapter;
    await expect(resetUserPassword('user-id', { newPassword: 'NewPass-12345' })).resolves.toBeNull();
    expect(sentConfig?.url).toBe('/users/user-id/password-reset');
    expect(JSON.parse(sentConfig?.data as string)).toEqual({ newPassword: 'NewPass-12345' });
  });

  it('deletes by the selected student UUID through the existing user endpoint', async () => {
    let sentConfig: Parameters<AxiosAdapter>[0] | undefined;
    const adapter: AxiosAdapter = async (config) => {
      sentConfig = config;
      return { data: { success: true, message: 'deleted', data: null, timestamp: 'now' }, status: 200, statusText: 'OK', headers: {}, config };
    };
    apiClient.defaults.adapter = adapter;

    await expect(deleteStudentAccount('student/uuid')).resolves.toBeUndefined();
    expect(sentConfig?.url).toBe('/users/student%2Fuuid');
    expect(sentConfig?.method).toBe('delete');
    expect(sentConfig?.headers.get('Authorization')).toBe('Bearer test-access-token');
  });
});

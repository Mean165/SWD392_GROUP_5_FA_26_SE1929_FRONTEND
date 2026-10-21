import type { AxiosAdapter } from 'axios';
import { describe, expect, it } from 'vitest';
import apiClient from './apiClient';

describe('apiClient FormData requests', () => {
  it('uses the same-origin Vite proxy during development', () => {
    expect(apiClient.defaults.baseURL).toBe('/api');
  });

  it('keeps FormData intact and lets the browser set the multipart boundary', async () => {
    const body = new FormData();
    body.append('file', new File(['document'], 'notes.pdf', { type: 'application/pdf' }));
    let sentConfig: Parameters<AxiosAdapter>[0] | undefined;
    const adapter: AxiosAdapter = async (config) => {
      sentConfig = config;
      return {
        data: { accepted: true },
        status: 202,
        statusText: 'Accepted',
        headers: {},
        config,
      };
    };

    await apiClient.post('/question-generation/documents', body, { adapter });

    expect(sentConfig?.data).toBeInstanceOf(FormData);
    expect(sentConfig?.headers.get('Content-Type')).toBe(false);
    expect(sentConfig?.headers.toJSON()).not.toHaveProperty('Content-Type');
  });
});

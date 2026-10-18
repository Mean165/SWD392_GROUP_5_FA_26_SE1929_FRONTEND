import { describe, expect, it } from 'vitest';
import { ApiResponseError, unwrapApiResponse } from './apiResponse';

describe('unwrapApiResponse', () => {
  it('returns data from a successful backend envelope', () => {
    expect(unwrapApiResponse<{ value: number }>({
      success: true,
      message: 'OK',
      data: { value: 42 },
    })).toEqual({ value: 42 });
  });

  it('rejects unsuccessful, missing, and empty envelopes', () => {
    expect(() => unwrapApiResponse({ success: false, message: 'Rejected', data: null }))
      .toThrow(ApiResponseError);
    expect(() => unwrapApiResponse({ data: {} })).toThrow(ApiResponseError);
  });
});

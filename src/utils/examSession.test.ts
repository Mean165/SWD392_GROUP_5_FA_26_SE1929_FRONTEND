import { describe, expect, it } from 'vitest';
import { getExamErrorDetails, missingBloomEntries, statusPresentation, validateBloomDistribution, dateTimeLocalToOffset, dateTimeToVietnamLocalInput } from './examSession';
import { ApiResponseError, unwrapApiResponse } from '../services/api/apiResponse';

describe('exam session presentation and validation', () => {
  it('maps assignment/session states to Vietnamese labels and colors', () => {
    expect(statusPresentation('SCHEDULED')).toEqual({ label: 'Đã lên lịch', color: 'blue' });
    expect(statusPresentation('IN_PROGRESS')).toEqual({ label: 'Đang diễn ra', color: 'green' });
    expect(statusPresentation('CANCELLED')).toEqual({ label: 'Đã hủy', color: 'red' });
    expect(statusPresentation('ABSENT')).toEqual({ label: 'Vắng', color: 'amber' });
  });

  it('requires integer Bloom counts to sum to the main question count', () => {
    expect(validateBloomDistribution({ REMEMBER: 2, UNDERSTAND: 1 }, 3).valid).toBe(true);
    expect(validateBloomDistribution({ REMEMBER: 2, UNDERSTAND: 1 }, 4).valid).toBe(false);
    expect(validateBloomDistribution({ REMEMBER: 1.5 }, 1.5).valid).toBe(false);
  });

  it('serializes datetime-local as an ISO date-time with the configured offset', () => {
    expect(dateTimeLocalToOffset('2026-10-25T09:30')).toBe('2026-10-25T09:30:00+07:00');
    expect(dateTimeLocalToOffset('')).toBeNull();
    expect(dateTimeLocalToOffset('not-a-date')).toBeNull();
    expect(dateTimeToVietnamLocalInput('2026-10-25T02:30:00Z')).toBe('2026-10-25T09:30');
  });

  it('preserves the backend 409 message and safely reads optional errorCode', () => {
    const error = { response: { status: 409, data: { success: false, message: 'Ngân hàng thiếu câu.', errorCode: 'SESSION_BANK_INSUFFICIENT', data: { missing: { APPLY: 2 } } } } };
    expect(getExamErrorDetails(error)).toMatchObject({ status: 409, message: 'Ngân hàng thiếu câu.', errorCode: 'SESSION_BANK_INSUFFICIENT' });
    expect(missingBloomEntries(error)).toEqual([{ level: 'APPLY', count: 2 }]);
    expect(getExamErrorDetails({ response: { status: 409, data: { message: 'Conflict', data: { code: 'SCHEDULE_CONFLICT' } } } }).errorCode).toBe('SCHEDULE_CONFLICT');
    try {
      unwrapApiResponse({ success: false, message: 'Thiếu câu hỏi.', errorCode: 'SESSION_BANK_INSUFFICIENT', data: { missing: { APPLY: 2 } } });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiResponseError);
      expect(getExamErrorDetails(error)).toMatchObject({ message: 'Thiếu câu hỏi.', errorCode: 'SESSION_BANK_INSUFFICIENT' });
      expect(missingBloomEntries(error)).toEqual([{ level: 'APPLY', count: 2 }]);
    }
  });
});

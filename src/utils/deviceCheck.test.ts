import { describe, expect, it } from 'vitest';
import {
  getGetUserMediaErrorMessage,
  getDeviceCheckFileExtension,
  getLevelPresentation,
  repairMojibake,
  selectDeviceCheckMimeType,
} from './deviceCheck';

describe('device-check utilities', () => {
  it('selects the highest-priority supported mime type allowed by the backend', () => {
    const acceptedMimeTypes = ['audio/mp4', 'audio/webm', 'audio/ogg'];
    expect(selectDeviceCheckMimeType(acceptedMimeTypes, (mimeType) => (
      mimeType === 'audio/webm;codecs=opus' || mimeType === 'audio/mp4'
    ))).toBe('audio/webm;codecs=opus');
    expect(selectDeviceCheckMimeType(['audio/mp4'], (mimeType) => mimeType === 'audio/mp4'))
      .toBe('audio/mp4');
    expect(selectDeviceCheckMimeType(['audio/flac'], () => false)).toBeNull();
  });

  it('maps recorded mime types to backend-compatible file extensions', () => {
    expect(getDeviceCheckFileExtension('audio/webm;codecs=opus')).toBe('.webm');
    expect(getDeviceCheckFileExtension('audio/mp4')).toBe('.mp4');
    expect(getDeviceCheckFileExtension('audio/ogg')).toBe('.ogg');
  });

  it('repairs single and double UTF-8 mojibake without changing valid or unrelated text', () => {
    expect(repairMojibake('TÃ´i Ä‘ang kiá»ƒm tra micro.')).toBe('Tôi đang kiểm tra micro.');
    expect(repairMojibake('TÃƒÂ´i Ä‘ang kiá»ƒm tra micro.')).toBe('Tôi đang kiểm tra micro.');
    expect(repairMojibake('Tôi đang kiểm tra micro.')).toBe('Tôi đang kiểm tra micro.');
    expect(repairMojibake('I am checking my microphone.')).toBe('I am checking my microphone.');
  });

  it('provides accessible labels and colors for backend speech levels', () => {
    expect(getLevelPresentation('GOOD').label).toBe('Tốt');
    expect(getLevelPresentation('FAIR').label).toBe('Đạt');
    expect(getLevelPresentation('POOR').label).toBe('Chưa đạt');
    expect(getLevelPresentation('EMPTY').label).toBe('Không nhận diện được');
  });

  it('gives actionable permission/device errors without throwing', () => {
    expect(getGetUserMediaErrorMessage(new DOMException('Denied', 'NotAllowedError')))
      .toContain('Quyền micro chưa được cấp');
    expect(getGetUserMediaErrorMessage(new DOMException('Missing', 'NotFoundError')))
      .toContain('Không tìm thấy micro');
    expect(getGetUserMediaErrorMessage(new DOMException('Busy', 'NotReadableError')))
      .toContain('ứng dụng khác');
  });
});

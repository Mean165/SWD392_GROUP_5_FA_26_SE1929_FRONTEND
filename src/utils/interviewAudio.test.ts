import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_AUDIO_MIME_TYPES,
  blobToAudioDataUrl,
  MAX_AUDIO_BYTES,
  selectSupportedAudioMimeType,
} from './interviewAudio';

describe('interview audio helpers', () => {
  it('selects only a browser-supported MIME type accepted by the backend', () => {
    const selected = selectSupportedAudioMimeType((mimeType) => mimeType === 'audio/mp4');
    expect(selected).toBe('audio/mp4');
    expect(ACCEPTED_AUDIO_MIME_TYPES).toContain(selected);
    expect(selectSupportedAudioMimeType(() => false)).toBeNull();
  });

  it('converts a complete recording into a MIME-correct base64 data URL', async () => {
    await expect(blobToAudioDataUrl(new Blob(['recorded audio'], { type: 'audio/webm' })))
      .resolves.toMatch(/^data:audio\/webm;base64,/);
  });

  it('rejects empty, unsupported, and over-limit recordings', async () => {
    await expect(blobToAudioDataUrl(new Blob([], { type: 'audio/webm' })))
      .rejects.toThrow('Bản ghi trống');
    await expect(blobToAudioDataUrl(new Blob(['audio'], { type: 'audio/unknown' })))
      .rejects.toThrow('không được máy chủ hỗ trợ');
    await expect(blobToAudioDataUrl(new Blob([new Uint8Array(MAX_AUDIO_BYTES + 1)], { type: 'audio/webm' })))
      .rejects.toThrow('10 MiB');
  });
});

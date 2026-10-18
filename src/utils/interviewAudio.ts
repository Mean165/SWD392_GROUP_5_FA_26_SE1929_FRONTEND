export const ACCEPTED_AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
] as const;

export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_DATA_URL_LENGTH = 14_000_000;

export const selectSupportedAudioMimeType = (
  isTypeSupported: (mimeType: string) => boolean,
): string | null => ACCEPTED_AUDIO_MIME_TYPES.find(isTypeSupported) ?? null;

export const blobToAudioDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const mimeType = blob.type.split(';', 1)[0].trim().toLowerCase();
  if (!ACCEPTED_AUDIO_MIME_TYPES.includes(mimeType as (typeof ACCEPTED_AUDIO_MIME_TYPES)[number])) {
    reject(new Error('Định dạng bản ghi không được máy chủ hỗ trợ.'));
    return;
  }
  if (blob.size === 0) {
    reject(new Error('Bản ghi trống. Hãy ghi âm lại trước khi gửi.'));
    return;
  }
  if (blob.size > MAX_AUDIO_BYTES) {
    reject(new Error('Bản ghi vượt quá giới hạn 10 MiB. Hãy ghi một câu trả lời ngắn hơn.'));
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Không thể đọc bản ghi âm trên thiết bị này.'));
  reader.onload = () => {
    const dataUrl = reader.result;
    const expectedPrefix = `data:${mimeType};base64,`;
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith(expectedPrefix)) {
      reject(new Error('Không thể chuyển bản ghi sang định dạng gửi được.'));
      return;
    }
    if (dataUrl.length > MAX_AUDIO_DATA_URL_LENGTH) {
      reject(new Error('Bản ghi vượt quá giới hạn gửi. Hãy ghi một câu trả lời ngắn hơn.'));
      return;
    }
    resolve(dataUrl);
  };
  reader.readAsDataURL(blob);
});

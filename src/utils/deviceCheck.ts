import type { LevelPresentation } from '../types/deviceCheck';

const MIME_PRIORITY = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
] as const;

const WINDOWS_1252_BYTES: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};
const MOJIBAKE_PATTERN = /(?:Ã[\u0080-\u00ff]|Â[\u0080-\u00ff]|Ä[\u0080-\u00ff]|Å[\u0080-\u00ff]|á[»º])/g;
const VIETNAMESE_DIACRITIC_PATTERN = /[\u0102-\u01b0\u1ea0-\u1eff]/;

const mimeBaseType = (mimeType: string) => mimeType.split(';', 1)[0].trim().toLowerCase();

export const repairMojibake = (value: string): string => {
  let repaired = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const originalMarkers = repaired.match(MOJIBAKE_PATTERN)?.length ?? 0;
    if (originalMarkers === 0) break;

    const characters = Array.from(repaired);
    let decodedAny = false;
    for (let start = 0; start < characters.length;) {
      const firstCodePoint = characters[start].codePointAt(0)!;
      if (firstCodePoint > 0xff && !(firstCodePoint in WINDOWS_1252_BYTES)) {
        start += 1;
        continue;
      }
      let end = start + 1;
      while (end < characters.length) {
        const codePoint = characters[end].codePointAt(0)!;
        if (codePoint > 0xff && !(codePoint in WINDOWS_1252_BYTES)) break;
        end += 1;
      }
      const segment = characters.slice(start, end).join('');
      if (MOJIBAKE_PATTERN.test(segment)) {
        MOJIBAKE_PATTERN.lastIndex = 0;
        try {
          const bytes = Uint8Array.from(Array.from(segment, (character) => {
            const codePoint = character.codePointAt(0)!;
            return WINDOWS_1252_BYTES[codePoint] ?? codePoint;
          }));
          const candidate = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
          const candidateMarkers = candidate.match(MOJIBAKE_PATTERN)?.length ?? 0;
          const segmentMarkers = segment.match(MOJIBAKE_PATTERN)?.length ?? 0;
          if (candidateMarkers < segmentMarkers) {
            characters.splice(start, end - start, ...Array.from(candidate));
            decodedAny = true;
            end = start + Array.from(candidate).length;
          }
        } catch {
          // Keep the original segment when its bytes are not valid UTF-8.
        }
      } else {
        MOJIBAKE_PATTERN.lastIndex = 0;
      }
      start = end;
    }
    const candidate = characters.join('');
    if (!decodedAny || !VIETNAMESE_DIACRITIC_PATTERN.test(candidate)) break;
    repaired = candidate;
  }
  return repaired;
};

export const selectDeviceCheckMimeType = (
  acceptedMimeTypes: string[],
  isTypeSupported: (mimeType: string) => boolean,
): string | null => {
  const accepted = new Set(acceptedMimeTypes.map(mimeBaseType));
  const priorityCandidates = MIME_PRIORITY.filter((mimeType) => accepted.has(mimeBaseType(mimeType)));
  const candidates = [
    ...priorityCandidates,
    ...acceptedMimeTypes.filter((mimeType) => !priorityCandidates.some(
      (candidate) => mimeBaseType(candidate) === mimeBaseType(mimeType),
    )),
  ];
  return candidates.find((mimeType) => isTypeSupported(mimeType)) ?? null;
};

export const getDeviceCheckFileExtension = (mimeType: string): string => {
  switch (mimeBaseType(mimeType)) {
    case 'audio/webm': return '.webm';
    case 'audio/ogg': return '.ogg';
    case 'audio/mp4': return '.mp4';
    case 'audio/m4a': return '.m4a';
    case 'audio/wav':
    case 'audio/x-wav': return '.wav';
    case 'audio/mpeg': return '.mp3';
    case 'audio/aac': return '.aac';
    case 'audio/flac': return '.flac';
    default: return '.audio';
  }
};

export const getLevelPresentation = (level: string): LevelPresentation => {
  switch (level) {
    case 'GOOD': return { label: 'Tốt', color: '#16803c' };
    case 'FAIR': return { label: 'Đạt', color: '#a06a00' };
    case 'POOR': return { label: 'Chưa đạt', color: '#c45b16' };
    case 'EMPTY': return { label: 'Không nhận diện được', color: '#bd2c2c' };
    default: return { label: 'Không xác định', color: '#53627a' };
  }
};

export const getGetUserMediaErrorMessage = (error: unknown): string => {
  if (!(error instanceof DOMException)) {
    return 'Không thể truy cập micro. Hãy kiểm tra thiết bị và thử lại.';
  }
  switch (error.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Quyền micro chưa được cấp. Hãy nhấn biểu tượng ổ khóa cạnh địa chỉ trang, cho phép Micro rồi tải lại trang.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Không tìm thấy micro. Hãy kết nối micro rồi thử lại.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Micro đang được ứng dụng khác sử dụng hoặc không thể khởi động. Hãy đóng ứng dụng đó rồi thử lại.';
    case 'OverconstrainedError':
      return 'Micro đã chọn không còn khả dụng. Hãy chọn thiết bị khác.';
    default:
      return 'Không thể khởi động micro. Hãy kiểm tra quyền truy cập và thiết bị.';
  }
};

export interface DeviceCheckConfig {
  languages: string[];
  defaultLanguage: string;
  acceptedMimeTypes: string[];
  maxAudioBytes: number;
  maxDurationSeconds: number;
  recommendedRecordingSeconds: number;
  sampleSentences: Record<string, string>;
}

export interface DeviceCheckSttResult {
  transcript: string;
  matchScore: number;
  level: 'GOOD' | 'FAIR' | 'POOR' | 'EMPTY';
  durationMs: number;
  language: string;
  suggestion: string;
}

export interface LevelPresentation {
  label: string;
  color: string;
}

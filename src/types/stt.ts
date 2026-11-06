export type SttLanguage = 'vi-VN' | 'en-US';
export type DeviceCheckPurpose = 'DEVICE_CHECK' | 'EXAM';
export type SttPurpose = DeviceCheckPurpose;
export type DeviceCheckConnectionStatus = 'idle' | 'connecting' | 'listening' | 'stopping' | 'ended' | 'error';
export type SttConnectionState = DeviceCheckConnectionStatus;
export type DeviceCheckStepStatus = 'passed' | 'not-passed';

export interface SpeechHealth {
  ready: boolean;
  provider: 'local' | 'mock';
  engine: string;
  model: string;
  device: string;
  reason: string;
  loaded_at?: string | null;
  load_ms?: number | null;
  compute_type?: string;
  languages: SttLanguage[];
}

export type LocalInferenceComponentHealth = SpeechHealth;

export interface SttHealthResponse {
  stt: LocalInferenceComponentHealth;
  tts: LocalInferenceComponentHealth;
  resources?: Record<string, number | null>;
  versions?: Record<string, string>;
  sampleRate: number;
  encoding: 'pcm_s16le';
  maxDurationSeconds: number;
}

export type SttStartMessage = {
  type: 'start'; language: SttLanguage; sampleRate: 16000; encoding: 'pcm_s16le'; consent: true;
} & ({ purpose: 'DEVICE_CHECK' } | { purpose: 'EXAM'; attemptId: string; turnId: string });
export type SttClientMessage = SttStartMessage | { type: 'stop' };
export interface SttPartialEvent { type: 'partial'; text: string }
export interface SttFinalEvent { type: 'final'; text: string; confidence: number }
export interface SttErrorEvent { type: 'error'; code: string; message: string }
export interface SttEndedEvent { type: 'ended' }
export type SttServerMessage =
  | SttPartialEvent | SttFinalEvent | SttErrorEvent | SttEndedEvent;

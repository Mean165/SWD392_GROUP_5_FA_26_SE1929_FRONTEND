import { useEffect, useState } from 'react';
import { useSttSession } from '../../hooks/useSttSession';
import type { SttLanguage } from '../../types/stt';
import { useLanguage } from '../../context/LanguageContext';

interface AnswerRecorderProps {
  examAttemptId: string;
  turnId: string;
  recordingAvailable: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onDiscard: () => void;
}

export default function AnswerRecorder({ examAttemptId, turnId, isSubmitting, submitError, onSubmit, onDiscard }: AnswerRecorderProps) {
  const { t, language } = useLanguage();
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [inputId, setInputId] = useState('');
  const session = useSttSession({
    language: (language === 'vi' ? 'vi-VN' : 'en-US') as SttLanguage,
    deviceId: inputId || undefined,
    purpose: 'EXAM', attemptId: examAttemptId, turnId,
    onEnded: onSubmit,
  });
  const active = session.state === 'connecting' || session.state === 'listening';
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      if (mounted) setInputs(devices.filter((device) => device.kind === 'audioinput'));
    }).catch(() => { if (mounted) setInputs([]); });
    return () => { mounted = false; };
  }, []);
  return <section className="interview-recorder" aria-labelledby="recording-title">
    <h3 id="recording-title">{t('Câu trả lời của bạn')}</h3>
    <p>{t('Âm thanh được truyền trực tiếp để phiên âm và xử lý câu trả lời.')}</p>
    <div className="device-check-meter" role="meter" aria-label={t('Mức tín hiệu micro')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={session.level}><span style={{ width: `${session.level}%` }} /></div>
    <p role="status">{t(({ idle: 'Micro đang tắt.', connecting: 'Đang kết nối…', listening: 'Đang nghe.', stopping: 'Đang dừng…', ended: 'Đã gửi câu trả lời để xử lý.', error: 'Có lỗi với micro hoặc kết nối.' } as Record<string, string>)[session.state])}</p>
    {session.error && <p className="interview-error" role="alert">{t(session.error)}</p>}
    {submitError && <p className="interview-error" role="alert">{t(submitError)}</p>}
    <label className="interview-microphone-field">{t('Micro đầu vào')}<select value={inputId} disabled={session.state === 'stopping'} onChange={(event) => { if (active) session.stop(); setInputId(event.target.value); }}><option value="">{t('Micro mặc định')}</option>{inputs.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `${t('Micro')} ${index + 1}`}</option>)}</select></label>
    {(session.finals.length > 0 || session.partial) && <section className="interview-live-transcript" aria-live="polite"><h4>{t('Bản ghi nhận diện')}</h4>{session.finals.length > 0 && <p>{session.finals.join(' ')}</p>}{session.partial && <p className="partial">{session.partial}</p>}</section>}
    <div className="interview-recorder-actions">
      {!active ? <button type="button" className="student-primary-button" disabled={isSubmitting} onClick={() => { onDiscard(); void session.start(); }}>{t('Bắt đầu trả lời')}</button>
        : <button type="button" className="student-primary-button" disabled={isSubmitting} onClick={session.stop}>{t('Dừng và gửi câu trả lời')}</button>}
    </div>
  </section>;
}

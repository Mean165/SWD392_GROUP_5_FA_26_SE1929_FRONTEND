import { useEffect, useRef, useState } from 'react';
import { blobToAudioDataUrl, selectSupportedAudioMimeType } from '../../utils/interviewAudio';
import { useLanguage } from '../../context/LanguageContext';

interface AnswerRecorderProps {
  recordingAvailable: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onRecordingReady: (dataUrl: string) => void;
  onSubmit: () => void;
  onDiscard: () => void;
}

const getMicrophoneError = (error: unknown): string => {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Bạn chưa cấp quyền micro. Hãy cho phép trình duyệt sử dụng micro rồi thử lại.';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'Không tìm thấy micro trên thiết bị này.';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Micro không khả dụng hoặc đang được ứng dụng khác sử dụng.';
    }
  }
  return 'Không thể bắt đầu ghi âm. Hãy kiểm tra micro và thử lại.';
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

export default function AnswerRecorder({
  recordingAvailable,
  isSubmitting,
  submitError,
  onRecordingReady,
  onSubmit,
  onDiscard,
}: AnswerRecorderProps) {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const cancelOnStopRef = useRef(false);
  const startLockRef = useRef(false);

  const releaseMicrophone = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.stop();
      }
      releaseMicrophone();
    };
  }, []);

  const startRecording = async () => {
    if (startLockRef.current || recorderRef.current?.state === 'recording' || isSubmitting) return;
    startLockRef.current = true;
    setIsStarting(true);
    setRecordingError(null);
    setDuration(0);

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setRecordingError('Ghi âm cần trình duyệt hỗ trợ và kết nối bảo mật (HTTPS hoặc localhost).');
      startLockRef.current = false;
      setIsStarting(false);
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setRecordingError('Trình duyệt này không hỗ trợ ghi âm. Hãy dùng trình duyệt hiện đại khác.');
      startLockRef.current = false;
      setIsStarting(false);
      return;
    }
    if (typeof MediaRecorder.isTypeSupported !== 'function') {
      setRecordingError('Trình duyệt không hỗ trợ kiểm tra định dạng ghi âm tương thích.');
      startLockRef.current = false;
      setIsStarting(false);
      return;
    }

    let mimeType: string | null;
    try {
      mimeType = selectSupportedAudioMimeType((candidate) => MediaRecorder.isTypeSupported(candidate));
    } catch {
      setRecordingError('Không thể kiểm tra định dạng ghi âm trên trình duyệt này.');
      startLockRef.current = false;
      setIsStarting(false);
      return;
    }
    if (!mimeType) {
      setRecordingError('Trình duyệt không hỗ trợ định dạng âm thanh được dịch vụ thi chấp nhận.');
      startLockRef.current = false;
      setIsStarting(false);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      if (mountedRef.current) setRecordingError(getMicrophoneError(error));
      startLockRef.current = false;
      if (mountedRef.current) setIsStarting(false);
      return;
    }
    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      startLockRef.current = false;
      return;
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      cancelOnStopRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        if (mountedRef.current) setRecordingError('Đã xảy ra lỗi trong khi ghi âm. Hãy ghi lại câu trả lời.');
        cancelOnStopRef.current = true;
        chunksRef.current = [];
        if (recorder.state !== 'inactive') {
          try {
            recorder.stop();
          } catch {
            releaseMicrophone();
            if (mountedRef.current) setIsRecording(false);
          }
        } else {
          releaseMicrophone();
          if (mountedRef.current) setIsRecording(false);
        }
      };
      recorder.onstop = async () => {
        const wasCancelled = cancelOnStopRef.current;
        releaseMicrophone();
        if (mountedRef.current) setIsRecording(false);
        if (wasCancelled || !mountedRef.current) return;

        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const dataUrl = await blobToAudioDataUrl(blob);
          if (mountedRef.current) onRecordingReady(dataUrl);
        } catch (error) {
          if (mountedRef.current) {
            setRecordingError(error instanceof Error ? error.message : 'Không thể hoàn tất bản ghi âm.');
          }
        } finally {
          chunksRef.current = [];
        }
      };
      recorder.start();
      setIsRecording(true);
      setIsStarting(false);
      startLockRef.current = false;
      timerRef.current = window.setInterval(() => setDuration((value) => value + 1), 1000);
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      setRecordingError(getMicrophoneError(error));
      setIsStarting(false);
      startLockRef.current = false;
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    try {
      recorder.stop();
    } catch {
      cancelOnStopRef.current = true;
      chunksRef.current = [];
      releaseMicrophone();
      setIsRecording(false);
      setRecordingError('Không thể hoàn tất bản ghi âm. Hãy ghi lại câu trả lời.');
    }
  };

  const cancelRecording = () => {
    cancelOnStopRef.current = true;
    chunksRef.current = [];
    stopRecording();
    releaseMicrophone();
    setIsRecording(false);
    setDuration(0);
  };

  return (
    <section className="interview-recorder" aria-labelledby="recording-title">
      <h3 id="recording-title">Câu trả lời của bạn</h3>
      <p className="interview-help">
        Khi bắt đầu ghi âm, trình duyệt sẽ hỏi quyền sử dụng micro. Âm thanh được gửi đến máy chủ để phiên âm và xử lý câu trả lời.
      </p>
      <div className="interview-recorder-controls">
        {isRecording ? (
          <>
            <span className="interview-recording-status" role="status">
              <span className="interview-recording-indicator" aria-hidden="true" />
              {t('Đang ghi âm')} · {formatDuration(duration)}
            </span>
            <button type="button" className="student-primary-button" onClick={stopRecording}>
              {t('Dừng ghi âm')}
            </button>
            <button type="button" className="interview-secondary-button" onClick={cancelRecording}>
              {t('Hủy bản ghi')}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="student-primary-button"
            onClick={startRecording}
            disabled={isSubmitting || recordingAvailable || isStarting}
          >
            {t(isStarting ? 'Đang chờ quyền micro…' : recordingAvailable ? 'Đã có bản ghi' : 'Bắt đầu ghi âm')}
          </button>
        )}
      </div>

      {recordingAvailable && (
        <div className="interview-recording-ready" role="status">
          {t('Bản ghi đã sẵn sàng để gửi.')}
          <button type="button" className="interview-text-button" onClick={onDiscard} disabled={isSubmitting}>
            {t('Xóa bản ghi')}
          </button>
        </div>
      )}
      {recordingError && <p className="interview-error" role="alert">{t(recordingError)}</p>}
      {submitError && <p className="interview-error" role="alert">{t(submitError)}</p>}

      <button
        type="button"
        className="student-primary-button interview-submit-button"
        onClick={onSubmit}
        disabled={!recordingAvailable || isSubmitting || isRecording}
      >
        {t(isSubmitting ? 'Đang gửi và xử lý câu trả lời…' : 'Gửi câu trả lời')}
      </button>
      <p className="interview-processing-status" role="status" aria-live="polite">
        {isSubmitting ? t('Đang gửi và xử lý câu trả lời. Quá trình phiên âm diễn ra đồng bộ trên máy chủ.') : ''}
      </p>
    </section>
  );
}

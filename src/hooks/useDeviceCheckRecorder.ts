import { useCallback, useEffect, useRef, useState } from 'react';
import { getDeviceCheckFileExtension, selectDeviceCheckMimeType } from '../utils/deviceCheck';

export const useDeviceCheckRecorder = (
  acceptedMimeTypes: string[],
  recommendedSeconds: number,
  maxDurationSeconds: number,
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const failedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
    clearTimer();
  }, [clearTimer]);

  const startRecording = useCallback((stream: MediaStream | null) => {
    if (isRecording || recorderRef.current) return;
    if (!stream || stream.getAudioTracks().every((track) => track.readyState !== 'live')) {
      setError('Hãy bật và kiểm tra micro trước khi ghi âm.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setError('Trình duyệt này không hỗ trợ ghi âm. Hãy dùng Chrome, Edge hoặc Coc Coc bản mới.');
      return;
    }
    if (typeof MediaRecorder.isTypeSupported !== 'function') {
      setError('Trình duyệt không thể xác nhận định dạng ghi âm được máy chủ chấp nhận.');
      return;
    }

    let mimeType: string | null;
    try {
      mimeType = selectDeviceCheckMimeType(
        acceptedMimeTypes,
        (type) => MediaRecorder.isTypeSupported(type),
      );
    } catch {
      setError('Không thể xác nhận định dạng ghi âm được máy chủ chấp nhận.');
      return;
    }
    if (!mimeType) {
      setError('Trình duyệt không hỗ trợ định dạng ghi âm mà máy chủ chấp nhận.');
      return;
    }

    setError(null);
    setRecordedBlob(null);
    setRecordedMimeType('');
    setDurationSeconds(0);
    chunksRef.current = [];
    failedRef.current = false;
    const target = Math.max(1, Math.min(recommendedSeconds || 5, maxDurationSeconds || 15));

    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        failedRef.current = true;
        setError('Đã xảy ra lỗi khi ghi âm. Hãy thử ghi lại.');
        if (recorder.state === 'recording') recorder.stop();
      };
      recorder.onstop = () => {
        const actualMimeType = recorder.mimeType || mimeType;
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        setIsRecording(false);
        setDurationSeconds(Math.min(target, Math.max(0, Math.ceil((Date.now() - startedAtRef.current) / 1000))));
        setRecordedMimeType(actualMimeType);
        setRecordedBlob(blob.size > 0 && !failedRef.current ? blob : null);
        if (blob.size === 0 && !failedRef.current) setError('Bản ghi không có âm thanh. Hãy kiểm tra micro rồi ghi lại.');
        recorderRef.current = null;
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startedAtRef.current) / 1000;
        setDurationSeconds(Math.min(target, Math.floor(elapsed)));
      }, 100);
      stopTimerRef.current = window.setTimeout(stopRecording, target * 1000);
    } catch {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      recorderRef.current = null;
      setError('Không thể bắt đầu ghi âm. Hãy kiểm tra micro và thử lại.');
    }
  }, [acceptedMimeTypes, isRecording, maxDurationSeconds, recommendedSeconds, stopRecording]);

  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordedMimeType('');
    setDurationSeconds(0);
    setError(null);
  }, []);

  useEffect(() => {
    if (!recordedBlob) {
      setAudioUrl(null);
      return;
    }
    const url = URL.createObjectURL(recordedBlob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordedBlob]);

  useEffect(() => () => {
    clearTimer();
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.stop();
    }
  }, [clearTimer]);

  const fileName = recordedMimeType
    ? `device-check${getDeviceCheckFileExtension(recordedMimeType)}`
    : '';

  return {
    isRecording,
    recordedBlob,
    recordedMimeType,
    durationSeconds,
    error,
    audioUrl,
    fileName,
    startRecording,
    stopRecording,
    clearRecording,
  };
};

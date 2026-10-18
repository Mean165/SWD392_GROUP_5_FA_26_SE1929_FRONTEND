import { useCallback, useEffect, useRef, useState } from 'react';
import { getGetUserMediaErrorMessage } from '../utils/deviceCheck';

const INPUT_DEVICE_STORAGE_KEY = 'aiviva-device-check-input';
const SIGNAL_THRESHOLD = 0.025;

export interface AudioInputDevice {
  deviceId: string;
  label: string;
}

export const useDeviceMicrophone = () => {
  const [devices, setDevices] = useState<AudioInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(
    () => localStorage.getItem(INPUT_DEVICE_STORAGE_KEY) ?? '',
  );
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [level, setLevel] = useState(0);
  const [hasSignal, setHasSignal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const startRequestRef = useRef(0);
  const startingRef = useRef(false);

  const stopMicrophone = useCallback(() => {
    startRequestRef.current += 1;
    startingRef.current = false;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (mountedRef.current) setStream(null);
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== 'closed') void context.close();
    if (mountedRef.current) {
      setIsActive(false);
      setIsStarting(false);
      setLevel(0);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const context = contextRef.current;
      if (context && context.state !== 'closed') void context.close();
    };
  }, []);

  const selectDevice = useCallback((deviceId: string) => {
    localStorage.setItem(INPUT_DEVICE_STORAGE_KEY, deviceId);
    setSelectedDeviceId(deviceId);
    setHasSignal(false);
  }, []);

  const startMicrophone = useCallback(async () => {
    if (startingRef.current) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('Kiểm tra micro cần trình duyệt hỗ trợ và kết nối bảo mật (HTTPS hoặc localhost).');
      return;
    }
    if (typeof window.AudioContext === 'undefined') {
      setError('Trình duyệt này không hỗ trợ đo tín hiệu micro. Hãy dùng Chrome, Edge hoặc Coc Coc bản mới.');
      return;
    }

    stopMicrophone();
    const requestId = startRequestRef.current;
    startingRef.current = true;
    setIsStarting(true);
    setError(null);
    setHasSignal(false);
    try {
      const audio: MediaTrackConstraints = selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {};
      const stream = await navigator.mediaDevices.getUserMedia({ audio });
      if (!mountedRef.current || requestId !== startRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      if (!stream.getAudioTracks().some((track) => track.readyState === 'live')) {
        stream.getTracks().forEach((track) => track.stop());
        startingRef.current = false;
        setIsStarting(false);
        setError('Không tìm thấy luồng âm thanh hoạt động từ micro.');
        return;
      }

      streamRef.current = stream;
      setStream(stream);
      stream.getAudioTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (!mountedRef.current || requestId !== startRequestRef.current) return;
          stopMicrophone();
          setError('Micro đã bị ngắt kết nối. Hãy kết nối lại thiết bị rồi thử lại.');
        }, { once: true });
      });
      const context = new AudioContext();
      contextRef.current = context;
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const measure = () => {
        analyser.getByteTimeDomainData(samples);
        let squareSum = 0;
        for (const sample of samples) {
          const normalized = (sample - 128) / 128;
          squareSum += normalized * normalized;
        }
        const rms = Math.sqrt(squareSum / samples.length);
        if (!mountedRef.current || requestId !== startRequestRef.current) return;
        setLevel(Math.min(100, Math.round(rms * 350)));
        if (rms >= SIGNAL_THRESHOLD) setHasSignal(true);
        frameRef.current = requestAnimationFrame(measure);
      };
      await context.resume();
      if (!mountedRef.current || requestId !== startRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        if (context.state !== 'closed') void context.close();
        return;
      }
      setIsActive(true);
      startingRef.current = false;
      setIsStarting(false);
      frameRef.current = requestAnimationFrame(measure);

      try {
        const inputs = (await navigator.mediaDevices.enumerateDevices())
          .filter((device) => device.kind === 'audioinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Micro ${index + 1}`,
          }));
        if (mountedRef.current && requestId === startRequestRef.current) {
          setDevices(inputs);
          if (selectedDeviceId && !inputs.some((device) => device.deviceId === selectedDeviceId)) {
            selectDevice('');
          }
        }
      } catch {
        if (mountedRef.current) setError('Đã kết nối micro nhưng không thể liệt kê thiết bị. Bạn vẫn có thể tiếp tục kiểm tra.');
      }
    } catch (deviceError) {
      if (mountedRef.current && requestId === startRequestRef.current) {
        stopMicrophone();
        setError(getGetUserMediaErrorMessage(deviceError));
      }
    }
  }, [selectDevice, selectedDeviceId, stopMicrophone]);

  return {
    devices,
    selectedDeviceId,
    selectDevice,
    isActive,
    isStarting,
    stream,
    level,
    hasSignal,
    error,
    startMicrophone,
    stopMicrophone,
  };
};

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SttConnectionState, SttLanguage, SttPurpose, SttServerMessage, SttStartMessage } from '../types/stt';
import { canReconnectStt, floatToPcm16, getSttErrorMessage, makeSttSocketUrl, makeSttStartMessage } from '../utils/pcm';

interface Options {
  language: SttLanguage;
  deviceId?: string;
  purpose: SttPurpose;
  attemptId?: string;
  turnId?: string;
  onEnded?: () => void;
}

const workletCode = `class PcmCapture extends AudioWorkletProcessor {
  constructor() { super(); this.phase = 0; this.acc = 0; this.count = 0; this.packet = []; }
  process(inputs) {
    const input = inputs[0] && inputs[0][0]; if (!input) return true;
    const ratio = sampleRate / 16000;
    for (let i = 0; i < input.length; i++) {
      this.acc += input[i]; this.count++; this.phase += 1;
      if (this.phase >= ratio) {
        const value = this.acc / this.count; this.packet.push(value);
        this.phase -= ratio; this.acc = 0; this.count = 0;
        if (this.packet.length >= 1280) { this.port.postMessage(new Float32Array(this.packet)); this.packet = []; }
      }
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);`;

export const useSttSession = ({ language, deviceId, purpose, attemptId, turnId, onEnded }: Options) => {
  const [state, setState] = useState<SttConnectionState>('idle');
  const [level, setLevel] = useState(0);
  const [hasSignal, setHasSignal] = useState(false);
  const [partial, setPartial] = useState('');
  const [finals, setFinals] = useState<string[]>([]);
  const [error, setError] = useState('');
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const urlRef = useRef<string | null>(null);
  const liveRef = useRef(false);
  const generationRef = useRef(0);
  const stoppingRef = useRef(false);
  const reconnectCountRef = useRef(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const callbackRef = useRef(onEnded);
  callbackRef.current = onEnded;

  const cleanupAudio = useCallback(() => {
    liveRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
    nodeRef.current?.disconnect(); nodeRef.current?.port.close(); nodeRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null;
    const context = contextRef.current; contextRef.current = null;
    if (context && context.state !== 'closed') void context.close();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = null;
    setLevel(0);
  }, []);

  const cleanup = useCallback((sendStop: boolean) => {
    generationRef.current += 1;
    cleanupAudio();
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      socket.onopen = null; socket.onmessage = null; socket.onerror = null; socket.onclose = null;
      if (sendStop && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'stop' }));
      if (socket.readyState < WebSocket.CLOSING) socket.close();
    }
  }, [cleanupAudio]);

  const stop = useCallback(() => {
    if (state === 'idle' || state === 'ended') { cleanup(false); setState('idle'); return; }
    stoppingRef.current = true;
    setState('stopping');
    liveRef.current = false;
    cleanupAudio();
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'stop' }));
      stopTimerRef.current = setTimeout(() => { cleanup(false); stoppingRef.current = false; setState('ended'); }, 3_000);
    }
    else { cleanup(false); setState('ended'); }
  }, [cleanup, cleanupAudio, state]);

  const start = useCallback(async (token = localStorage.getItem('accessToken') ?? '') => {
    if (liveRef.current || socketRef.current) return;
    const generation = ++generationRef.current;
    reconnectCountRef.current = 0;
    setError(''); setPartial(''); setFinals([]); setHasSignal(false); setState('connecting');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('Hãy dùng trình duyệt tương thích trên HTTPS hoặc localhost để sử dụng micro.'); setState('error'); return;
    }
    if (typeof AudioWorkletNode === 'undefined' || !window.AudioContext || !('audioWorklet' in window.AudioContext.prototype)) {
      setError('Trình duyệt này không hỗ trợ AudioWorklet. Hãy dùng phiên bản Chrome, Edge hoặc Firefox mới.'); setState('error'); return;
    }
    if (purpose === 'EXAM' && (!attemptId || !turnId)) { setError(getSttErrorMessage('EXAM_CONTEXT_REQUIRED')); setState('error'); return; }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceId ? { exact: deviceId } : undefined, channelCount: 1 } });
    } catch (e) {
      setError(e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
        ? 'Bạn chưa cấp quyền micro. Hãy cho phép trình duyệt sử dụng micro rồi thử lại.'
        : 'Không thể mở micro. Hãy kiểm tra kết nối micro rồi thử lại.'); setState('error'); return;
    }
    if (generation !== generationRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
    liveRef.current = true; streamRef.current = stream;
    const context = new AudioContext(); contextRef.current = context;
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser(); analyser.fftSize = 512; source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    const meter = () => {
      if (!liveRef.current) return;
      analyser.getByteTimeDomainData(samples);
      let sum = 0; samples.forEach((v) => { const n = (v - 128) / 128; sum += n * n; });
      const rms = Math.sqrt(sum / samples.length); setLevel(Math.min(100, Math.round(rms * 350)));
      if (rms > 0.025) setHasSignal(true);
      rafRef.current = requestAnimationFrame(meter);
    };
    const workletUrl = URL.createObjectURL(new Blob([workletCode], { type: 'text/javascript' })); urlRef.current = workletUrl;
    try {
      await context.audioWorklet.addModule(workletUrl);
      await context.resume();
      const node = new AudioWorkletNode(context, 'pcm-capture'); nodeRef.current = node;
      node.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
        const socket = socketRef.current;
        if (liveRef.current && socket?.readyState === WebSocket.OPEN) socket.send(floatToPcm16(data));
      };
      const silentOutput = context.createGain();
      silentOutput.gain.value = 0;
      node.connect(silentOutput);
      silentOutput.connect(context.destination);
      const attachSocket = () => {
        const socket = new WebSocket(makeSttSocketUrl(token)); socketRef.current = socket;
        let opened = false;
        socket.onopen = () => {
          opened = true;
        const startMessage: SttStartMessage = makeSttStartMessage(language, purpose,
          purpose === 'EXAM' ? { attemptId: attemptId!, turnId: turnId! } : undefined);
        socket.send(JSON.stringify(startMessage)); source.connect(node); setState('listening'); rafRef.current = requestAnimationFrame(meter);
        };
        socket.onmessage = (event) => {
        let message: SttServerMessage;
        try { message = JSON.parse(String(event.data)) as SttServerMessage; } catch { setError(getSttErrorMessage('INVALID_MESSAGE')); setState('error'); cleanup(true); return; }
        if (message.type === 'partial') setPartial(message.text);
        if (message.type === 'final') { if (message.text.trim()) setFinals((items) => [...items, message.text]); setPartial(''); }
        if (message.type === 'error') {
          setError(getSttErrorMessage(message.code)); setState('error');
          if (message.code === 'TOKEN_EXPIRED') window.dispatchEvent(new Event('aiviva:auth-expired'));
          cleanup(false);
          if (purpose === 'EXAM' && (message.code.startsWith('EXAM_') || message.code === 'NO_SPEECH')) callbackRef.current?.();
        }
        if (message.type === 'ended') { stoppingRef.current = false; cleanup(false); setState('ended'); callbackRef.current?.(); }
        };
        socket.onerror = () => undefined;
        socket.onclose = (event) => {
        if (socketRef.current !== socket) return;
        if (stoppingRef.current) { stoppingRef.current = false; cleanup(false); setState('ended'); callbackRef.current?.(); }
        else if (!opened && (event.code === 1008 || event.code === 4001 || event.code === 4003)) {
          cleanup(false);
          setError(getSttErrorMessage(event.code === 4001 ? 'TOKEN_EXPIRED' : 'STT_HANDSHAKE_REJECTED'));
          setState('error');
          if (event.code === 4001) window.dispatchEvent(new Event('aiviva:auth-expired'));
        }
        else if (liveRef.current && canReconnectStt(opened, reconnectCountRef.current, navigator.onLine)) {
          reconnectCountRef.current += 1;
          setState('connecting');
          reconnectTimerRef.current = setTimeout(() => { reconnectTimerRef.current = null; if (liveRef.current) attachSocket(); }, 350);
        } else if (liveRef.current) {
          cleanup(false);
          setError(opened ? 'Kết nối nhận diện đã đóng. Hãy chủ động bắt đầu lại.' : navigator.onLine ? 'Không thể kết nối dịch vụ nhận diện. Hãy kiểm tra mạng rồi chủ động thử lại.' : 'Mạng đã ngắt. Hãy kết nối lại rồi bắt đầu phiên mới.');
          setState('error');
        }
        };
      };
      attachSocket();
      stream.getAudioTracks().forEach((track) => track.addEventListener('ended', () => {
        if (!liveRef.current) return; setError('Micro đã bị ngắt kết nối. Hãy kết nối lại thiết bị rồi thử lại.'); cleanup(true); setState('error');
      }, { once: true }));
    } catch {
      setError('Không thể khởi tạo xử lý âm thanh PCM. Hãy thử trình duyệt tương thích mới hơn.'); setState('error'); cleanup(false);
    }
  }, [attemptId, cleanup, cleanupAudio, deviceId, language, purpose]);

  useEffect(() => () => cleanup(true), [cleanup]);
  useEffect(() => {
    return () => {
      if (liveRef.current || socketRef.current) cleanup(true);
    };
  }, [language, deviceId, cleanup]);
  return { state, level, hasSignal, partial, finals, error, start, stop, clearTranscript: () => { setPartial(''); setFinals([]); setHasSignal(false); } };
};

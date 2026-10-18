import { useEffect, useRef, useState } from 'react';
import { getTurnSpeech, getInterviewErrorMessage } from '../../services/interview/interviewService';

interface AudioPlayerProps {
  turnId: string;
}

type PlaybackStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'error';

export default function AudioPlayer({ turnId }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;
    let active = true;
    const audio = audioRef.current;
    setAudioUrl(null);
    setStatus('loading');
    setErrorMessage(null);

    const loadSpeech = async () => {
      try {
        const audioBlob = await getTurnSpeech(turnId, controller.signal);
        if (!active) return;
        objectUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(objectUrl);
        setStatus('ready');
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setStatus('error');
        setErrorMessage(getInterviewErrorMessage(error, 'speech'));
      }
    };

    void loadSpeech();
    return () => {
      active = false;
      controller.abort();
      audio?.pause();
      audio?.removeAttribute('src');
      audio?.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [turnId, retryCount]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (audio.ended) audio.currentTime = 0;
    try {
      await audio.play();
      setErrorMessage(null);
    } catch {
      setErrorMessage('Trình duyệt chưa cho phép phát âm thanh. Hãy nhấn nút phát để thử lại.');
      setStatus('ready');
    }
  };

  const retryLoad = () => {
    setStatus('loading');
    setErrorMessage(null);
    setAudioUrl(null);
    setRetryCount((value) => value + 1);
  };

  return (
    <div className="interview-audio-player" aria-label="Âm thanh câu hỏi">
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="none"
        onPlay={() => setStatus('playing')}
        onPause={() => setStatus('paused')}
        onEnded={() => setStatus('ready')}
        onError={() => {
          setStatus('error');
          setErrorMessage('Không thể phát âm thanh câu hỏi. Hãy tải lại để thử lại.');
        }}
      />
      {status === 'loading' ? (
        <button type="button" className="interview-secondary-button" disabled aria-label="Đang tải âm thanh câu hỏi">
          Đang tải âm thanh…
        </button>
      ) : status === 'error' ? (
        <button type="button" className="interview-secondary-button" onClick={retryLoad}>
          Tải lại âm thanh câu hỏi
        </button>
      ) : (
        <button
          type="button"
          className="interview-secondary-button"
          onClick={togglePlayback}
          aria-label={status === 'playing' ? 'Tạm dừng câu hỏi' : 'Phát câu hỏi'}
        >
          {status === 'playing' ? 'Tạm dừng câu hỏi' : status === 'paused' ? 'Phát lại câu hỏi' : 'Phát câu hỏi'}
        </button>
      )}
      <span className="interview-audio-status" role="status" aria-live="polite">
        {status === 'loading' && 'Đang tải giọng đọc câu hỏi.'}
        {status === 'playing' && 'Đang phát câu hỏi.'}
        {status === 'paused' && 'Đã tạm dừng câu hỏi.'}
        {status === 'ready' && 'Âm thanh câu hỏi đã sẵn sàng.'}
      </span>
      {errorMessage && <p className="interview-error" role="alert">{errorMessage}</p>}
    </div>
  );
}

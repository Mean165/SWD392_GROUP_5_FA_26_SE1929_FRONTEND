import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { useSttSession } from '../../hooks/useSttSession';
import { getDeviceCheckError, getDeviceCheckSttHealth, getDeviceCheckTts } from '../../services/deviceCheck/deviceCheckApi';
import type { SttHealthResponse, SttLanguage } from '../../types/stt';
import { useLanguage } from '../../context/LanguageContext';
import { StudentNotice, StudentPageHeader } from './StudentPages';
import './DeviceCheckPage.css';

type Step = 1 | 2;

const healthReasonText = (reason: string, t: (text: string) => string) => {
  const messages: Record<string, string> = {
    LOCAL_INFERENCE_NOT_CONFIGURED: 'Local speech service is not configured.',
    STT_NOT_READY: 'Local speech recognition is not ready yet.',
    TTS_NOT_READY: 'Local sample speech is not ready yet.',
    model_files_missing: 'Required local model files are missing.',
    provider_unavailable: 'The local speech service is temporarily unavailable.',
  };
  return t(messages[reason] ?? reason);
};

export default function DeviceCheckPage() {
  const { t } = useLanguage();
  const [health, setHealth] = useState<SttHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthRetries, setHealthRetries] = useState(0);
  const [healthError, setHealthError] = useState('');
  const [language, setLanguage] = useState<SttLanguage>('vi-VN');
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [heard, setHeard] = useState<boolean | null>(null);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [outputId, setOutputId] = useState('');
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [inputId, setInputId] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState('');
  const autoPlayRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const session = useSttSession({ language, purpose: 'DEVICE_CHECK', deviceId: inputId || undefined });
  const passed = session.hasSignal && session.finals.some((part) => part.trim().length > 0);
  const allPassed = passed && heard === true;

  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      setHealthLoading(true);
      try {
        const result = await getDeviceCheckSttHealth();
        if (!active) return;
        setHealth(result); setHealthError('');
        if (Array.isArray(result.stt.languages) && result.stt.languages.length && !result.stt.languages.includes(language)) setLanguage(result.stt.languages[0]);
      } catch (error) { if (active) setHealthError(getDeviceCheckError(error).message); }
      finally { if (active) setHealthLoading(false); }
    };
    void checkHealth();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      setInputs(devices.filter((device) => device.kind === 'audioinput'));
    }).catch(() => setInputs([]));
  }, []);

  useEffect(() => {
    if (allPassed) sessionStorage.setItem('deviceCheckPassedAt', new Date().toISOString());
  }, [allPassed]);

  useEffect(() => {
    if (!audioRef.current || !('setSinkId' in HTMLMediaElement.prototype)) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => setOutputs(devices.filter((d) => d.kind === 'audiooutput'))).catch(() => setOutputs([]));
  }, []);

  useEffect(() => {
    if (!audioUrl || !autoPlayRef.current) return;
    autoPlayRef.current = false;
    void audioRef.current?.play().then(() => setPlaying(true)).catch(() => {
      setPlaying(false); setPlaybackError('Trình duyệt không phát được âm thanh đã tải. Hãy kiểm tra thiết bị đầu ra và âm lượng rồi thử lại.');
    });
  }, [audioUrl]);

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const transcript = useMemo(() => session.finals.join(' '), [session.finals]);
  const start = () => {
    if (!health?.stt.ready) { setHealthError('STT chưa sẵn sàng. Hãy thử lại sau.'); return; }
    void session.start();
  };
  const chooseLanguage = (next: SttLanguage) => {
    if (next === language) return;
    const wasRunning = session.state === 'listening' || session.state === 'connecting';
    if (wasRunning || session.state === 'ended' || session.state === 'error') session.stop();
    if (audioRef.current) audioRef.current.pause();
    setPlaying(false); setHeard(null); setAudioUrl('');
    session.clearTranscript(); setLanguage(next);
  };
  const chooseStep = (next: Step) => {
    if (next === step) return;
    if (session.state === 'listening' || session.state === 'connecting') session.stop();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPlaying(false); setAudioUrl(''); setStep(next);
  };
  const playTts = async () => {
    setPlaybackError('');
    if (playing) { audioRef.current?.pause(); setPlaying(false); return; }
    if (!audioUrl) {
      try {
        const blob = await getDeviceCheckTts(language === 'vi-VN' ? 'vi' : 'en');
        autoPlayRef.current = true;
        setAudioUrl(URL.createObjectURL(blob));
      } catch (error) {
        setPlaying(false);
        setPlaybackError(getDeviceCheckError(error, 'tts').message);
      }
      return;
    }
    try { await audioRef.current?.play(); setPlaying(true); }
    catch {
      setPlaying(false);
      setPlaybackError('Trình duyệt không phát được âm thanh đã tải. Hãy kiểm tra thiết bị đầu ra và âm lượng rồi thử lại.');
    }
  };

  return <div className="student-page device-check-page">
    <StudentPageHeader title={t('Kiểm tra thiết bị')} description={t('Kiểm tra micro và loa trước khi thi.')} action={{ label: 'Quay lại lịch thi', to: APP_ROUTES.student.exams }} />
    <p className="device-check-skip">{t('Kiểm tra thiết bị là tùy chọn. Bạn vẫn có thể vào phòng thi nếu bỏ qua.')} <Link to={APP_ROUTES.student.exams}>{t('Bỏ qua và vào lịch thi')}</Link></p>
    <p className="device-check-privacy">{t('Audio from this browser is sent to AiViva servers for local speech recognition. STT and TTS do not send audio to cloud speech services. Device-check audio and transcript are not retained after the session ends.')}</p>
    <div className="device-check-language" role="group" aria-label={t('Ngôn ngữ nhận diện')}>
      <span>{t('Ngôn ngữ')}</span>
      {(['vi-VN', 'en-US'] as SttLanguage[]).map((option) => <button key={option} type="button" aria-pressed={language === option} className={language === option ? 'selected' : ''} disabled={Boolean(health?.stt.languages?.length && !health.stt.languages.includes(option))} onClick={() => chooseLanguage(option)}>{option === 'vi-VN' ? t('Tiếng Việt') : 'English'}</button>)}
    </div>
    <nav className="device-check-steps" aria-label={t('Các bước kiểm tra thiết bị')}>
      <button type="button" className={step === 1 ? 'current' : ''} aria-current={step === 1 ? 'step' : undefined} onClick={() => chooseStep(1)}><span>1</span>{t('Micro')}<span className="device-check-step-status">{passed ? t('Đạt') : t('Chưa đạt')}</span></button>
      <button type="button" className={step === 2 ? 'current' : ''} aria-current={step === 2 ? 'step' : undefined} onClick={() => chooseStep(2)}><span>2</span>{t('Loa')}<span className="device-check-step-status">{heard === true ? t('Đạt') : t('Chưa đạt')}</span></button>
    </nav>
    {allPassed && <StudentNotice title={t('Thiết bị sẵn sàng')}>{t('Micro và loa đã đạt kiểm tra.')}</StudentNotice>}
    {step === 1 ? <section className="device-check-card" aria-labelledby="device-micro-title">
      <h2 id="device-micro-title">{t('Bước 1 · Micro')}</h2>
      <label className="device-check-field">{t('Micro đầu vào')}<select value={inputId} onChange={(event) => { if (session.state !== 'idle') session.stop(); session.clearTranscript(); setInputId(event.target.value); }}><option value="">{t('Micro mặc định')}</option>{inputs.map((device, i) => <option key={device.deviceId} value={device.deviceId}>{device.label || `${t('Micro')} ${i + 1}`}</option>)}</select></label>
      <label className="device-check-consent"><input type="checkbox" checked={consent} onChange={(event) => { const allowed = event.target.checked; setConsent(allowed); if (!allowed && (session.state === 'listening' || session.state === 'connecting')) session.stop(); }} />{t('Tôi đồng ý gửi âm thanh để nhận diện giọng nói trong lần kiểm tra này.')}</label>
      <div className="device-check-meter" role="meter" aria-label={t('Mức tín hiệu micro')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={session.level}><span style={{ width: `${session.level}%` }} /></div>
      <p className="device-check-meter-caption" role="status">{t(({ idle: 'Micro đang tắt.', connecting: 'Đang kết nối…', listening: 'Đang nghe.', stopping: 'Đang dừng…', ended: 'Phiên đã kết thúc.', error: 'Có lỗi với micro hoặc kết nối.' } as Record<string, string>)[session.state])}</p>
      {healthLoading && <p role="status">{t('Đang kiểm tra trạng thái STT…')}</p>}
      {!healthLoading && health && !health.stt.ready && <p className="device-check-error" role="alert">{t('Dịch vụ nhận diện chưa sẵn sàng')}: {healthReasonText(health.stt.reason || 'STT_NOT_READY', t)}</p>}
      {!healthLoading && (healthError || !health?.stt.ready) && healthRetries < 2 && <button type="button" className="device-check-secondary-button" onClick={() => { setHealthRetries((count) => count + 1); setHealthLoading(true); void getDeviceCheckSttHealth().then((result) => { setHealth(result); setHealthError(''); }).catch((error) => setHealthError(getDeviceCheckError(error).message)).finally(() => setHealthLoading(false)); }}>{t('Kiểm tra lại dịch vụ')}</button>}
      {healthError && <p className="device-check-error" role="alert">{t(healthError)}</p>}
      {session.error && <p className="device-check-error" role="alert">{t(session.error)}</p>}
      <div className="device-check-actions">
        {session.state === 'listening' || session.state === 'connecting' ? <button type="button" className="student-secondary-button" onClick={session.stop}>{t('Dừng')}</button> : <button type="button" className="student-primary-button" disabled={healthLoading || !health?.stt.ready || !consent || session.state === 'stopping'} onClick={start}>{t('Bắt đầu')}</button>}
      </div>
      <section className="device-check-transcript" aria-live="polite"><div><h3>{t('Bạn vừa nói:')}</h3><button type="button" className="device-check-text-button" onClick={session.clearTranscript}>{t('Xóa')}</button></div>
        {!transcript && !session.partial && <p>{t('Chưa có nội dung nhận diện.')}</p>}
        {transcript && <p><strong>{transcript}</strong></p>}{session.partial && <p className="partial">{session.partial}</p>}
      </section>
      {session.hasSignal && !passed && <p className="device-check-hint">{t('Tín hiệu micro có nhưng chưa nhận được lời nói. Hãy nói rõ và to hơn, chọn đúng micro/ngôn ngữ, kiểm tra mạng và trạng thái dịch vụ.')}</p>}
      <p className="device-check-hint">{t('Âm thanh chỉ được truyền khi bạn chủ động bắt đầu. Nút Xóa chỉ xóa transcript đang hiển thị.')}</p>
    </section> : <section className="device-check-card" aria-labelledby="device-speaker-title">
      <h2 id="device-speaker-title">{t('Bước 2 · Loa')}</h2>
      {healthLoading && <p role="status">{t('Đang kiểm tra trạng thái TTS…')}</p>}
      {!healthLoading && health && !health.tts.ready && <p className="device-check-error" role="alert">{t('Dịch vụ đọc mẫu chưa sẵn sàng')}: {healthReasonText(health.tts.reason || 'TTS_NOT_READY', t)}</p>}
      {outputs.length > 0 && <label className="device-check-field">{t('Loa đầu ra')}<select value={outputId} onChange={(event) => { setOutputId(event.target.value); const element = audioRef.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null; void element?.setSinkId?.(event.target.value); }}><option value="">{t('Loa mặc định')}</option>{outputs.map((device, i) => <option key={device.deviceId} value={device.deviceId}>{device.label || `${t('Loa')} ${i + 1}`}</option>)}</select></label>}
      <button type="button" className="student-primary-button" disabled={healthLoading || !health?.tts.ready} onClick={() => void playTts()}>{t(playing ? 'Dừng phát' : audioUrl ? 'Phát lại' : 'Phát âm thanh')}</button>
      <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setPlaying(false)} />
      {playbackError && <p className="device-check-error" role="alert">{t(playbackError)}</p>}
      {heard === false && <p className="device-check-hint">{t('Kiểm tra âm lượng hệ thống, thiết bị đầu ra đang chọn và kết nối loa/tai nghe, rồi phát lại.')}</p>}
      <fieldset className="device-check-heard"><legend>{t('Bạn có nghe rõ không?')}</legend><button type="button" aria-pressed={heard === true} onClick={() => setHeard(true)}>{t('Tôi nghe rõ')}</button><button type="button" aria-pressed={heard === false} onClick={() => setHeard(false)}>{t('Tôi không nghe thấy')}</button></fieldset>
    </section>}
  </div>;
}

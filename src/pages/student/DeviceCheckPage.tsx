import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { useDeviceCheckRecorder } from '../../hooks/useDeviceCheckRecorder';
import { useDeviceMicrophone } from '../../hooks/useDeviceMicrophone';
import {
  getDeviceCheckConfig,
  getDeviceCheckError,
  postDeviceCheckStt,
} from '../../services/deviceCheck/deviceCheckApi';
import type { DeviceCheckConfig, DeviceCheckSttResult } from '../../types/deviceCheck';
import { getLevelPresentation, repairMojibake } from '../../utils/deviceCheck';
import { speak, stopSpeaking } from '../../utils/speak';
import { useLanguage } from '../../context/LanguageContext';
import { StudentNotice, StudentPageHeader } from './StudentPages';
import './DeviceCheckPage.css';

type Step = 1 | 2 | 3;
type TtsStatus = 'idle' | 'playing' | 'ready' | 'error';

const formatDuration = (seconds: number) => `00:${String(seconds).padStart(2, '0')}`;

export default function DeviceCheckPage() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<DeviceCheckConfig | null>(null);
  const [configError, setConfigError] = useState('');
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [language, setLanguage] = useState('vi');
  const [step, setStep] = useState<Step>(1);
  const [ttsStatus, setTtsStatus] = useState<TtsStatus>('idle');
  const [ttsError, setTtsError] = useState('');
  const [ttsPlayed, setTtsPlayed] = useState(false);
  const [speakerHeard, setSpeakerHeard] = useState<boolean | null>(null);
  const [submitPending, setSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [sttResult, setSttResult] = useState<DeviceCheckSttResult | null>(null);
  const playIdRef = useRef(0);
  const microphone = useDeviceMicrophone();
  const recorder = useDeviceCheckRecorder(
    config?.acceptedMimeTypes ?? [],
    config?.recommendedRecordingSeconds ?? 5,
    config?.maxDurationSeconds ?? 15,
  );

  useEffect(() => {
    let active = true;
    const loadConfig = async () => {
      setIsConfigLoading(true);
      setConfigError('');
      try {
        const result = await getDeviceCheckConfig();
        if (!active) return;
        setConfig(result);
        const defaultLanguage = result.languages.includes(result.defaultLanguage)
          ? result.defaultLanguage
          : result.languages[0] ?? 'vi';
        setLanguage(defaultLanguage);
      } catch (error) {
        if (active) setConfigError(getDeviceCheckError(error).message);
      } finally {
        if (active) setIsConfigLoading(false);
      }
    };
    void loadConfig();
    return () => {
      active = false;
      playIdRef.current++;
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (retryCountdown <= 0) return undefined;
    const timer = window.setInterval(() => setRetryCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown > 0]);

  const stepsPassed = {
    1: microphone.hasSignal,
    2: speakerHeard === true,
    3: sttResult?.level === 'GOOD' || sttResult?.level === 'FAIR',
  };
  const allPassed = stepsPassed[1] && stepsPassed[2] && stepsPassed[3];

  useEffect(() => {
    if (allPassed) sessionStorage.setItem('deviceCheckPassedAt', new Date().toISOString());
  }, [allPassed]);

  const sampleSentence = useMemo(
    () => repairMojibake(config?.sampleSentences[language] ?? ''),
    [config, language],
  );

  const stopTts = () => {
    playIdRef.current++;
    stopSpeaking();
    setTtsPlayed(false);
    setTtsStatus('idle');
  };

  const goToStep = (nextStep: Step) => {
    if (nextStep === step) return;
    if (recorder.isRecording) recorder.stopRecording();
    microphone.stopMicrophone();
    if (ttsStatus === 'playing') stopTts();
    setStep(nextStep);
  };

  const playTts = async () => {
    // Đang đọc thì bấm lại = dừng
    if (ttsStatus === 'playing') {
      playIdRef.current++;
      stopSpeaking();
      setTtsPlayed(true);
      setTtsStatus('ready');
      return;
    }

    const id = ++playIdRef.current;
    setTtsError('');
    setTtsStatus('playing');

    const text =
      language === 'vi'
        ? 'Xin chào, đây là kiểm tra âm thanh. Nếu bạn nghe rõ giọng nói này, loa của bạn hoạt động tốt.'
        : 'Hello, this is an audio check. If you can hear this voice clearly, your speakers are working.';

    try {
      await speak(text, language === 'vi' ? 'vi-VN' : 'en-US');
      if (id !== playIdRef.current) return;
      setTtsPlayed(true);
      setTtsStatus('ready');
    } catch (e) {
      if (id !== playIdRef.current) return;
      setTtsStatus('error');
      setTtsError(
        e instanceof Error && e.message === 'NO_VOICE'
          ? 'Máy chưa có giọng đọc cho ngôn ngữ này. Hãy cài giọng trong Settings > Time & language > Speech.'
          : 'Không phát được âm thanh. Hãy kiểm tra loa và âm lượng.',
      );
    }
  };

  const changeLanguage = (value: string) => {
    if (recorder.isRecording || submitPending) return;
    stopTts();
    setSpeakerHeard(null);
    setSttResult(null);
    setSubmitError('');
    recorder.clearRecording();
    setLanguage(value);
  };

  const submitRecording = async () => {
    if (submitPending || retryCountdown > 0 || !recorder.recordedBlob || !config) return;
    if (recorder.recordedBlob.size === 0) {
      setSubmitError('Bản ghi trống. Hãy ghi lại trước khi gửi.');
      return;
    }
    if (recorder.recordedBlob.size > config.maxAudioBytes) {
      setSubmitError(`Bản ghi vượt quá giới hạn ${(config.maxAudioBytes / 1024 / 1024).toFixed(1)} MiB. Hãy ghi âm ngắn hơn.`);
      return;
    }

    const mimeType = recorder.recordedMimeType || 'application/octet-stream';
    const file = new File([recorder.recordedBlob], recorder.fileName || 'device-check.audio', { type: mimeType });
    setSubmitPending(true);
    setSubmitError('');
    try {
      const result = await postDeviceCheckStt(file, language);
      setSttResult(result);
      setSubmitError('');
    } catch (error) {
      const apiError = getDeviceCheckError(error);
      setSubmitError(apiError.message);
      if (apiError.status === 429 && apiError.retryAfterSeconds) {
        setRetryCountdown(apiError.retryAfterSeconds);
      }
    } finally {
      setSubmitPending(false);
    }
  };

  const stepStatus = (passed: boolean, active: boolean) => (
    <span className={`device-check-step-status ${passed ? 'passed' : active ? 'active' : ''}`}>
      {passed ? 'Đạt' : active ? 'Đang thực hiện' : 'Chưa làm'}
    </span>
  );

  return (
    <div className="student-page device-check-page">
      <StudentPageHeader
        title="Kiểm tra thiết bị"
        description="Kiểm tra micro, loa và khả năng nhận diện giọng nói trước khi thi."
        action={{ label: 'Quay lại lịch thi', to: APP_ROUTES.student.exams }}
      />

      {isConfigLoading && <section className="student-state-card info" role="status">{t('Đang tải cấu hình kiểm tra thiết bị…')}</section>}
      {configError && (
        <StudentNotice title="Không thể tải cấu hình kiểm tra" kind="warning">
          {t(configError)}{' '}
          <button type="button" className="device-check-text-button" onClick={() => window.location.reload()}>{t('Tải lại trang')}</button>
        </StudentNotice>
      )}

      {!isConfigLoading && config && (
        <>
          <div className="device-check-language" role="group" aria-label={t('Chọn ngôn ngữ kiểm tra')}>
            <span>{t('Ngôn ngữ đọc thử')}</span>
            {config.languages.map((availableLanguage) => (
              <button
                type="button"
                key={availableLanguage}
                className={language === availableLanguage ? 'selected' : ''}
                aria-pressed={language === availableLanguage}
                disabled={recorder.isRecording || submitPending}
                onClick={() => changeLanguage(availableLanguage)}
              >
                {availableLanguage === 'vi' ? t('Tiếng Việt') : availableLanguage === 'en' ? 'English' : availableLanguage}
              </button>
            ))}
          </div>

          {allPassed && (
            <StudentNotice title="Thiết bị sẵn sàng">
              {t('Micro, loa và nhận diện giọng nói đều đã đạt. Kết quả này chỉ hỗ trợ chuẩn bị thiết bị, không thay thế xác nhận từ máy chủ.')}
            </StudentNotice>
          )}

          <section className="device-check-steps" aria-label={t('Các bước kiểm tra thiết bị')}>
            <button type="button" className={step === 1 ? 'current' : ''} aria-current={step === 1 ? 'step' : undefined} onClick={() => goToStep(1)}>
              <span>1</span> {t('Micro')} {stepStatus(stepsPassed[1], step === 1)}
            </button>
            <button type="button" className={step === 2 ? 'current' : ''} aria-current={step === 2 ? 'step' : undefined} onClick={() => goToStep(2)}>
              <span>2</span> {t('Loa')} {stepStatus(stepsPassed[2], step === 2)}
            </button>
            <button type="button" className={step === 3 ? 'current' : ''} aria-current={step === 3 ? 'step' : undefined} onClick={() => goToStep(3)}>
              <span>3</span> {t('Nói thử')} {stepStatus(stepsPassed[3], step === 3)}
            </button>
          </section>

          {step === 1 && (
            <section className="device-check-card" aria-labelledby="device-micro-title">
              <h2 id="device-micro-title">{t('Bước 1 · Kiểm tra micro')}</h2>
              <p>{t('Nhấn bắt đầu để cấp quyền micro và đọc thử vài từ. Âm thanh chỉ được gửi đến máy chủ khi bạn chủ động ghi và gửi ở bước 3.')}</p>
              {microphone.devices.length > 0 && (
                <label className="device-check-field">
                  {t('Micro đầu vào')}
                  <select
                    value={microphone.selectedDeviceId}
                    onChange={(event) => {
                      microphone.stopMicrophone();
                      microphone.selectDevice(event.target.value);
                    }}
                  >
                    {microphone.devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
                  </select>
                </label>
              )}
              <div
                className="device-check-meter"
                role="meter"
                aria-label={t('Mức tín hiệu micro')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={microphone.level}
              >
                <span style={{ width: `${microphone.level}%` }} />
              </div>
              <p className="device-check-meter-caption" aria-live="polite">
                {microphone.isActive ? (microphone.hasSignal ? t('Đã nhận được tín hiệu âm thanh.') : t('Đang chờ tín hiệu — hãy nói thử vào micro.')) : t('Micro đang tắt.')}
              </p>
              {microphone.error && <p className="device-check-error" role="alert">{t(microphone.error)}</p>}
              <button
                type="button"
                className="student-primary-button"
                onClick={() => (microphone.isActive ? microphone.stopMicrophone() : void microphone.startMicrophone())}
                disabled={microphone.isStarting}
              >
                {microphone.isStarting ? t('Đang bật micro…') : microphone.isActive ? t('Dừng kiểm tra micro') : t('Bắt đầu kiểm tra micro')}
              </button>
            </section>
          )}

          {step === 2 && (
            <section className="device-check-card" aria-labelledby="device-speaker-title">
              <h2 id="device-speaker-title">{t('Bước 2 · Kiểm tra loa')}</h2>
              <p>{t('Phát câu đọc thử bằng giọng đọc có sẵn trên máy. Tăng âm lượng hoặc kiểm tra thiết bị đầu ra nếu cần.')}</p>
              <button type="button" className="student-primary-button" onClick={() => void playTts()}>
                {ttsStatus === 'playing'
                  ? t('Dừng âm thanh')
                  : ttsPlayed
                    ? t('Phát lại âm thanh')
                    : t('Phát âm thanh thử')}
              </button>
              {ttsStatus === 'playing' && <p className="device-check-meter-caption" role="status">{t('Đang phát âm thanh.')}</p>}
              {ttsError && <p className="device-check-error" role="alert">{t(ttsError)}</p>}
              {ttsPlayed && (
                <fieldset className="device-check-heard">
                  <legend>{t('Bạn có nghe rõ không?')}</legend>
                  <button type="button" aria-pressed={speakerHeard === true} onClick={() => setSpeakerHeard(true)}>{t('Có, nghe rõ')}</button>
                  <button type="button" aria-pressed={speakerHeard === false} onClick={() => setSpeakerHeard(false)}>{t('Không')}</button>
                </fieldset>
              )}
              {speakerHeard === false && (
                <p className="device-check-hint" role="status">{t('Hãy kiểm tra âm lượng hệ thống và thiết bị đầu ra đang chọn, sau đó phát thử lại.')}</p>
              )}
            </section>
          )}

          {step === 3 && (
            <section className="device-check-card" aria-labelledby="device-stt-title">
              <h2 id="device-stt-title">{t('Bước 3 · Nói thử')}</h2>
              <p>{t('Đọc câu mẫu, bật micro và bắt đầu ghi âm. Khi ghi xong, nghe lại bản ghi rồi nhấn nút gửi để máy chủ kiểm tra.')}</p>
              {sampleSentence && <blockquote className="device-check-sample">{sampleSentence}</blockquote>}
              {!sampleSentence && <p className="device-check-error" role="alert">{t('Máy chủ chưa cung cấp câu mẫu cho ngôn ngữ đang chọn.')}</p>}
              <div
                className="device-check-meter"
                role="meter"
                aria-label={t('Mức tín hiệu micro khi nói thử')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={microphone.level}
              >
                <span style={{ width: `${microphone.level}%` }} />
              </div>
              {microphone.error && <p className="device-check-error" role="alert">{t(microphone.error)}</p>}
              <div className={`device-check-record-indicator ${recorder.isRecording ? 'recording' : ''}`} aria-live="polite">
                <span aria-hidden="true" /> {recorder.isRecording ? t('Đang ghi âm') : t('Sẵn sàng')} · {formatDuration(recorder.durationSeconds)}
              </div>
              {recorder.error && <p className="device-check-error" role="alert">{t(recorder.error)}</p>}
              {!microphone.isActive && (
                <button
                  type="button"
                  className="student-primary-button"
                  onClick={() => void microphone.startMicrophone()}
                  disabled={!sampleSentence || microphone.isStarting || submitPending}
                  aria-label={t('Bật micro để ghi âm câu nói thử')}
                >
                  {microphone.isStarting ? t('Đang bật micro…') : t('Bật micro để ghi âm')}
                </button>
              )}
              {microphone.isActive && (!recorder.isRecording ? (
                <button
                  type="button"
                  className="student-primary-button"
                  onClick={() => {
                    setSttResult(null);
                    setSubmitError('');
                    recorder.startRecording(microphone.stream);
                  }}
                  disabled={!sampleSentence || submitPending}
                  aria-label={t('Bắt đầu ghi âm câu nói thử')}
                >
                  {t('Bắt đầu ghi âm')}
                </button>
              ) : (
                <button type="button" className="student-primary-button" onClick={recorder.stopRecording}>{t('Dừng ghi âm')}</button>
              ))}
              {microphone.isActive && !recorder.isRecording && (
                <button type="button" className="device-check-secondary-button" onClick={microphone.stopMicrophone}>{t('Tắt micro')}</button>
              )}
              {recorder.audioUrl && (
                <div className="device-check-recorded">
                  <p>{t('Bản ghi hoàn chỉnh')} · {formatDuration(recorder.durationSeconds)}</p>
                  <audio controls src={recorder.audioUrl} aria-label={t('Nghe lại bản ghi của bạn')} />
                </div>
              )}
              {recorder.recordedBlob && (
                <button
                  type="button"
                  className="student-primary-button"
                  onClick={() => void submitRecording()}
                  disabled={submitPending || retryCountdown > 0}
                >
                  {submitPending ? t('Đang gửi và xử lý câu trả lời…') : retryCountdown > 0 ? t('Thử lại sau {seconds} giây').replace('{seconds}', String(retryCountdown)) : sttResult ? t('Gửi lại bản ghi') : t('Gửi để kiểm tra giọng nói')}
                </button>
              )}
              <p className="device-check-meter-caption" role="status" aria-live="polite">
                {submitPending ? t('Đang gửi và xử lý câu trả lời…') : ''}
              </p>
              {submitError && <p className="device-check-error" role="alert">{t(submitError)}</p>}
              {sttResult && (
                <section className="device-check-result" aria-live="polite">
                  <h3>{t('Kết quả từ máy chủ')}</h3>
                  <p><strong>{t('Bản phiên âm:')}</strong> {sttResult.transcript || t('Không có nội dung phiên âm.')}</p>
                  <p><strong>{t('Độ khớp câu mẫu:')}</strong> {Math.round(sttResult.matchScore * 100)}%</p>
                  <p><strong>{t('Mức nhận diện:')}</strong> <span className="device-check-level" style={{ color: getLevelPresentation(sttResult.level).color }}>{t(getLevelPresentation(sttResult.level).label)}</span></p>
                  <p><strong>{t('Gợi ý:')}</strong> {t(sttResult.suggestion)}</p>
                  <button type="button" className="device-check-secondary-button" onClick={() => { recorder.clearRecording(); setSttResult(null); setSubmitError(''); }}>
                    {t('Thử lại')}
                  </button>
                </section>
              )}
            </section>
          )}

          <StudentNotice title="Có thể bỏ qua kiểm tra thiết bị" kind="warning">
            {t('Đây chỉ là bước hỗ trợ trải nghiệm, không phải điều kiện bảo mật. Bạn vẫn có thể quay lại lịch thi mà không hoàn tất kiểm tra; quyền vào phòng thi do máy chủ quyết định.')}
            {' '}<Link to={APP_ROUTES.student.exams}>{t('Quay lại lịch thi')}</Link>
          </StudentNotice>
        </>
      )}
    </div>
  );
}
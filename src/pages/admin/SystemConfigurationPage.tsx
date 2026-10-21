import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getLanguageDefaults, updateLanguageDefaults } from '../../services/system/systemService';
import type { LanguageCode, LanguageDefaults } from '../../types/system';
import { getAdminErrorMessage, isAdminUnauthorized } from '../../utils/adminError';
import useAdminSession from './useAdminSession';
import './SystemAdministration.css';

export default function SystemConfigurationPage() {
  const { t } = useLanguage();
  const handleUnauthorized = useAdminSession();
  const [saved, setSaved] = useState<LanguageDefaults | null>(null);
  const [draft, setDraft] = useState<LanguageDefaults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const unauthorizedStarted = useRef(false);

  const requestLogout = useCallback(async () => {
    if (unauthorizedStarted.current) return;
    unauthorizedStarted.current = true;
    await handleUnauthorized();
  }, [handleUnauthorized]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage('');
    getLanguageDefaults()
      .then((defaults) => {
        if (!active) return;
        setSaved(defaults);
        setDraft(defaults);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(getAdminErrorMessage(error, t));
        if (isAdminUnauthorized(error)) void requestLogout();
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [reloadKey, requestLogout, t]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeout = window.setTimeout(() => setSuccessMessage(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const hasChanges = Boolean(saved && draft && (saved.sttLanguage !== draft.sttLanguage || saved.ttsLanguage !== draft.ttsLanguage));

  const save = async () => {
    if (!draft || !hasChanges || isSaving) return;
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updated = await updateLanguageDefaults(draft);
      setSaved(updated);
      setDraft(updated);
      setSuccessMessage(t('Cấu hình đã được lưu.'));
    } catch (error) {
      setErrorMessage(getAdminErrorMessage(error, t));
      if (isAdminUnauthorized(error)) void requestLogout();
    } finally {
      setIsSaving(false);
    }
  };

  const setLanguage = (key: keyof LanguageDefaults, value: LanguageCode) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };

  return (
    <main className="admin-feature-page">
      <header className="admin-feature-header">
        <div><span className="admin-feature-eyebrow">{t('QUẢN TRỊ NỀN TẢNG')}</span><h1>{t('Cấu hình ngôn ngữ mặc định STT/TTS')}</h1><p>{t('Cấu hình ngôn ngữ nhận diện giọng nói và tổng hợp giọng nói.')}</p></div>
      </header>

      {successMessage && <div className="admin-feedback success" role="status">{successMessage}</div>}
      {isLoading ? (
        <section className="admin-state-panel" role="status"><span className="admin-spinner" /><strong>{t('Đang tải cấu hình…')}</strong></section>
      ) : errorMessage ? (
        <section className="admin-state-panel error" role="alert"><strong>{t('Không thể tải cấu hình ngôn ngữ.')}</strong><p>{errorMessage}</p><button type="button" className="admin-primary-button" onClick={() => setReloadKey((value) => value + 1)}>{t('Thử lại')}</button></section>
      ) : draft ? (
        <section className="admin-language-panel">
          <div className="admin-language-panel-heading"><div><h2>{t('Ngôn ngữ mặc định')}</h2><p>{t('Chọn mặc định riêng cho nhận diện và tổng hợp giọng nói.')}</p></div></div>
          {errorMessage && <div className="admin-feedback error" role="alert">{errorMessage}</div>}
          <div className="admin-language-fields">
            <div className="admin-language-field">
              <label htmlFor="admin-stt-language">{t('Ngôn ngữ STT')}</label>
              <select id="admin-stt-language" value={draft.sttLanguage} onChange={(event) => setLanguage('sttLanguage', event.target.value as LanguageCode)} disabled={isSaving}>
                <option value="VI">{t('Tiếng Việt (VI)')}</option>
                <option value="EN">{t('Tiếng Anh (EN)')}</option>
              </select>
            </div>
            <div className="admin-language-field">
              <label htmlFor="admin-tts-language">{t('Ngôn ngữ TTS')}</label>
              <select id="admin-tts-language" value={draft.ttsLanguage} onChange={(event) => setLanguage('ttsLanguage', event.target.value as LanguageCode)} disabled={isSaving}>
                <option value="VI">{t('Tiếng Việt (VI)')}</option>
                <option value="EN">{t('Tiếng Anh (EN)')}</option>
              </select>
            </div>
          </div>
          <footer className="admin-language-actions">
            <span>{!hasChanges ? t('Chưa có thay đổi.') : ''}</span>
            <button type="button" className="admin-primary-button" onClick={() => void save()} disabled={!hasChanges || isSaving}>
              {isSaving ? t('Đang lưu…') : t('Lưu thay đổi')}
            </button>
          </footer>
        </section>
      ) : null}
    </main>
  );
}

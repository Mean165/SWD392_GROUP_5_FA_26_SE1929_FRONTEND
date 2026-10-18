import { useEffect, useId, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageSelector.css';

export default function LanguageSelector({ compact = false, showLabel = false }: { compact?: boolean; showLabel?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;
    rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitemradio"]')?.focus();
    const dismissOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', dismissOnOutsideClick);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('mousedown', dismissOnOutsideClick);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [isOpen]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (currentIndex + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
    event.preventDefault();
    items[nextIndex]?.focus();
  };

  return (
    <div ref={rootRef} className={`aiviva-language-selector${compact ? ' compact' : ''}${isOpen ? ' open' : ''}`}>
      {showLabel && <span className="aiviva-language-label">{t('Ngôn ngữ giao diện')}</span>}
      <button
        ref={triggerRef}
        className="aiviva-language-trigger"
        type="button"
        aria-label={t('Ngôn ngữ giao diện')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="aiviva-language-icon" aria-hidden="true">
          {compact ? language.toUpperCase() : (
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" />
              <path d="M3.5 12h17M12 3c2.3 2.4 3.5 5.4 3.5 9S14.3 18.6 12 21c-2.3-2.4-3.5-5.4-3.5-9S9.7 5.4 12 3Z" />
            </svg>
          )}
        </span>
        {!compact && <span>{language === 'vi' ? t('Tiếng Việt') : 'English'}</span>}
        <svg className="aiviva-language-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {isOpen && (
        <div className="aiviva-language-menu" id={menuId} role="menu" aria-label={t('Ngôn ngữ giao diện')} onKeyDown={handleMenuKeyDown}>
          {([
            { value: 'vi', label: t('Tiếng Việt') },
            { value: 'en', label: 'English' },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={language === option.value}
              className={language === option.value ? 'selected' : ''}
              onClick={() => {
                setLanguage(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {language === option.value && <span className="aiviva-language-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LanguageSetting() {
  const { t } = useLanguage();
  return (
    <div className="aiviva-language-settings">
      <span className="student-setting-icon aiviva-language-setting-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.5 12h17M12 3c2.3 2.4 3.5 5.4 3.5 9S14.3 18.6 12 21c-2.3-2.4-3.5-5.4-3.5-9S9.7 5.4 12 3Z" />
        </svg>
      </span>
      <span className="aiviva-language-settings-copy">
        <strong>{t('Ngôn ngữ')}</strong>
        <small>{t('Chọn ngôn ngữ hiển thị cho toàn bộ giao diện.')}</small>
      </span>
      <LanguageSelector />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface QuestionReadButtonProps {
  text: string;
  label?: string;
}

export default function QuestionReadButton({ text, label }: QuestionReadButtonProps) {
  const { t, language } = useLanguage();
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const toggle = () => {
    if (!supported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return <button type="button" className="interview-read-button" disabled={!supported || !text.trim()} onClick={toggle}>
    {t(speaking ? 'Dừng đọc câu hỏi' : label ?? 'Đọc câu hỏi')}
  </button>;
}

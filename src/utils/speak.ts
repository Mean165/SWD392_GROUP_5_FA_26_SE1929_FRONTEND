let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesReady) return voicesReady;
  voicesReady = new Promise((resolve) => {
    const have = speechSynthesis.getVoices();
    if (have.length) return resolve(have);
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
    setTimeout(() => resolve(speechSynthesis.getVoices()), 1500); // dự phòng
  });
  return voicesReady;
}

export function isTtsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export async function speak(text: string, lang = "vi-VN"): Promise<void> {
  if (!isTtsSupported()) throw new Error("NO_TTS");
  const voices = await loadVoices();
  const voice =
    voices.find(v => v.lang === lang && /natural|online/i.test(v.name)) ??
    voices.find(v => v.lang === lang) ??
    voices.find(v => v.lang.startsWith(lang.slice(0, 2)));
  if (!voice) throw new Error("NO_VOICE");

  speechSynthesis.cancel();
  return new Promise((resolve, reject) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.voice = voice;
    u.rate = 0.95;
    u.onend = () => resolve();
    u.onerror = (e) => reject(e);
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (isTtsSupported()) speechSynthesis.cancel();
}
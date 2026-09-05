import confetti from 'canvas-confetti';

let lastCelebrationTime = 0;
const CELEBRATION_COOLDOWN_MS = 4000;

export function fireCelebrationConfetti() {
  const now = Date.now();
  // Prevent spam / multiple rapid calls causing lag or freezing
  if (now - lastCelebrationTime < CELEBRATION_COOLDOWN_MS) {
    return;
  }
  lastCelebrationTime = now;

  // Check if reduced motion is requested
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  try {
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.65 },
      ticks: 120,
      gravity: 1.2,
      scalar: 0.9,
      colors: ['#38bdf8', '#818cf8', '#f472b6', '#34d399', '#fbbf24'],
      disableForReducedMotion: true,
    });
  } catch {
    // Fail silently without blocking the UI
  }
}

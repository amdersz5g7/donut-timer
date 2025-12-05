// Singleton AudioContext
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    return audioCtx;
}

export function resumeAudio() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume();
    }
}

export function playBeep() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square"; // "Square" wave is louder and more "alarm-like"
    osc.frequency.setValueAtTime(880, t); // A5 pitch

    // Volume Envelope for simple "Beep-Beep-Beep" pattern
    // Beep 1
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.setValueAtTime(0.1, t + 0.1);
    gain.gain.setValueAtTime(0, t + 0.11);

    // Beep 2
    gain.gain.setValueAtTime(0, t + 0.2);
    gain.gain.setValueAtTime(0.1, t + 0.2);
    gain.gain.setValueAtTime(0.1, t + 0.3);
    gain.gain.setValueAtTime(0, t + 0.31);

    // Beep 3 (Slightly longer tail)
    gain.gain.setValueAtTime(0, t + 0.4);
    gain.gain.setValueAtTime(0.1, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 1);
}

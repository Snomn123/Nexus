// Sound utility functions for Nexus

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize audio context on user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  private createBeep(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.audioContext || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Different notification sounds
  newMessage() {
    // Pleasant message notification
    this.createBeep(800, 0.1, 0.05);
    setTimeout(() => this.createBeep(1000, 0.1, 0.05), 100);
  }

  userJoined() {
    // Rising tone for user joined
    this.createBeep(400, 0.15, 0.04);
    setTimeout(() => this.createBeep(600, 0.15, 0.04), 150);
  }

  userLeft() {
    // Falling tone for user left
    this.createBeep(600, 0.15, 0.04);
    setTimeout(() => this.createBeep(400, 0.15, 0.04), 150);
  }

  mention() {
    // More prominent sound for mentions
    this.createBeep(1200, 0.2, 0.08);
  }

  error() {
    // Lower frequency for errors
    this.createBeep(300, 0.3, 0.06);
  }

  success() {
    // Success chord
    this.createBeep(523, 0.15, 0.04); // C
    setTimeout(() => this.createBeep(659, 0.15, 0.04), 50); // E
    setTimeout(() => this.createBeep(784, 0.15, 0.04), 100); // G
  }

  typing() {
    // Subtle typing sound
    this.createBeep(1500, 0.05, 0.02);
  }

  // Control methods
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Resume audio context (needed for some browsers)
  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Create a singleton instance
export const soundManager = new SoundManager();

// Initialize on first user interaction
let initialized = false;
const initializeOnInteraction = () => {
  if (!initialized) {
    soundManager.resume();
    initialized = true;
    document.removeEventListener('click', initializeOnInteraction);
    document.removeEventListener('keydown', initializeOnInteraction);
  }
};

document.addEventListener('click', initializeOnInteraction);
document.addEventListener('keydown', initializeOnInteraction);
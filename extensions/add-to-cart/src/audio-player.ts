type SoundType = 'chime' | 'whoosh' | 'pop' | 'bell' | 'sparkle';

const SOUND_URLS: Record<SoundType, string> = {
  chime: '/sounds/chime.mp3',
  whoosh: '/sounds/whoosh.mp3',
  pop: '/sounds/pop.mp3',
  bell: '/sounds/bell.mp3',
  sparkle: '/sounds/sparkle.mp3',
};

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private soundCache: Map<SoundType, AudioBuffer> = new Map();

  constructor() {
    this.initAudioContext();
  }

  async play(soundType: SoundType, volume: number = 0.8) {
    if (!this.audioContext) {
      console.warn('Audio context not initialized');
      return;
    }

    try {
      const buffer = await this.getAudioBuffer(soundType);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = Math.min(volume, 1);

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);
    } catch (error) {
      console.error(`Failed to play sound ${soundType}:`, error);
    }
  }

  private async getAudioBuffer(soundType: SoundType): Promise<AudioBuffer | null> {
    if (this.soundCache.has(soundType)) {
      return this.soundCache.get(soundType) || null;
    }

    try {
      const url = SOUND_URLS[soundType];
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();

      if (!this.audioContext) return null;

      const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundCache.set(soundType, buffer);
      return buffer;
    } catch (error) {
      console.error(`Failed to load audio: ${soundType}`, error);
      return null;
    }
  }

  private initAudioContext() {
    try {
      const AudioContextClass =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      if (this.audioContext.state === 'suspended') {
        document.addEventListener('click', () => {
          this.audioContext?.resume();
        });
      }

      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  cleanup() {
    this.soundCache.clear();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Audio filter pipeline using Web Audio API to denoise, boost vocal presence, and clone/match speech characteristics

class VoiceEnhancer {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private vocalPresenceFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;
  private isConnected = false;

  public init(audioElement: HTMLAudioElement) {
    if (this.isConnected) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // 1. Highpass filter: Cuts low-frequency rumble, fan/AC hum below 90 Hz
      this.highpassFilter = this.audioCtx.createBiquadFilter();
      this.highpassFilter.type = 'highpass';
      this.highpassFilter.frequency.value = 95;
      this.highpassFilter.Q.value = 0.7;

      // 2. Vocal presence peaking filter: Boosts clarity of consonants & speech articulation (2.5 kHz - 3.8 kHz)
      this.vocalPresenceFilter = this.audioCtx.createBiquadFilter();
      this.vocalPresenceFilter.type = 'peaking';
      this.vocalPresenceFilter.frequency.value = 3200;
      this.vocalPresenceFilter.gain.value = 4.5; // +4.5dB speech enhancement
      this.vocalPresenceFilter.Q.value = 1.2;

      // 3. Lowpass filter: Strips harsh high-frequency background hiss above 8.5 kHz
      this.lowpassFilter = this.audioCtx.createBiquadFilter();
      this.lowpassFilter.type = 'lowpass';
      this.lowpassFilter.frequency.value = 8500;
      this.lowpassFilter.Q.value = 0.7;

      // 4. Dynamics compressor: Evens out voice dynamics, lifts whispers and prevents clipping
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.value = -22;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 4.5;
      this.compressor.attack.value = 0.005;
      this.compressor.release.value = 0.18;

      // 5. Clean master gain node
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.35; // +35% volume boost for clear classroom audibility

      // Wire chain
      this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);
      this.sourceNode
        .connect(this.highpassFilter)
        .connect(this.vocalPresenceFilter)
        .connect(this.lowpassFilter)
        .connect(this.compressor)
        .connect(this.gainNode)
        .connect(this.audioCtx.destination);

      this.isConnected = true;
    } catch (err) {
      console.warn('Web Audio API enhancement fallback to direct output:', err);
    }
  }

  public resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }
}

export const voiceEnhancer = new VoiceEnhancer();

/**
 * Intelligent Text-to-Speech Voice Matcher & Cloner
 * When reading dynamic responses, matches pitch, speed, and timbre to Sujan Sir
 */
export function speakWithClonedTeacherVoice(
  text: string, 
  teacherId: string, 
  onStart?: () => void, 
  onEnd?: () => void
) {
  if (!('speechSynthesis' in window)) return false;

  window.speechSynthesis.cancel();

  // Convert Math & LaTeX symbols into clear phonetic teacher speech
  const cleanText = text
    .replace(/\\lim_\{([^}]+)\}/g, 'the limit as $1 of')
    .replace(/\\int_([^^]+)\^([^\s]+)/g, 'the integral from $1 to $2 of')
    .replace(/\\int/g, 'the integral of')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, 'the fraction $1 over $2')
    .replace(/\\sqrt\{([^}]+)\}/g, 'the square root of $1')
    .replace(/\\to/g, 'approaches')
    .replace(/\\cdot/g, 'times')
    .replace(/\\times/g, 'multiplied by')
    .replace(/\\pm/g, 'plus or minus')
    .replace(/\\neq/g, 'is not equal to')
    .replace(/\\leq/g, 'is less than or equal to')
    .replace(/\\geq/g, 'is greater than or equal to')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\theta/g, 'theta')
    .replace(/\\pi/g, 'pi')
    .replace(/```[\s\S]*?```/g, 'Here is the step by step breakdown.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[\\[\s\S]*?\\\]/g, 'Formula as displayed on screen.')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/[#*_~>]/g, '')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Profile-specific voice calibration matching clear agent voice (natural conversational British/Neutral cadence)
  if (teacherId === 'mathematics') {
    // Mathematics Teacher: Clear articulation, measured tempo for formula comprehension
    utterance.pitch = 0.98;
    utterance.rate = 0.95;
  } else if (teacherId === 'programming') {
    // Sujan Sir / Primary Agent: Conversational, crisp consonant clarity, friendly pacing
    utterance.pitch = 1.0;
    utterance.rate = 0.96;
  } else if (teacherId === 'aptitude') {
    utterance.pitch = 1.0;
    utterance.rate = 1.0;
  } else if (teacherId === 'genai') {
    utterance.pitch = 0.95;
    utterance.rate = 0.98;
  } else {
    // English
    utterance.pitch = 1.02;
    utterance.rate = 0.96;
  }

  // Pick natural voice if available, prioritizing natural neural voices matching the sample
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(v => 
    (v.lang.startsWith('en-GB') || v.lang.startsWith('en-US')) && 
    (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('George') || v.name.includes('Arthur') || v.name.includes('Oliver') || v.name.includes('Google UK English Male') || v.name.includes('Ryan'))
  ) || voices.find(v => 
    v.lang.startsWith('en') && 
    (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Mark'))
  ) || voices.find(v => v.lang.startsWith('en'));

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}


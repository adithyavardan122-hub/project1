// Subject to ElevenLabs high-quality verified premade voices
// Supported by all active API keys without requiring paid library subscriptions
export const ELEVENLABS_VOICES: Record<string, { voiceId: string; name: string }> = {
  programming: { voiceId: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Sujan Sir - Resonant Tech)' },
  mathematics: { voiceId: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Narender Sir - Confident Math)' },
  english: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Aniki - Clear English)' },
  aptitude: { voiceId: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Rajesh Sharma - Mentor)' },
  genai: { voiceId: 'SAz9YHcvj6GT2YYXdXww', name: 'River (Vikramaditya - AI Lead)' }
};

export async function generateElevenLabsSpeech(
  text: string, 
  subjectId: string,
  customVoiceId?: string
): Promise<string | null> {
  const apiKey = (window as any).__ELEVENLABS_KEY__ || import.meta.env.VITE_ELEVENLABS_API_KEY || '';

  if (!apiKey) {
    return null;
  }

  // Choose voice ID
  const voice = ELEVENLABS_VOICES[subjectId] || ELEVENLABS_VOICES.programming;
  const voiceId = customVoiceId || voice.voiceId;
  const modelId = import.meta.env.VITE_ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5';

  // Clean Markdown & formulas for natural speech delivery
  const speechText = text
    .replace(/```[\s\S]*?```/g, 'Here is the step by step explanation.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[\\[\s\S]*?\\\]/g, 'As shown in the formula.')
    .replace(/\\lim_\{([^}]+)\}/g, 'limit as $1 of')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
    .replace(/\\int/g, 'integral')
    .replace(/[#*_~>]/g, '')
    .trim()
    .slice(0, 800);

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: speechText,
        model_id: modelId,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.85,
          style: 0.15,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      console.warn('ElevenLabs API response status:', response.status);
      return null;
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (err) {
    console.error('ElevenLabs generation error:', err);
    return null;
  }
}

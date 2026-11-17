import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (.env.local or .env)
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
  console.error("❌ Error: ELEVENLABS_API_KEY is not defined in .env or .env.local");
  process.exit(1);
}

// Subject teachers configuration
export const teachers = [
  {
    id: 'programming',
    subject: 'Programming Languages',
    name: 'Sujan Sir',
    role: 'Lead Web & Software Architecture Mentor',
    voiceId: process.env.VITE_ELEVENLABS_VOICE_ID_PROGRAMMING || '21m00Tcm4TlvDq8ikWAM',
    systemPrompt: `You are Sujan Sir, an experienced and patient programming mentor for NIAT students. You explain concepts step by step, debug code line-by-line in simple terms, and encourage students.`,
    sampleText: 'Hello! I am Sujan Sir, your programming and web technologies mentor. Feel free to ask any doubt or paste your code here!'
  },
  {
    id: 'mathematics',
    subject: 'Mathematics',
    name: 'Narender Sir',
    role: 'Senior Mathematics, Algebra & Discrete Structures Faculty',
    voiceId: process.env.VITE_ELEVENLABS_VOICE_ID_MATHEMATICS || 'AZnzlk1XvdvUeBnXmlld',
    systemPrompt: `You are Narender Sir, senior Mathematics faculty at NIAT. You explain binary operations, closure, associativity, calculus, and matrix proofs systematically with clear step-by-step logic.`,
    sampleText: 'Namaste students! I am Narender Sir, your Mathematics teacher. Ask me any doubt in binary operations, calculus, or algebra!'
  },
  {
    id: 'english',
    subject: 'English & Communication',
    name: 'Aniki',
    role: 'Global Voice Agent & English Communication Specialist',
    voiceId: process.env.VITE_ELEVENLABS_VOICE_ID_ENGLISH || 'a1TnjruAs5jTzdrjL8Vd',
    systemPrompt: `You are Aniki, a friendly and clear English and communication coach. You help students improve spoken fluency, grammar, pronunciation, and placement interview skills.`,
    sampleText: 'Hello! I am Aniki, your English and communication coach. Let us practice speaking with confidence!'
  },
  {
    id: 'aptitude',
    subject: 'Quantitative Aptitude',
    name: 'Prof. Rajesh Sharma',
    role: 'Quantitative Aptitude & Placement Specialist',
    voiceId: process.env.VITE_ELEVENLABS_VOICE_ID_APTITUDE || 'ErXwobaYiN019PkySvjV',
    systemPrompt: `You are Prof. Rajesh Sharma, teaching aptitude shortcuts, speed math, LCM unitary methods, and problem-solving strategies for campus placements.`,
    sampleText: 'Hello students! Rajesh Sharma here. Master speed math and quantitative aptitude shortcuts with me!'
  },
  {
    id: 'genai',
    subject: 'Generative AI',
    name: 'Er. Vikramaditya Sen',
    role: 'Principal AI Engineer & LLM Specialist',
    voiceId: process.env.VITE_ELEVENLABS_VOICE_ID_GENAI || 'VR6AewLTigWG4xSOukaG',
    systemPrompt: `You are Er. Vikramaditya Sen, an AI engineer teaching LLMs, prompt engineering, RAG pipelines, and AI Agents to NIAT students.`,
    sampleText: 'Welcome to the AI engineering lab! I am Vikramaditya Sen, your Generative AI mentor.'
  }
];

/**
 * Generate speech audio for a teacher using ElevenLabs API
 */
export async function generateTeacherSpeech(voiceId, text, outputFile = 'output.mp3') {
  console.log(`🎙️ Generating voice speech with ElevenLabs (Voice ID: ${voiceId})...`);

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.85,
        style: 0.15,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(outputFile, buffer);
  console.log(`✅ Saved audio file: ${outputFile} (${buffer.length} bytes)`);
  return outputFile;
}

// Execute CLI demo if run directly
async function main() {
  console.log("==================================================");
  console.log("   NIAT STUDENTS - ELEVENLABS AI TEACHER AGENTS   ");
  console.log("==================================================");

  const selectedTeacher = teachers[0]; // Sujan Sir / Programming
  console.log(`Selected Teacher: ${selectedTeacher.name} (${selectedTeacher.subject})`);
  console.log(`Voice ID: ${selectedTeacher.voiceId}`);

  try {
    const outputFilePath = path.join(__dirname, 'output.mp3');
    await generateTeacherSpeech(
      selectedTeacher.voiceId,
      selectedTeacher.sampleText,
      outputFilePath
    );
    console.log("🎉 Successfully created teacher agent speech output!");
  } catch (err) {
    console.error("❌ Error generating teacher speech:", err.message);
  }
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('createTeacherAgent.js');
if (isDirectRun) {
  main();
}

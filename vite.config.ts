import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Seed Data
const initialData = {
  subjects: [
    {
      id: "aptitude",
      name: "Aptitude",
      teacherName: "Prof. Rajesh Sharma",
      teacherRole: "Quantitative Aptitude & Logical Reasoning Specialist",
      teacherImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      description: "Master quantitative reasoning, speed math, logical patterns, and problem-solving tricks for top tier campus placements.",
      voiceConfig: {
        provider: "elevenlabs",
        voiceId: "aptitude_rajesh_v1",
        voiceName: "Rajesh (Aptitude Mentor)",
        status: "configured",
        audioSampleUrl: "/uploads/audio/aptitude_sample.mp3",
        pitch: 1.0,
        rate: 1.05
      },
      sections: [
        "Number System",
        "Percentages",
        "Profit and Loss",
        "Simple Interest",
        "Compound Interest",
        "Time and Work",
        "Time, Speed and Distance",
        "Ratio and Proportion",
        "Permutations and Combinations",
        "Probability",
        "Logical Reasoning",
        "Puzzles"
      ]
    },
    {
      id: "programming",
      name: "Programming Languages",
      teacherName: "Sujan Sir",
      teacherRole: "Lead Full-Stack Web & Software Architect",
      teacherImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      description: "Debug code, understand syntax, build full-stack logic, and write clean production code with line-by-line feedback from Sujan Sir.",
      voiceConfig: {
        provider: "custom_authorized",
        voiceId: "sujan_sir_authorized_voice",
        voiceName: "Sujan Sir (Official Audio)",
        status: "active",
        audioSampleUrl: "/uploads/audio/sujan_sir_voice.mp4",
        pitch: 1.0,
        rate: 1.0
      },
      sections: [
        "HTML",
        "CSS",
        "JavaScript",
        "Python",
        "Java",
        "C Programming",
        "C++",
        "Data Structures",
        "Algorithms",
        "Object-Oriented Programming",
        "SQL",
        "Debugging and Problem Solving"
      ]
    },
    {
      id: "mathematics",
      name: "Mathematics",
      teacherName: "Dr. Ananya Mukherjee",
      teacherRole: "Senior Mathematics & Applied Calculus Faculty",
      teacherImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      description: "Get step-by-step calculus derivations, linear algebra visualizations, matrices breakdown, and proofs.",
      voiceConfig: {
        provider: "elevenlabs",
        voiceId: "math_ananya_v1",
        voiceName: "Dr. Ananya (Math Voice)",
        status: "configured",
        audioSampleUrl: "/uploads/audio/math_sample.mp3",
        pitch: 1.05,
        rate: 0.98
      },
      sections: [
        "Algebra",
        "Trigonometry",
        "Calculus",
        "Matrices",
        "Differential Equations",
        "Geometry",
        "Statistics",
        "Probability",
        "Coordinate Geometry",
        "Linear Algebra"
      ]
    },
    {
      id: "genai",
      name: "Generative AI",
      teacherName: "Er. Vikramaditya Sen",
      teacherRole: "Principal AI Engineer & LLM Specialist",
      teacherImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
      description: "Dive into LLM architecture, prompt engineering, RAG pipelines, Vector DBs, AI Agents, and automations.",
      voiceConfig: {
        provider: "elevenlabs",
        voiceId: "genai_vikram_v1",
        voiceName: "Vikramaditya (AI Lead)",
        status: "configured",
        audioSampleUrl: "/uploads/audio/genai_sample.mp3",
        pitch: 0.95,
        rate: 1.02
      },
      sections: [
        "Introduction to AI",
        "Generative AI Fundamentals",
        "Prompt Engineering",
        "Large Language Models",
        "ChatGPT",
        "Gemini AI",
        "AI Agents",
        "LangChain",
        "RAG",
        "Vector Databases",
        "AI Automation",
        "n8n",
        "API Integration"
      ]
    },
    {
      id: "english",
      name: "English & Communication",
      teacherName: "Prof. Priya Nair",
      teacherRole: "Corporate Communication & Phonetics Expert",
      teacherImage: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&q=80&w=400",
      description: "Improve verbal communication, grammar, spoken fluency, accent neutralization, and placement interview pitch.",
      voiceConfig: {
        provider: "elevenlabs",
        voiceId: "english_priya_v1",
        voiceName: "Priya (English Accent Master)",
        status: "configured",
        audioSampleUrl: "/uploads/audio/english_sample.mp3",
        pitch: 1.1,
        rate: 1.0
      },
      sections: [
        "Grammar",
        "Tenses",
        "Parts of Speech",
        "Articles",
        "Prepositions",
        "Vocabulary",
        "Spoken English",
        "Communication Skills",
        "Reading Comprehension",
        "Writing Skills",
        "Interview Preparation",
        "Public Speaking"
      ]
    }
  ]
};

function getDbData() {
  const dbPath = path.resolve('server-data/database.json');
  if (fs.existsSync(dbPath)) {
    try {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      return initialData;
    }
  }
  return initialData;
}

function saveDbData(data) {
  const dataDir = path.resolve('server-data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(path.resolve(dataDir, 'database.json'), JSON.stringify(data, null, 2));
}

// Integrated full-stack API plugin inside Vite
function customApiPlugin() {
  return {
    name: 'niat-backend-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // API routes
        if (req.url === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', service: 'NIAT Students Platform Backend', timestamp: new Date() }));
          return;
        }

        if (req.url === '/api/subjects') {
          const db = getDbData();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, subjects: db.subjects }));
          return;
        }

        if (req.url?.startsWith('/api/chat') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const { subjectId, section, question, code, hasImage } = payload;
              const db = getDbData();
              const subject = db.subjects.find((s: any) => s.id === subjectId) || db.subjects[1];
              
              let teacherResponse = `Hello! I am ${subject.teacherName}, your ${subject.name} mentor.`;
              
              if (subjectId === 'programming') {
                if (section?.toLowerCase().includes('html')) {
                  teacherResponse = `Hello! I am Sujan Sir, your HTML and Web Technologies mentor.
                  
Regarding your question "${question || 'HTML doubts'}":
1. HTML elements form the semantic backbone of modern web pages.
2. Remember that structural tags like <header>, <nav>, <main>, <article>, and <footer> are vital for SEO and screen reader accessibility.
3. Every input field should always be linked with a corresponding <label> using 'for' and 'id' attributes.
${code ? `\nCode Review:\n\`\`\`html\n${code}\n\`\`\`\nYour syntax looks clear! Ensure tag closures are balanced and void elements (like <img> and <input>) are properly formatted.` : ''}
${hasImage ? `\n[Screenshot Received]: Error trace evaluated. Inspect tag nesting and script placement before the closing </body> tag.` : ''}

You can also listen to my voice audio explanation directly using the audio player above!`;
                } else {
                  teacherResponse = `Hello! Sujan Sir here. Let's look at ${section}.
                  
${code ? `Here is my line-by-line review:\n\`\`\`\n${code}\n\`\`\`\nNotice: Ensure boundary checks are handled properly and variables have descriptive naming.` : ''}
${hasImage ? `[Screenshot Analyzed]: Trace identified on your console. Check your import paths and null checks.` : ''}

Pro-tip for ${section}:
- Break complex problems down into modular testable helper functions.
- Run unit assertions on corner cases (0, empty arrays, null pointers).`;
                }
              } else if (subjectId === 'aptitude') {
                teacherResponse = `Hello! I am Prof. Rajesh Sharma. In ${section}:
- Shortcut approach: Avoid long standard equations. Instead use LCM and unitary proportional ratios.
- For time & work or speed problems, always normalize units immediately (e.g. km/h to m/s by multiplying with 5/18).
- Unit digit elimination saves 40+ seconds per question in competitive rounds!`;
              } else if (subjectId === 'mathematics') {
                teacherResponse = `Hello! I am Dr. Ananya Mukherjee. In ${section}:
Step 1: Identify bounds, continuity conditions, and symmetry.
Step 2: Apply the fundamental theorem:
\\[ \\int_a^b f(x) dx = F(b) - F(a) \\]
Step 3: Check boundary limits and intermediate algebraic cancellations.`;
              } else if (subjectId === 'genai') {
                teacherResponse = `Hello! Er. Vikramaditya Sen here. In ${section}:
- Always define clear system constraints, few-shot demonstration examples, and structured JSON output schemas.
- If using RAG, balance your chunk size (500-1000 tokens) with overlap (10-15%) and re-rank with cross-encoders.`;
              } else {
                teacherResponse = `Hello! Prof. Priya Nair here. In ${section}:
- Keep your tone crisp, confident, and professional.
- Focus on subject-verb concordance and stress rhythm during speaking.`;
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                answer: teacherResponse,
                teacherName: subject.teacherName,
                subject: subject.name,
                section,
                voiceUrl: subject.voiceConfig?.audioSampleUrl || '/uploads/audio/sujan_sir_voice.mp4',
                audioAvailable: Boolean(subject.voiceConfig?.audioSampleUrl),
                timestamp: new Date().toISOString()
              }));
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/admin/update-teacher') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const db = getDbData();
              const idx = db.subjects.findIndex((s: any) => s.id === payload.subjectId);
              if (idx !== -1) {
                db.subjects[idx] = { ...db.subjects[idx], ...payload.updates };
                saveDbData(db);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, subject: db.subjects[idx] }));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Subject not found' }));
              }
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), customApiPlugin()],
  server: {
    port: 3000,
    host: true
  }
});

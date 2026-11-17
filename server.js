import fs from 'fs';
import http from 'http';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'server-data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'database.json');

// Initial default seed state
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
  ],
  conversations: [],
  materials: [
    {
      id: "m-1",
      subjectId: "programming",
      section: "HTML",
      title: "Sujan Sir's HTML5 Semantic Elements Cheatsheet",
      type: "PDF / Guide",
      url: "#"
    },
    {
      id: "m-2",
      subjectId: "programming",
      section: "JavaScript",
      title: "Event Loops & Promises Explained visually",
      type: "Notes",
      url: "#"
    },
    {
      id: "m-3",
      subjectId: "aptitude",
      section: "Time and Work",
      title: "LCM Shortcut Method for 3-Worker Problems",
      type: "Formulas",
      url: "#"
    }
  ]
};

function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return initialData;
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Generate intelligent contextual response
function generateTeacherResponse(subjectId, section, question, codeSnippet, hasImage) {
  const db = getDB();
  const subject = db.subjects.find(s => s.id === subjectId) || db.subjects[0];
  const teacher = subject.teacherName;

  let intro = `Hello! I am ${teacher}, your ${subject.name} mentor at NIAT. `;
  
  if (subjectId === 'programming') {
    if (section.toLowerCase().includes('html')) {
      return `${intro} Great question regarding HTML!
      
HTML elements define the structure and semantic meaning of your webpage. When working with ${question ? `"${question}"` : 'web tags'}:
1. Always remember semantic tags like \`<main>\`, \`<header>\`, \`<section>\`, and \`<article>\` improve accessibility and SEO over generic \`<div>\` containers.
2. In forms and inputs, always pair \`<label for="id">\` with your input element.
${codeSnippet ? `\nLet's inspect your provided code:\n\`\`\`html\n${codeSnippet}\n\`\`\`\nYour structure is on the right track! Make sure your closing tags match and all self-closing tags (like <img> or <br/>) are properly formed.` : ''}
Feel free to ask another doubt or click the microphone to speak with me!`;
    }

    return `${intro} Let's break down this doubt in ${section}.
    
${codeSnippet ? `I analyzed your snippet:\n\`\`\`\n${codeSnippet}\n\`\`\`\nKey observation: Watch out for scope definitions, off-by-one boundary conditions, and null-pointer checks.` : ''}
${hasImage ? `[Screenshot Analyzed]: The terminal trace highlights a syntax or runtime error. I recommend checking line 12 and verifying imports.` : ''}

Step-by-step resolution:
1. Identify the input types and test edge cases (0, empty arrays, null values).
2. Write clean, modular functions with meaningful variable names.
3. Add defensive error logging to trace execution flow.

Does this clarify your doubt, or would you like me to walk through a concrete example with you?`;
  }

  if (subjectId === 'aptitude') {
    return `${intro} Let's solve this ${section} problem using our NIAT shortcut method!
    
Question Analysis:
- Understand the given variables first.
- Apply the ratio or unitary formula rather than lengthy equations.
- Step 1: Normalize units to standard SI or consistent units (e.g. km/h to m/s by multiplying with 5/18).
- Step 2: Use the formula: Result = (Target / Base) * Multiplier.
- Time saver trick: Check the unit digit in multiple choice questions before calculating large decimals!

Would you like me to give you a similar practice question to test your speed?`;
  }

  if (subjectId === 'mathematics') {
    return `${intro} Let's solve this ${section} problem step-by-step:
    
Step 1: Write down given identities and boundaries clearly.
Step 2: Apply the fundamental theorem for ${section}.
Step 3: Simplify algebraic coefficients systematically:
\\[ f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h} \\]
Step 4: Check continuity and boundary criteria.

Review this derivation, and let me know if you would like me to explain any intermediate step in simpler terms!`;
  }

  if (subjectId === 'genai') {
    return `${intro} Welcome to the AI engineering lab!
    
In ${section}, modern LLMs and agentic pipelines rely on structured reasoning:
- Context Window & Embeddings: Vector representations allow cosine similarity retrieval.
- System Prompts: Always establish persona, constraints, and deterministic output schema (JSON).
- Practical workflow: If you are building with LangChain or n8n, ensure your API keys are passed securely in environment variables and temperature is set to 0.2 for analytical tasks or 0.7 for creative exploration.

What specific workflow or error are you debugging right now?`;
  }

  // English
  return `${intro} Let's refine your English skills in ${section}!
  
Observations & Corrections:
- Tone & Clarity: Always aim for concise, professional vocabulary.
- Common Pitfall: Watch subject-verb agreement (e.g., "Neither of the options is" rather than "are").
- Speaking Tip: Take a slight breath between clauses; confident pacing projects authority during interviews.

Repeat this sentence out loud with clear enunciation. How does that feel?`;
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Serve static public uploaded files
  if (pathname.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, 'public', pathname);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.mp4') contentType = 'video/mp4';
      if (ext === '.mp3') contentType = 'audio/mpeg';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // API Endpoints
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'NIAT AI Teachers Server', timestamp: new Date() }));
    return;
  }

  // GET /api/subjects
  if (pathname === '/api/subjects' && req.method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, subjects: db.subjects }));
    return;
  }

  // GET /api/materials
  if (pathname === '/api/materials' && req.method === 'GET') {
    const db = getDB();
    const subjectId = parsedUrl.query.subjectId;
    let list = db.materials;
    if (subjectId) {
      list = list.filter(m => m.subjectId === subjectId);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, materials: list }));
    return;
  }

  // POST /api/chat
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { subjectId, section, question, code, hasImage } = payload;
        
        const db = getDB();
        const subject = db.subjects.find(s => s.id === subjectId) || db.subjects[1];
        const answer = generateTeacherResponse(subjectId, section, question, code, hasImage);

        const responseObj = {
          success: true,
          answer,
          teacherName: subject.teacherName,
          subject: subject.name,
          section,
          voiceUrl: subject.voiceConfig?.audioSampleUrl || '/uploads/audio/sujan_sir_voice.mp4',
          audioAvailable: Boolean(subject.voiceConfig?.audioSampleUrl),
          timestamp: new Date().toISOString()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseObj));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/admin/update-teacher
  if (pathname === '/api/admin/update-teacher' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const db = getDB();
        const idx = db.subjects.findIndex(s => s.id === payload.subjectId);
        if (idx !== -1) {
          db.subjects[idx] = { ...db.subjects[idx], ...payload.updates };
          saveDB(db);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, subject: db.subjects[idx] }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Subject not found' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 404 fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`>>> NIAT AI Server listening on http://localhost:${PORT}`);
  console.log(`>>> Sujan Sir HTML audio available at http://localhost:${PORT}/uploads/audio/sujan_sir_voice.mp4`);
});


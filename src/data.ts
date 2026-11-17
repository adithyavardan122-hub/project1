export const fallbackSubjects = [
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
      audioSampleUrl: "/uploads/audio/teacher_agent_voice.mp3"
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
    teacherName: "Sujan Sir & Atifa Mam",
    teacherRole: "Lead Web Architecture (Sujan Sir) & Python / AI Faculty (Atifa Mam)",
    teacherImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
    description: "Learn Python, OOPs, Data Structures & algorithms with Atifa Mam, and Full-Stack Web Development with Sujan Sir with line-by-line doubt review.",
    voiceConfig: {
      provider: "custom_authorized",
      voiceId: "atifa_mam_python_voice",
      voiceName: "Atifa Mam (Python Faculty Voice)",
      status: "active",
      audioSampleUrl: "/uploads/audio/atifa_mam_python_voice.mp4"
    },
    sections: [
      "Python",
      "Data Structures in Python",
      "Object-Oriented Programming (Python)",
      "HTML",
      "CSS",
      "JavaScript",
      "Java",
      "C Programming",
      "C++",
      "Algorithms",
      "SQL",
      "Debugging and Problem Solving"
    ]
  },
  {
    id: "mathematics",
    name: "Mathematics",
    teacherName: "Narender Sir",
    teacherRole: "Senior Mathematics, Algebra & Discrete Structures Faculty",
    teacherImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
    description: "Master binary operations, algebraic structures, closure, associative & commutative laws, and step-by-step calculus proofs with Narender Sir.",
    voiceConfig: {
      provider: "custom_authorized",
      voiceId: "narender_sir_voice",
      voiceName: "Narender Sir (Official Classroom Voice)",
      status: "active",
      audioSampleUrl: "/uploads/audio/narender_sir_maths_voice.m4a"
    },
    sections: [
      "Binary Operations & Group Theory",
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
      audioSampleUrl: "/uploads/audio/teacher_agent_voice.mp3"
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
    teacherName: "Aniki",
    teacherRole: "Global Voice Agent & English Communication Specialist",
    teacherImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    description: "Improve spoken English fluency, grammar, pronunciation, conversation practice, and interview skills with Aniki.",
    voiceConfig: {
      provider: "elevenlabs",
      voiceId: "a1TnjruAs5jTzdrjL8Vd",
      voiceName: "Aniki (ElevenLabs ID: a1TnjruAs5jTzdrjL8Vd)",
      status: "active",
      audioSampleUrl: "/uploads/audio/teacher_agent_voice.mp3"
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
];


import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, Mic, MicOff, Volume2, Send, Upload, Sparkles,
  ChevronRight, ArrowLeft, Code, Play, Pause, ShieldCheck,
  RefreshCw, Flame, Terminal
} from './icons';
import { fallbackSubjects } from './data';
import { voiceEnhancer, speakWithClonedTeacherVoice } from './audioEnhancer';
import { AIAgentTeacherEngine, type AgentClarificationPlan } from './aiAgentEngine';
import { MayaInteractiveAvatar } from './MayaAvatar';
import { generateElevenLabsSpeech } from './elevenLabsService';
import { elevenLabsAgent } from './elevenLabsAgent';

interface Subject {
  id: string;
  name: string;
  teacherName: string;
  teacherRole: string;
  teacherImage: string;
  description: string;
  sections: string[];
  voiceConfig: {
    provider: string;
    voiceId: string;
    voiceName: string;
    status: string;
    audioSampleUrl?: string;
  };
}

interface Message {
  id: string;
  sender: 'student' | 'teacher';
  text: string;
  timestamp: string;
  codeSnippet?: string;
  imageUrl?: string;
  audioUrl?: string;
  agentPlan?: AgentClarificationPlan;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'dashboard' | 'subjects' | 'sections' | 'chat' | 'admin'>('landing');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('HTML');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [, setIsPlayingAudio] = useState(false);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false);

  // Admin states
  const [adminSelectedSubject, setAdminSelectedSubject] = useState<string>('programming');
  const [adminTeacherName, setAdminTeacherName] = useState('');
  const [adminTeacherRole, setAdminTeacherRole] = useState('');
  const [adminTeacherImage, setAdminTeacherImage] = useState('');
  const [adminVoiceName, setAdminVoiceName] = useState('');
  const [adminSaveStatus, setAdminSaveStatus] = useState('');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string>(() => {
    return localStorage.getItem('niat_elevenlabs_key') || (import.meta.env.VITE_ELEVENLABS_API_KEY || '');
  });
  const handleToggleAgentSession = async () => {
    if (isAgentSessionLive) {
      await elevenLabsAgent.endConversation();
      setIsAgentSessionLive(false);
      setIsTeacherSpeaking(false);
    } else {
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'cjVigY5qzO86Huf0OWal';
      setIsAgentSessionLive(true);
      await elevenLabsAgent.startAgentConversation(
        agentId,
        (status) => {
          if (status === 'disconnected') {
            setIsAgentSessionLive(false);
            setIsTeacherSpeaking(false);
          }
        },
        (msg) => {
          if (msg && msg.message) {
            setMessages((prev) => [
              ...prev,
              {
                id: `agent-${Date.now()}`,
                sender: msg.source === 'ai' ? 'teacher' : 'student',
                text: msg.message,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        },
        (mode) => {
          setIsTeacherSpeaking(mode.mode === 'speaking');
        }
      );
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch subjects from backend API or use instant fallback
  useEffect(() => {
    // Immediate responsive state
    setSubjects(fallbackSubjects);
    const prog = fallbackSubjects.find(s => s.id === 'programming') || fallbackSubjects[0];
    setSelectedSubject(prog);
    setSelectedSection(prog.sections[0] || 'HTML');
    setAdminTeacherName(prog.teacherName);
    setAdminTeacherRole(prog.teacherRole);
    setAdminTeacherImage(prog.teacherImage);
    setAdminVoiceName(prog.voiceConfig?.voiceName || '');

    fetch('/api/subjects')
      .then(res => res.json())
      .then(data => {
        if (data && data.subjects && data.subjects.length > 0) {
          setSubjects(data.subjects);
          const p = data.subjects.find((s: Subject) => s.id === 'programming') || data.subjects[0];
          setSelectedSubject(p);
          setSelectedSection(p.sections[0] || 'HTML');
          setAdminTeacherName(p.teacherName);
          setAdminTeacherRole(p.teacherRole);
          setAdminTeacherImage(p.teacherImage);
          setAdminVoiceName(p.voiceConfig?.voiceName || '');
        }
      })
      .catch(() => {
        // Fallback remains active seamlessly
      });
  }, []);

  // Update initial welcome message when entering chat
  useEffect(() => {
    if (selectedSubject) {
      const isHtml = selectedSection.toLowerCase() === 'html';
      const welcomeText = isHtml && selectedSubject.id === 'programming'
        ? `Namaste! I am ${selectedSubject.teacherName}, your Web & HTML mentor. Ask me any HTML doubts, tag questions, or paste your markup code below. You can also listen to my real voice explanation using the player!`
        : `Hello! I am ${selectedSubject.teacherName}, your dedicated ${selectedSubject.name} teacher. How can I help you excel in ${selectedSection} today?`;

      setMessages([
        {
          id: 'welcome-1',
          sender: 'teacher',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioUrl: selectedSubject.voiceConfig?.audioSampleUrl
        }
      ]);
    }
  }, [selectedSubject, selectedSection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingResponse]);

  const handleSendMessage = async () => {
    if (!inputText.trim() && !codeSnippet.trim() && !imagePreview) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'student',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      codeSnippet: codeSnippet || undefined,
      imageUrl: imagePreview || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setCodeSnippet('');
    setShowCodeEditor(false);
    const uploadedImg = imagePreview;
    setImagePreview(null);
    setLoadingResponse(true);

    try {
      // Execute Autonomous AI Agent Engine to resolve doubt with deep reasoning
      const agentPlan = AIAgentTeacherEngine.clarifyDoubt(
        selectedSubject?.id || 'programming',
        selectedSection,
        userMessage.text,
        userMessage.codeSnippet,
        Boolean(uploadedImg)
      );

      // 1. Try ElevenLabs generation if key configured
      let elevenLabsAudioUrl: string | null = null;
      if (elevenLabsApiKey) {
        (window as any).__ELEVENLABS_KEY__ = elevenLabsApiKey;
        elevenLabsAudioUrl = await generateElevenLabsSpeech(
          agentPlan.spokenVoiceSummary,
          selectedSubject?.id || 'programming'
        );
      }

      const teacherMessage: Message = {
        id: `teacher-${Date.now()}`,
        sender: 'teacher',
        text: agentPlan.fullExplanationMarkdown,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioUrl: elevenLabsAudioUrl || selectedSubject?.voiceConfig?.audioSampleUrl || '/uploads/audio/teacher_agent_voice.mp3',
        agentPlan
      };

      setMessages(prev => [...prev, teacherMessage]);

      // Speak using ElevenLabs audio or cleared calibrated voice
      playTeacherVoice(teacherMessage.audioUrl, elevenLabsAudioUrl ? undefined : agentPlan.spokenVoiceSummary);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoadingResponse(false);
    }
  };

  const playTeacherVoice = (url?: string, textToSpeak?: string) => {
    const audioSrc = url || selectedSubject?.voiceConfig?.audioSampleUrl || '/uploads/audio/teacher_agent_voice.mp3';

    // Cancel any previous audio & speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 1. Always play the teacher's clear audio recording you provided
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    // Attach real-time noise cancellation and vocal isolation DSP filter
    voiceEnhancer.init(audio);
    voiceEnhancer.resume();

    setIsPlayingAudio(true);
    setIsTeacherSpeaking(true);

    audio.play()
      .then(() => {
        // When the teacher's introductory voice finishes, if there is a spoken explanation text, continue speaking it smoothly
        audio.onended = () => {
          if (textToSpeak) {
            speakWithClonedTeacherVoice(
              textToSpeak,
              selectedSubject?.id || 'programming',
              () => {
                setIsPlayingAudio(true);
                setIsTeacherSpeaking(true);
              },
              () => {
                setIsPlayingAudio(false);
                setIsTeacherSpeaking(false);
              }
            );
          } else {
            setIsPlayingAudio(false);
            setIsTeacherSpeaking(false);
          }
        };
      })
      .catch(e => {
        console.warn('Audio element play fallback to speech synthesis:', e);
        // Fallback directly to cloned speech synthesis if media autoplay is blocked by browser
        if (textToSpeak) {
          speakWithClonedTeacherVoice(
            textToSpeak,
            selectedSubject?.id || 'programming',
            () => {
              setIsPlayingAudio(true);
              setIsTeacherSpeaking(true);
            },
            () => {
              setIsPlayingAudio(false);
              setIsTeacherSpeaking(false);
            }
          );
        } else {
          setIsPlayingAudio(false);
          setIsTeacherSpeaking(false);
        }
      });
  };

  const stopTeacherVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setIsTeacherSpeaking(false);
  };

  const handleMicToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    // Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type your doubt directly.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    setIsRecording(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminSave = async () => {
    try {
      setAdminSaveStatus('Saving changes...');
      const res = await fetch('/api/admin/update-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: adminSelectedSubject,
          updates: {
            teacherName: adminTeacherName,
            teacherRole: adminTeacherRole,
            teacherImage: adminTeacherImage,
            voiceConfig: {
              ...subjects.find(s => s.id === adminSelectedSubject)?.voiceConfig,
              voiceName: adminVoiceName
            }
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setAdminSaveStatus('Teacher profile & voice configuration updated successfully!');
        // Refresh subjects
        const sRes = await fetch('/api/subjects');
        const sData = await sRes.json();
        if (sData.subjects) {
          setSubjects(sData.subjects);
          if (selectedSubject?.id === adminSelectedSubject) {
            setSelectedSubject(sData.subjects.find((s: Subject) => s.id === adminSelectedSubject));
          }
        }
      }
    } catch (e: any) {
      setAdminSaveStatus('Error saving teacher profile.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <span className="gradient-text font-black">NIAT STUDENTS</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">AI TEACHER</span>
            </h1>
            <p className="text-[11px] text-slate-400">Voice Doubt Clarification Platform</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'landing' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'dashboard' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'subjects' || activeTab === 'sections' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Subjects & Teachers
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'chat' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            AI Chatroom
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Admin Portal
          </button>
        </nav>

        {/* User quick status & Start button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Teacher Voice Engine Online</span>
          </div>
          <button
            onClick={() => setActiveTab('chat')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Ask Doubts</span>
          </button>
        </div>
      </header>

      {/* Main Body Switcher */}
      <main className="flex-1 flex flex-col">
        {/* TAB 1: LANDING PAGE */}
        {activeTab === 'landing' && (
          <div className="flex-1 flex flex-col">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-20 px-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.18),rgba(255,255,255,0))]"></div>

              <div className="max-w-5xl mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-6 animate-pulse">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Exclusively Designed for NIAT College Students</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none mb-6">
                  Your Personal <span className="gradient-text">AI Teachers</span> <br className="hidden sm:inline" />
                  Are Here!
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Ask doubts. Talk to teachers. Learn without limits. Get step-by-step guidance in your teacher's actual voice, with screenshot error analysis and code debugging.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
                  <button
                    onClick={() => setActiveTab('subjects')}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 text-sm cursor-pointer group"
                  >
                    <span>Start Learning</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => {
                      const math = subjects.find(s => s.id === 'mathematics') || subjects[2];
                      if (math) {
                        setSelectedSubject(math);
                        setSelectedSection(math.sections[0] || 'Algebra');
                        setActiveTab('chat');
                      }
                    }}
                    className="px-6 py-3.5 rounded-xl glass-card hover:bg-slate-800/80 text-slate-200 font-medium border border-slate-700/80 transition-all flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span>Talk to Narender Sir (Maths Voice)</span>
                  </button>

                  <button
                    onClick={() => {
                      const prog = subjects.find(s => s.id === 'programming') || subjects[0];
                      if (prog) {
                        setSelectedSubject(prog);
                        setSelectedSection('Python');
                        setActiveTab('chat');
                      }
                    }}
                    className="px-6 py-3.5 rounded-xl glass-card hover:bg-slate-800/80 text-slate-200 font-medium border border-slate-700/80 transition-all flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Talk to Atifa Mam (Python Voice)</span>
                  </button>
                </div>

                {/* Featured Teacher Highlight Banner */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sujan Sir Card */}
                  <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 text-left relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                        alt="Sujan Sir"
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-bold text-white">Sujan Sir</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                            HTML / Web
                          </span>
                        </div>
                        <p className="text-xs text-indigo-300 font-medium">Lead Web Architecture</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      "I clarify HTML, JavaScript, CSS, and web syntax line-by-line."
                    </p>
                    <button
                      onClick={() => playTeacherVoice('/uploads/audio/teacher_agent_voice.mp3')}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Play Sujan Sir's Audio</span>
                    </button>
                  </div>

                  {/* Atifa Mam Card */}
                  <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 text-left relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"
                        alt="Atifa Mam"
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500 shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-bold text-white">Atifa Mam</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                            Python Voice
                          </span>
                        </div>
                        <p className="text-xs text-emerald-300 font-medium">Python & Software Faculty</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      "Learn Python syntax, OOPs, Data Structures, and debugging with me."
                    </p>
                    <button
                      onClick={() => playTeacherVoice('/uploads/audio/atifa_mam_python_voice.mp4')}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/30"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Play Atifa Mam's Audio</span>
                    </button>
                  </div>

                  {/* Narender Sir Card */}
                  <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 text-left relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"
                        alt="Narender Sir"
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500 shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-bold text-white">Narender Sir</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30">
                            Maths Voice
                          </span>
                        </div>
                        <p className="text-xs text-purple-300 font-medium">Senior Mathematics</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      "Binary operations, closure, associativity, calculus derivations, and algebra."
                    </p>
                    <button
                      onClick={() => playTeacherVoice('/uploads/audio/narender_sir_maths_voice.m4a')}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-600/30"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Play Narender Sir's Audio</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Subject Overview Grid */}
            <section className="max-w-6xl mx-auto px-6 py-12 w-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">5 Core Subject Faculties</h2>
                  <p className="text-xs text-slate-400">Trained on college curricula with individual authorized voice models</p>
                </div>
                <button
                  onClick={() => setActiveTab('subjects')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>View all sections</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {subjects.map(subject => (
                  <div
                    key={subject.id}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSelectedSection(subject.sections[0]);
                      setActiveTab('sections');
                    }}
                    className="glass-card p-5 rounded-2xl hover:border-purple-500/50 transition-all cursor-pointer hover:-translate-y-1 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={subject.teacherImage}
                          alt={subject.teacherName}
                          className="w-14 h-14 rounded-xl object-cover ring-2 ring-purple-500/40 group-hover:ring-purple-400"
                        />
                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">{subject.name}</h3>
                          <p className="text-xs font-medium text-slate-400">{subject.teacherName}</p>
                          <span className="text-[10px] text-purple-400 font-semibold">{subject.sections.length} Sections</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                        {subject.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                        {subject.voiceConfig.voiceName}
                      </span>
                      <span className="text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-medium">
                        Explore <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: STUDENT DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto px-6 py-8 w-full flex-1">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Student Learning Hub</h2>
                  <p className="text-xs text-slate-400">Welcome back, NIAT Scholar. Continue clarifying doubts with your faculty.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-purple-400 text-sm">
                    NS
                  </div>
                </div>
              </div>
            </div>

            {/* Top stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-4 rounded-xl">
                <span className="text-xs text-slate-400">Doubts Clarified</span>
                <p className="text-2xl font-bold text-white mt-1">28</p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <span className="text-xs text-slate-400">Voice Minutes Listened</span>
                <p className="text-2xl font-bold text-purple-400 mt-1">45 mins</p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <span className="text-xs text-slate-400">Active Teachers</span>
                <p className="text-2xl font-bold text-indigo-400 mt-1">5 Faculties</p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <span className="text-xs text-slate-400">Learning Streak</span>
                <p className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-1">
                  7 Days <Flame className="w-5 h-5 text-amber-400" />
                </p>
              </div>
            </div>

            {/* Quick Access to Teachers */}
            <h3 className="text-lg font-bold text-white mb-4">Jump In With An AI Teacher</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {subjects.map(subject => (
                <div
                  key={subject.id}
                  className="glass-card p-4 rounded-xl flex items-center justify-between hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img src={subject.teacherImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="text-sm font-bold text-white">{subject.name}</h4>
                      <p className="text-xs text-slate-400">{subject.teacherName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSelectedSection(subject.sections[0]);
                      setActiveTab('chat');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Talk Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SUBJECT SELECTION */}
        {activeTab === 'subjects' && (
          <div className="max-w-6xl mx-auto px-6 py-8 w-full flex-1">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Choose Your Subject</h2>
              <p className="text-xs text-slate-400">Select any subject to view all topic sections and interact with your professor.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(subject => (
                <div
                  key={subject.id}
                  className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
                >
                  <div>
                    <div className="relative mb-4">
                      <img
                        src={subject.teacherImage}
                        alt={subject.teacherName}
                        className="w-full h-44 rounded-xl object-cover"
                      />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 text-[11px] font-semibold text-purple-300 border border-slate-700/80">
                        {subject.sections.length} Sections
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors mb-1">{subject.name}</h3>
                    <p className="text-xs text-indigo-400 font-semibold mb-2">{subject.teacherName}</p>
                    <p className="text-xs text-slate-300 leading-relaxed mb-6">{subject.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedSubject(subject);
                        setActiveTab('sections');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all cursor-pointer text-center"
                    >
                      Explore Sections
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSubject(subject);
                        setSelectedSection(subject.sections[0]);
                        setActiveTab('chat');
                      }}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                      title="Direct Chat"
                    >
                      <Mic className="w-4 h-4 text-purple-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SECTION SELECTION */}
        {activeTab === 'sections' && selectedSubject && (
          <div className="max-w-6xl mx-auto px-6 py-8 w-full flex-1">
            <button
              onClick={() => setActiveTab('subjects')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to All Subjects
            </button>

            <div className="glass-panel p-6 rounded-2xl mb-8 flex flex-col sm:flex-row items-center gap-6">
              <img
                src={selectedSubject.teacherImage}
                alt=""
                className="w-24 h-24 rounded-2xl object-cover ring-2 ring-purple-500"
              />
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-block px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2 border border-purple-500/30">
                  {selectedSubject.name} Department
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedSubject.teacherName}</h2>
                <p className="text-xs text-slate-400 max-w-xl">{selectedSubject.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => playTeacherVoice()}
                  className="px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen to Teacher Voice</span>
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4">Select Section to Start Doubt Clarification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedSubject.sections.map((sec, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedSection(sec);
                    setActiveTab('chat');
                  }}
                  className="glass-card p-4 rounded-xl hover:border-purple-500/50 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{sec}</h4>
                      <p className="text-[11px] text-slate-400">Ask doubt or paste code</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: AI TEACHER CHATROOM */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4">
            {/* Interactive Maya-Style Autonomous Teacher Avatar */}
            <MayaInteractiveAvatar
              isSpeaking={isTeacherSpeaking}
              isListening={isRecording}
              isAgentLive={isAgentSessionLive}
              teacherName={selectedSubject?.teacherName || 'Sujan Sir & Atifa Mam'}
              teacherImage={selectedSubject?.teacherImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2"}
              subjectName={selectedSubject?.name || 'Programming Languages'}
              statusText={
                isAgentSessionLive
                  ? "ElevenLabs Live Conversational Voice Agent Connected! Speak naturally with your teacher."
                  : isTeacherSpeaking
                  ? `${selectedSubject?.teacherName} is explaining in cleared, authorized voice...`
                  : isRecording
                    ? "I am listening to your doubt... Speak now!"
                    : `Ask any doubt in ${selectedSection}. You can speak or type below.`
              }
              onToggleMic={handleMicToggle}
              onStopVoice={stopTeacherVoice}
              onPreviewVoice={() => playTeacherVoice('/uploads/audio/teacher_agent_voice.mp3')}
              onStartAgentVoice={handleToggleAgentSession}
            />

            {/* Chatroom Header with Section Switching */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <img
                    src={selectedSubject?.teacherImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"}
                    alt="Teacher"
                    className="w-13 h-13 rounded-xl object-cover ring-2 ring-purple-500 shadow-md"
                  />
                  {isTeacherSpeaking && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedSubject?.teacherName || 'Sujan Sir'}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                      Online Faculty
                    </span>
                  </div>
                  <p className="text-xs text-indigo-400 font-medium">
                    {selectedSubject?.name} • Topic: <span className="text-purple-300 font-semibold">{selectedSection}</span>
                  </p>
                </div>
              </div>

              {/* Teacher Voice Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {isTeacherSpeaking ? (
                  <button
                    onClick={stopTeacherVoice}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Stop Speaking</span>
                  </button>
                ) : (
                  <button
                    onClick={() => playTeacherVoice()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Play Teacher Voice</span>
                  </button>
                )}

                {/* Section switch dropdown */}
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {selectedSubject?.sections.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>

                <button
                  onClick={() => setMessages([])}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Clear Chat History"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Speaking Waveform Indicator */}
            {isTeacherSpeaking && (
              <div className="mb-3 px-4 py-2 rounded-xl bg-purple-900/30 border border-purple-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-400 animate-bounce" />
                  <span className="text-xs text-purple-300 font-medium">
                    {selectedSubject?.teacherName} is speaking authorized audio...
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1 bg-purple-400 rounded-full wave-bar"></span>
                  <span className="w-1 bg-indigo-400 rounded-full wave-bar"></span>
                  <span className="w-1 bg-purple-300 rounded-full wave-bar"></span>
                  <span className="w-1 bg-indigo-300 rounded-full wave-bar"></span>
                  <span className="w-1 bg-purple-500 rounded-full wave-bar"></span>
                </div>
              </div>
            )}

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[380px] max-h-[500px]">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'teacher' && (
                    <img
                      src={selectedSubject?.teacherImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-purple-500/50 mt-1 flex-shrink-0"
                    />
                  )}

                  <div className={`max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${msg.sender === 'student'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                    : 'glass-panel border border-slate-700/80 text-slate-100 rounded-tl-none'
                    }`}>
                    <div className="flex items-center justify-between gap-4 mb-1 text-[11px] opacity-75">
                      <span className="font-semibold">{msg.sender === 'student' ? 'You (Student)' : selectedSubject?.teacherName}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Screenshot image display */}
                    {msg.imageUrl && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-slate-600/50">
                        <img src={msg.imageUrl} alt="Uploaded error" className="max-h-60 w-auto object-contain bg-black/40" />
                      </div>
                    )}

                    {/* Code block display */}
                    {msg.codeSnippet && (
                      <div className="my-2 p-3 rounded-xl bg-slate-950 font-mono text-xs border border-slate-800 text-emerald-400 overflow-x-auto whitespace-pre">
                        {msg.codeSnippet}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {msg.sender === 'teacher' && msg.audioUrl && (
                      <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center gap-2">
                        <button
                          onClick={() => playTeacherVoice(msg.audioUrl)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-[11px] text-indigo-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          <span>Replay Teacher Voice</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loadingResponse && (
                <div className="flex gap-3 justify-start">
                  <div className="glass-panel p-4 rounded-2xl border border-slate-700 flex items-center gap-2 text-xs text-purple-300">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                    <span>{selectedSubject?.teacherName} is formulating the step-by-step explanation...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Code editor accordion */}
            {showCodeEditor && (
              <div className="mt-3 glass-panel p-3 rounded-xl border border-indigo-500/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    Paste Code / Markup for Line-by-Line Review
                  </span>
                  <button
                    onClick={() => setShowCodeEditor(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close Editor
                  </button>
                </div>
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Paste your HTML, JavaScript, Python, or SQL snippet here..."
                  className="w-full h-24 p-2.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}

            {/* Image Preview bar */}
            {imagePreview && (
              <div className="mt-2 glass-panel p-2 rounded-xl flex items-center justify-between border border-purple-500/30">
                <div className="flex items-center gap-2">
                  <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                  <span className="text-xs text-slate-300">Screenshot attached for error analysis</span>
                </div>
                <button
                  onClick={() => setImagePreview(null)}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Input & Voice Toolbar */}
            <div className="mt-3 glass-panel p-2.5 rounded-2xl border border-slate-800 flex items-center gap-2">
              {/* Mic Speech Button */}
              <button
                onClick={handleMicToggle}
                className={`p-3 rounded-xl transition-all cursor-pointer ${isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300'
                  }`}
                title={isRecording ? 'Listening... click to stop' : 'Ask question by speaking'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Upload image button */}
              <label className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors" title="Upload screenshot / question photo">
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {/* Code snippet button */}
              <button
                onClick={() => setShowCodeEditor(!showCodeEditor)}
                className={`p-3 rounded-xl transition-colors cursor-pointer ${showCodeEditor ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                title="Paste code snippet"
              >
                <Code className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isRecording ? "Listening to your voice..." : `Ask ${selectedSubject?.teacherName || 'teacher'} any doubt in ${selectedSection}...`}
                className="flex-1 bg-transparent px-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
              />

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={loadingResponse || (!inputText.trim() && !codeSnippet.trim() && !imagePreview)}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-purple-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: ADMIN PORTAL */}
        {activeTab === 'admin' && (
          <div className="max-w-5xl mx-auto px-6 py-8 w-full flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-indigo-400" />
                  Admin Teacher & Voice Configuration
                </h2>
                <p className="text-xs text-slate-400">
                  Assign individual authorized teacher voice profiles, customize faculty pictures, and manage subject sections.
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Protected Admin Console
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Subject selector sidebar */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Faculties</h3>
                {subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setAdminSelectedSubject(s.id);
                      setAdminTeacherName(s.teacherName);
                      setAdminTeacherRole(s.teacherRole);
                      setAdminTeacherImage(s.teacherImage);
                      setAdminVoiceName(s.voiceConfig?.voiceName || '');
                      setAdminSaveStatus('');
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${adminSelectedSubject === s.id ? 'bg-indigo-600 text-white shadow-md' : 'glass-card hover:bg-slate-800 text-slate-300'
                      }`}
                  >
                    <img src={s.teacherImage} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <div>{s.name}</div>
                      <div className="text-[10px] opacity-75 font-normal">{s.teacherName}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Editor panel */}
              <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
                  <img src={adminTeacherImage} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500" />
                  <div>
                    <h4 className="text-base font-bold text-white">{adminTeacherName}</h4>
                    <p className="text-xs text-indigo-400">{adminTeacherRole}</p>
                    <span className="text-[10px] text-slate-400">Subject: {subjects.find(s => s.id === adminSelectedSubject)?.name}</span>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Teacher Full Name</label>
                    <input
                      type="text"
                      value={adminTeacherName}
                      onChange={(e) => setAdminTeacherName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Teacher Role / Designation</label>
                    <input
                      type="text"
                      value={adminTeacherRole}
                      onChange={(e) => setAdminTeacherRole(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Teacher Profile Picture URL</label>
                    <input
                      type="text"
                      value={adminTeacherImage}
                      onChange={(e) => setAdminTeacherImage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Voice Configuration */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-indigo-400" />
                        ElevenLabs & Voice Engine
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        {elevenLabsApiKey ? 'ELEVENLABS CONNECTED' : 'CLEARED VOICE READY'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">ElevenLabs API Key (Optional for instant live voice cloning)</label>
                      <input
                        type="password"
                        placeholder="xi-api-key..."
                        value={elevenLabsApiKey}
                        onChange={(e) => {
                          setElevenLabsApiKey(e.target.value);
                          localStorage.setItem('niat_elevenlabs_key', e.target.value);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">If left empty, the platform seamlessly uses your uploaded master studio audio.</p>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Voice Profile Label</label>
                      <input
                        type="text"
                        value={adminVoiceName}
                        onChange={(e) => setAdminVoiceName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                      />
                    </div>

                    <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-[11px] text-indigo-200 flex items-center justify-between">
                      <span>Audio Source: /uploads/audio/teacher_agent_voice.mp3</span>
                      <button
                        onClick={() => playTeacherVoice('/uploads/audio/teacher_agent_voice.mp3')}
                        className="px-2 py-1 bg-indigo-600 rounded text-[10px] font-bold text-white hover:bg-indigo-500 cursor-pointer"
                      >
                        Play Voice
                      </button>
                    </div>
                  </div>
                </div>

                {adminSaveStatus && (
                  <p className="text-xs text-emerald-400 font-medium">{adminSaveStatus}</p>
                )}

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    onClick={handleAdminSave}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    Save Teacher & Voice Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        NIAT STUDENTS – AI Voice Doubt Clarification Platform © 2026. Built exclusively for NIAT student success.
      </footer>
    </div>
  );
}

export default App;

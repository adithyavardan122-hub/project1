import React from 'react';
import { Mic, MicOff, Volume2, Pause, Sparkles, Terminal } from './icons';

interface MayaAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isAgentLive?: boolean;
  teacherName: string;
  teacherImage: string;
  subjectName: string;
  statusText: string;
  onToggleMic: () => void;
  onStopVoice: () => void;
  onPreviewVoice: () => void;
  onStartAgentVoice?: () => void;
}

export const MayaInteractiveAvatar: React.FC<MayaAvatarProps> = ({
  isSpeaking,
  isListening,
  isAgentLive = false,
  teacherName,
  teacherImage,
  subjectName,
  statusText,
  onToggleMic,
  onStopVoice,
  onPreviewVoice,
  onStartAgentVoice
}) => {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-purple-500/30 shadow-2xl shadow-purple-950/40 flex flex-col items-center justify-center text-center">
      {/* Background radial glow */}
      <div className={`absolute -inset-10 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
        isSpeaking 
          ? 'bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-pink-600/30 opacity-100 scale-110' 
          : isListening 
          ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/25 opacity-100 scale-105' 
          : 'bg-purple-900/10 opacity-40 scale-100'
      }`}></div>

      {/* Pulsing Concentric Energy Rings when speaking (Maya-style presence) */}
      <div className="relative mb-6">
        {/* Ring 3 */}
        <div className={`absolute -inset-8 rounded-full border border-purple-500/20 transition-all duration-1000 ${
          isSpeaking ? 'scale-125 opacity-80 animate-ping' : 'scale-100 opacity-0'
        }`}></div>

        {/* Ring 2 */}
        <div className={`absolute -inset-4 rounded-full border-2 border-indigo-500/30 transition-all duration-700 ${
          isSpeaking ? 'scale-110 opacity-90 animate-pulse' : isListening ? 'scale-105 border-emerald-500/40 animate-pulse' : 'scale-100 opacity-20'
        }`}></div>

        {/* Ring 1 - Aura ring */}
        <div className={`absolute -inset-1.5 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 transition-all duration-500 ${
          isSpeaking ? 'opacity-100 blur-sm animate-pulse' : isListening ? 'from-emerald-400 to-teal-500 opacity-90 blur-sm' : 'opacity-40'
        }`}></div>

        {/* Avatar Image with dynamic border */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden p-1 bg-slate-950">
          <img 
            src={teacherImage} 
            alt={teacherName} 
            className={`w-full h-full rounded-full object-cover transition-transform duration-500 ${
              isSpeaking ? 'scale-105' : 'scale-100'
            }`} 
          />
          
          {/* Live Audio Glow Overlay */}
          {isSpeaking && (
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-transparent flex items-end justify-center pb-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-200 bg-purple-900/80 px-2 py-0.5 rounded-full border border-purple-400/40">
                Speaking Now
              </span>
            </div>
          )}

          {isListening && (
            <div className="absolute inset-0 bg-emerald-950/50 flex items-center justify-center">
              <span className="text-[11px] font-bold text-emerald-200 animate-pulse">
                Listening...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Teacher / Maya Identity */}
      <div className="relative z-10 max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Live Conversational AI Faculty</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
          {teacherName}
        </h2>
        <p className="text-xs sm:text-sm text-indigo-300 font-medium mb-3">
          {subjectName} • Continuous Real-Time Voice Clarification
        </p>

        {/* Dynamic Status / Subtitle Bar */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 min-h-[44px] flex items-center justify-center mb-6">
          {isSpeaking ? (
            <div className="flex items-center gap-3">
              <span className="text-purple-300 font-medium">Clear voice streaming live:</span>
              <div className="flex items-center gap-1">
                <span className="w-1 bg-purple-400 rounded-full wave-bar h-6"></span>
                <span className="w-1 bg-indigo-400 rounded-full wave-bar h-8"></span>
                <span className="w-1 bg-pink-400 rounded-full wave-bar h-5"></span>
                <span className="w-1 bg-purple-300 rounded-full wave-bar h-7"></span>
                <span className="w-1 bg-indigo-300 rounded-full wave-bar h-4"></span>
              </div>
            </div>
          ) : isListening ? (
            <span className="text-emerald-400 font-medium flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              Listening to your doubt... Speak freely like in a live class!
            </span>
          ) : (
            <span>{statusText || "Press the microphone below to talk directly with your teacher."}</span>
          )}
        </div>

        {/* Real-time Voice Interaction Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onStartAgentVoice && (
            <button
              onClick={onStartAgentVoice}
              className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isAgentLive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 hover:scale-105'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>{isAgentLive ? 'End ElevenLabs Live Agent' : 'Start ElevenLabs Live Voice Agent'}</span>
            </button>
          )}

          <button
            onClick={onToggleMic}
            className={`px-5 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 hover:scale-105'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? 'Stop Listening' : 'Tap to Talk (Live Mic)'}</span>
          </button>

          {isSpeaking ? (
            <button
              onClick={onStopVoice}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer border border-slate-700"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Voice</span>
            </button>
          ) : (
            <button
              onClick={onPreviewVoice}
              className="px-4 py-3 rounded-2xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-semibold text-xs flex items-center gap-2 cursor-pointer border border-indigo-700/60"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Sujan Sir's Master Audio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


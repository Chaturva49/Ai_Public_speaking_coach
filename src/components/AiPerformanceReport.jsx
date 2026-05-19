import { X, CheckCircle2, TrendingUp, AlertTriangle, FileText, Volume2, Loader2, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AiPerformanceReport({ onClose, confidenceScore, insights, transcript, isHistoryView, language = 'en-US' }) {
  
  const [playingIdx, setPlayingIdx] = useState(null);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    // Load voices for TTS
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const playAudio = (text, idx) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a voice matching the language code (e.g., "te-IN" -> "te")
      const langPrefix = language.split('-')[0];
      const matchingVoice = voices.find(v => v.lang.startsWith(langPrefix));
      
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      } else {
        // Fallback to setting just the lang attribute and letting the OS decide
        utterance.lang = language;
      }
      
      utterance.rate = 0.9; // Slightly slower for clarity
      
      utterance.onstart = () => setPlayingIdx(idx);
      utterance.onend = () => setPlayingIdx(null);
      utterance.onerror = () => setPlayingIdx(null);
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const handleClose = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl shadow-2xl border border-gray-200 dark:border-slate-700 rounded-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700/80 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {isHistoryView ? 'Historical Aura AI Analysis' : 'Aura AI Communication Analysis'}
              </h2>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white dark:bg-slate-800 hide-scrollbar">
          {insights ? (
            <div className="space-y-8">
              
              {/* Full Transcript (Visible in History View) */}
              {isHistoryView && transcript && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <FileText size={16} className="text-slate-400" />
                    Original Transcript
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700 rounded-xl p-5 text-[15px] font-mono leading-relaxed text-slate-600 dark:text-slate-300">
                    "{transcript}"
                  </div>
                </section>
              )}

              {/* Strengths Section */}
              {insights.strengths && insights.strengths.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <TrendingUp size={16} className="text-emerald-500" />
                    Validations & Strengths
                  </h3>
                  <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-5">
                    <ul className="space-y-3">
                      {insights.strengths.map((strength, i) => (
                        <li key={i} className="text-[15px] flex items-start gap-3 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Corrections Table */}
              <section>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <AlertTriangle size={16} className="text-orange-500" />
                  Constructive Feedback
                </h3>
                
                {insights.corrections && insights.corrections.length > 0 ? (
                  <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[15px]">
                        <thead className="bg-gray-50 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-4 font-semibold w-1/3 text-sm">What you said (Mistake)</th>
                            <th className="px-6 py-4 font-semibold w-1/3 text-sm">How to say it better (Suggestion)</th>
                            <th className="px-6 py-4 font-semibold w-1/3 text-sm">Why this is better</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                          {insights.corrections.map((corr, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-5 align-top border-r border-gray-100 dark:border-slate-700/50">
                                <div className="inline-flex items-center gap-1.5 font-medium text-[11px] uppercase tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400 px-2 py-0.5 rounded-md mb-2">{corr.mistakeType || 'Error'}</div>
                                <div className="font-mono text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-500">"{corr.original}"</div>
                              </td>
                              <td className="px-6 py-5 align-top border-r border-gray-100 dark:border-slate-700/50 relative group">
                                <div className="font-medium text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">Better Option</div>
                                <div className="font-medium text-slate-800 dark:text-slate-200 pr-10">"{corr.suggestion}"</div>
                                <button 
                                  onClick={() => playAudio(corr.suggestion, idx)}
                                  className={`absolute top-5 right-4 p-2 rounded-full border border-gray-200 dark:border-slate-600 shadow-sm transition-all ${
                                    playingIdx === idx 
                                    ? 'bg-indigo-600 text-white border-transparent' 
                                    : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-200 dark:hover:text-indigo-400'
                                  }`}
                                  title="Listen to pronunciation"
                                >
                                  {playingIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                                </button>
                              </td>
                              <td className="px-6 py-5 align-top text-slate-600 dark:text-slate-400">
                                {corr.explanation}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl">
                    <CheckCircle2 size={32} className="text-emerald-400 mb-3" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium text-center">
                      Great job! No major grammatical or lexical issues detected in this session.
                    </span>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 opacity-60">
              <Info size={48} className="text-slate-300 mb-4" />
              <div className="text-[15px] font-medium text-slate-500">
                Analysis unavailable. API Key may be missing.
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700/80 flex justify-end bg-gray-50/50 dark:bg-slate-800">
          <button 
            onClick={handleClose}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Mic, UploadCloud, Loader2, Globe, Target } from 'lucide-react';

const FILLER_WORDS = ['um', 'uh', 'like', 'so', 'basically', 'actually', 'literally', 'you', 'know'];

export default function PracticeStudio({ 
  sessionStatus, 
  setSessionStatus, 
  handleEndSession, 
  handleFileUpload,
  language,
  setLanguage,
  speechContext,
  setSpeechContext
}) {
  const isRecording = sessionStatus === 'recording';
  const fileInputRef = useRef(null);
  
  // Speech Recognition state
  const [transcript, setTranscript] = useState('');
  const [words, setWords] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let fullSessionTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullSessionTranscript += event.results[i][0].transcript;
        }

        setTranscript(fullSessionTranscript);
        
        const allWords = fullSessionTranscript.split(/\s+/).filter(w => w.length > 0).map(word => {
          const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
          if (FILLER_WORDS.includes(cleanWord)) {
            return { word: word + ' ', type: 'filler' };
          }
          return { word: word + ' ', type: 'normal' };
        });
        
        setWords(allWords);
      };

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // If it stops unexpectedly while supposed to be recording (e.g., pause), we could handle it,
        // but for now we just reflect the actual mic state.
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  // Sync language with Web Speech API
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  useEffect(() => {
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // already started
      }
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isRecording]);

  const onEndClick = () => {
    handleEndSession(transcript);
    setTranscript('');
    setWords([]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Voice Practice Module */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 flex flex-col min-h-[220px] shadow-sm">
        <div className="w-full flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Mic size={18} className="text-indigo-500" />
            Input Source
          </h2>
          {isRecording && (
            isListening ? (
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md animate-pulse">Recording</span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md animate-pulse">Starting Mic...</span>
            )
          )}
        </div>

        {/* HCAI Context Configuration */}
        {sessionStatus === 'idle' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Globe size={14} /> Spoken Language
              </label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
              >
                <option value="en-US">English (Global)</option>
                <option value="en-IN">English (India)</option>
                <option value="te-IN">Telugu (India)</option>
                <option value="kn-IN">Kannada (India)</option>
                <option value="hi-IN">Hindi (India)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Target size={14} /> Context / Goal
              </label>
              <select 
                value={speechContext}
                onChange={(e) => setSpeechContext(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
              >
                <option value="Casual Conversation">Casual Conversation</option>
                <option value="Job Interview">Job Interview</option>
                <option value="Public Presentation">Public Presentation</option>
                <option value="Customer Support">Customer Support</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center gap-3 w-full mt-auto">
          {sessionStatus === 'idle' || sessionStatus === 'paused' ? (
            <div className="flex gap-3">
              <button 
                onClick={() => setSessionStatus('recording')}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
              >
                <Play size={16} fill="currentColor" />
                {sessionStatus === 'idle' ? 'Start Microphone' : 'Resume'}
              </button>
              {sessionStatus === 'idle' && (
                <>
                  <input 
                    type="file" 
                    accept="audio/*,video/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-semibold text-sm border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    <UploadCloud size={16} />
                    Upload File
                  </button>
                </>
              )}
            </div>
          ) : sessionStatus === 'analyzing_file' || sessionStatus === 'analyzing' ? (
            <div className="flex w-full justify-center items-center gap-3 px-6 py-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-xl font-medium text-sm border border-indigo-100 dark:border-indigo-500/20">
              <Loader2 size={18} className="animate-spin" />
              Running Aura AI Analysis...
            </div>
          ) : (
            <button 
              onClick={() => setSessionStatus('paused')}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-semibold text-sm border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <Pause size={16} fill="currentColor" />
              Pause Recording
            </button>
          )}

          {(sessionStatus === 'recording' || sessionStatus === 'paused') && (
            <button 
              onClick={onEndClick}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
            >
              <Square size={16} fill="currentColor" />
              Stop & Analyze
            </button>
          )}
        </div>
      </div>

      {/* Live Teleprompter Transcript */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 flex-1 flex flex-col min-h-[300px] shadow-sm">
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 p-4 px-6">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Transcript Buffer</h3>
          <div className="flex gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span> Filler Word
            </div>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto hide-scrollbar text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {(sessionStatus === 'recording' || sessionStatus === 'paused') ? (
            words.length > 0 ? (
              words.map((t, i) => (
                <span 
                  key={i} 
                  className={`inline-block mr-1 transition-colors ${
                    t.type === 'filler' ? "text-orange-500 dark:text-orange-400 font-medium underline decoration-orange-200 dark:decoration-orange-900 decoration-2 underline-offset-4" : ""
                  }`}
                >
                  {t.word}
                </span>
              ))
            ) : (
               <span className="italic opacity-50">Waiting for audio input...</span>
            )
          ) : sessionStatus === 'analyzing_file' || sessionStatus === 'analyzing' ? (
            <span className="flex items-center gap-2 opacity-60 text-indigo-600 dark:text-indigo-400 font-medium">
              <Loader2 size={16} className="animate-spin"/> Parsing buffer text...
            </span>
          ) : (
            <span className="italic opacity-50">Buffer is empty. Ready to record.</span>
          )}
        </div>
      </div>
    </div>
  );
}

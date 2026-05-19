import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Loader2, Volume2, X } from 'lucide-react';
import { chatWithCoach } from '../lib/gemini';
import { useNavigate, useParams } from 'react-router-dom';

export default function AiCoachChat({ language, setLanguage, speechContext, onSaveChat, aiSessions }) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Try to load existing session
  const existingSession = aiSessions?.find(s => s.id === id);
  
  const [messages, setMessages] = useState(
    existingSession ? existingSession.messages : [
      { role: 'ai', content: `Hello! I am Aura, your AI Communication Mentor (Session: ${id}). We are practicing for a ${speechContext}. How can I help you today?` }
    ]
  );
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    // Setup Speech Recognition for voice input
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [language]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = language.split('-')[0];
      const matchingVoice = voices.find(v => v.lang.startsWith(langPrefix));
      
      if (matchingVoice) utterance.voice = matchingVoice;
      else utterance.lang = language;

      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (textToSubmit) => {
    const text = textToSubmit || inputText;
    if (!text.trim()) return;

    const newHistory = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const aiResponse = await chatWithCoach(newHistory, language, speechContext);
    
    setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    setIsLoading(false);
    
    speakText(aiResponse);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch(e) {
        console.error(e);
      }
    }
  };

  const handleClose = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (isRecording) recognitionRef.current?.stop();
    
    // Save chat when leaving
    if (onSaveChat && !existingSession) {
      onSaveChat(id, messages, speechContext, language);
    }
    
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans">
      <div className="w-full h-screen max-w-4xl mx-auto flex flex-col bg-white dark:bg-slate-800 shadow-xl shadow-gray-200/50 dark:shadow-none border-x border-gray-100 dark:border-slate-700/50">
        
        {/* Chat Header */}
        <div className="p-4 px-6 border-b border-gray-100 dark:border-slate-700/50 flex justify-between items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 relative">
                <Volume2 size={20} className={isSpeaking ? "animate-pulse" : ""} />
                {isSpeaking && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>}
              </div>
              Aura AI Coach
            </h2>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-4">
              <span>Context: {speechContext}</span>
              {!existingSession && (
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 ring-indigo-500/20 transition-all text-xs"
                >
                  <option value="en-US">English (Global)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="te-IN">Telugu</option>
                  <option value="kn-IN">Kannada</option>
                  <option value="hi-IN">Hindi</option>
                </select>
              )}
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] md:max-w-[70%] p-5 text-sm md:text-[15px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 rounded-2xl rounded-tr-sm border border-gray-200 dark:border-slate-600/50' 
                  : 'bg-indigo-600 text-white dark:bg-indigo-500/20 dark:text-indigo-100 rounded-2xl rounded-tl-sm border border-indigo-700 dark:border-indigo-500/30'
                }`}
              >
                {msg.role === 'ai' && (
                  <div className="text-xs font-semibold mb-2 flex items-center gap-2 opacity-90 text-indigo-100 dark:text-indigo-300">
                    Aura AI 
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="max-w-[70%] p-5 bg-white text-slate-800 dark:bg-slate-700/50 dark:text-slate-300 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-slate-600/50">
                 <Loader2 size={18} className="animate-spin text-indigo-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 md:p-6 border-t border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800">
          <div className="max-w-3xl mx-auto flex gap-3 relative items-end">
            <div className="flex-1 relative">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask a question or discuss a topic..."
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl p-4 pr-12 min-h-[60px] max-h-[200px] resize-none outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                disabled={isLoading || isRecording}
                rows={1}
              />
            </div>
            
            <button 
              onClick={toggleRecording}
              className={`p-4 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 ${
                isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'
              }`}
              title="Speak"
              disabled={isLoading}
            >
              <Mic size={22} />
            </button>

            <button 
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputText.trim()}
              className="p-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              title="Send Text"
            >
              <Send size={22} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

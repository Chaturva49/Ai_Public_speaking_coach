import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PracticeStudio from './components/PracticeStudio';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AiPerformanceReport from './components/AiPerformanceReport';
import SessionHistory from './components/SessionHistory';
import AiCoachChat from './components/AiCoachChat';
import { Mic, Moon, Sun, Menu, X, MessageCircle } from 'lucide-react';
import { analyzeSpeech } from './lib/gemini';

function App() {
  const [sessionStatus, setSessionStatus] = useState('idle'); // idle, recording, paused, analyzing, report
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // HCAI Context State
  const [language, setLanguage] = useState('en-IN');
  const [speechContext, setSpeechContext] = useState('Casual Conversation');

  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Analytics State
  const [activeTranscript, setActiveTranscript] = useState('');
  const [fillerWords, setFillerWords] = useState([]);
  const [paceData, setPaceData] = useState([]);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [insights, setInsights] = useState(null);
  
  const [viewingHistoryIndex, setViewingHistoryIndex] = useState(null);
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [aiSessions, setAiSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_ai_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('aura_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('aura_ai_sessions', JSON.stringify(aiSessions));
  }, [aiSessions]);

  useEffect(() => {
    if (sessionStatus === 'recording') {
      setFillerWords([]);
      setPaceData([]);
      setConfidenceScore(0);
      setInsights(null);
      setActiveTranscript('');
      setViewingHistoryIndex(null);
    }
  }, [sessionStatus]);

  const handleEndSession = async (transcript) => {
    setSessionStatus('analyzing');
    setActiveTranscript(transcript);
    
    try {
      const evaluation = await analyzeSpeech(transcript, language, speechContext);
      
      if (evaluation.fillerWords) setFillerWords(evaluation.fillerWords);
      if (evaluation.paceData) setPaceData(evaluation.paceData);
      if (evaluation.confidenceScore !== undefined) setConfidenceScore(evaluation.confidenceScore);
      if (evaluation.insights) setInsights(evaluation.insights);
      
      setSessionStatus('report');
    } catch (error) {
      console.error("Error fetching analysis:", error);
      setSessionStatus('report');
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setSessionStatus('analyzing_file');
    setTimeout(() => {
      handleEndSession("Basically, I think we should actually just move forward with the plan. It's literally the best option right now.");
    }, 2000);
  };

  const handleCloseReport = () => {
    if (sessionStatus === 'report') {
      setSessions(prev => [
        { 
          id: Date.now(), 
          date: new Date().toLocaleDateString(), 
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          confidence: confidenceScore, 
          pace: 'Analyzed',
          transcript: activeTranscript,
          fillerWords,
          paceData,
          insights,
          language,
          speechContext
        },
        ...prev
      ]);
    }
    
    setSessionStatus('idle');
    setViewingHistoryIndex(null);
  };
  
  const handleOpenHistory = (index) => {
    setViewingHistoryIndex(index);
    const session = sessions[index];
    if (session) {
      setFillerWords(session.fillerWords || []);
      setPaceData(session.paceData || []);
      setConfidenceScore(session.confidence || 0);
      setInsights(session.insights || null);
      setActiveTranscript(session.transcript || '');
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteHistory = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveAiSession = (id, messages, context, lang) => {
    // Only save if there was actual conversation (more than just the initial greeting)
    if (messages.length > 1) {
      setAiSessions(prev => [{
        id,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        messages,
        speechContext: context,
        language: lang
      }, ...prev]);
    }
  };

  const handleDeleteAiSession = (id) => {
    setAiSessions(prev => prev.filter(s => s.id !== id));
  };

  const openAiCoach = () => {
    const sessionId = Date.now().toString();
    navigate(`/aicoach/${sessionId}`);
  };

  const isReportOpen = sessionStatus === 'report' || viewingHistoryIndex !== null;
  const reportData = viewingHistoryIndex !== null ? sessions[viewingHistoryIndex] : { confidenceScore, fillerWords, insights, transcript: activeTranscript, language };

  const DashboardLayout = (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Menu size={20} />
        </button>
      )}
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'translate-x-0 md:w-72 lg:w-80' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0'} 
          fixed md:relative z-30 w-72 h-full border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none`}
      >
        <div className="p-5 border-b border-gray-100 dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/30 backdrop-blur-md">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
              <Mic size={18} />
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100">Session History</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <SessionHistory 
            sessions={sessions} 
            aiSessions={aiSessions}
            onOpenHistory={handleOpenHistory} 
            onDeleteHistory={handleDeleteHistory}
            onDeleteAiSession={handleDeleteAiSession}
            navigate={navigate}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto w-full relative">
        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
          <header className="mb-8 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="hidden md:flex p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shadow-sm"
                  title="Open Sidebar"
                >
                  <Menu size={20} />
                </button>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Aura AI Coach
                </h1>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Inclusive Communication Analysis</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={openAiCoach}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all font-medium text-sm"
                aria-label="Talk With AI Coach"
              >
                <MessageCircle size={18} />
                <span className="hidden md:inline">AI Coach</span>
              </button>
              
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shadow-sm"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PracticeStudio
              sessionStatus={sessionStatus}
              setSessionStatus={setSessionStatus}
              handleEndSession={handleEndSession}
              handleFileUpload={handleFileUpload}
              language={language}
              setLanguage={setLanguage}
              speechContext={speechContext}
              setSpeechContext={setSpeechContext}
            />
            <AnalyticsDashboard
              fillerWords={fillerWords}
              paceData={paceData}
              confidenceScore={confidenceScore}
            />
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {isReportOpen && (
        <AiPerformanceReport 
          onClose={handleCloseReport} 
          confidenceScore={reportData.confidenceScore} 
          insights={reportData.insights}
          transcript={reportData.transcript}
          isHistoryView={viewingHistoryIndex !== null}
          language={reportData.language}
        />
      )}
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={DashboardLayout} />
      <Route 
        path="/aicoach/:id" 
        element={
          <AiCoachChat 
            language={language} 
            setLanguage={setLanguage}
            speechContext={speechContext} 
            onSaveChat={handleSaveAiSession}
            aiSessions={aiSessions}
          />
        } 
      />
    </Routes>
  );
}

export default App;

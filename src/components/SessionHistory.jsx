import { MessageSquare, Target, Trash2, Mic, Bot } from 'lucide-react';
import { useState } from 'react';

export default function SessionHistory({ sessions, aiSessions, onOpenHistory, onDeleteHistory, onDeleteAiSession, navigate }) {
  const [activeTab, setActiveTab] = useState('speech'); // 'speech' or 'ai'

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('speech')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'speech' 
            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Mic size={14} /> Speech
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'ai' 
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Bot size={14} /> AI Chats
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {activeTab === 'speech' && sessions.map((session, i) => (
          <div 
            key={session.id} 
            className="flex items-stretch bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors"
          >
            <button 
              onClick={() => onOpenHistory(i)}
              className="flex-1 text-left p-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Mic size={12} />
                  Speech #{sessions.length - i}
                </span>
                <span className="text-[10px] font-medium text-slate-400">{session.date}</span>
              </div>
              
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3 truncate pr-4">
                {session.transcript ? `"${session.transcript.substring(0, 40)}${session.transcript.length > 40 ? '...' : ''}"` : 'No transcript recorded.'}
              </div>

              <div className="flex justify-between items-end">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                  <Target size={12} />
                  {session.speechContext === 'Casual Conversation' ? 'Casual' : 
                   session.speechContext === 'Job Interview' ? 'Interview' : 
                   session.speechContext === 'Public Presentation' ? 'Public' : 'Support'}
                </div>
                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                  {session.confidence}%
                </div>
              </div>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteHistory(session.id);
              }}
              className="px-3 border-l border-gray-100 dark:border-slate-700/50 flex flex-col items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
              title="Delete History"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {activeTab === 'ai' && aiSessions.map((session, i) => (
          <div 
            key={session.id} 
            className="flex items-stretch bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors"
          >
            <button 
              onClick={() => navigate(`/aicoach/${session.id}`)}
              className="flex-1 text-left p-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Bot size={12} />
                  Chat #{aiSessions.length - i}
                </span>
                <span className="text-[10px] font-medium text-slate-400">{session.date}</span>
              </div>
              
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3 truncate pr-4">
                {session.messages[session.messages.length - 1]?.content.substring(0, 40)}...
              </div>

              <div className="flex justify-between items-end">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                  <Target size={12} />
                  {session.speechContext === 'Casual Conversation' ? 'Casual' : 
                   session.speechContext === 'Job Interview' ? 'Interview' : 
                   session.speechContext === 'Public Presentation' ? 'Public' : 'Support'}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/30 px-2 py-0.5 rounded-md">
                  {session.messages.length} Msgs
                </div>
              </div>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteAiSession(session.id);
              }}
              className="px-3 border-l border-gray-100 dark:border-slate-700/50 flex flex-col items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
              title="Delete Chat"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {activeTab === 'speech' && sessions.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600">
              <Mic size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No speech history yet. Start a session.
            </span>
          </div>
        )}

        {activeTab === 'ai' && aiSessions.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-indigo-200 dark:text-indigo-900/50">
              <Bot size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No AI chats yet. Talk with Aura.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

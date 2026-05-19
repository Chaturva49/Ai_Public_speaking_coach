import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useEffect, useState } from 'react';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'];
const DARK_COLORS = ['#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#fb7185'];

export default function AnalyticsDashboard({ fillerWords, paceData, confidenceScore }) {
  const gaugeFill = (confidenceScore / 100) * 180;
  
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark class is present
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    
    // Setup observer for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDark();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);
  
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Confidence Gauge */}
        <div className="clean-card p-6 flex flex-col items-center justify-center relative min-h-[220px]">
          <h3 className="text-sm font-semibold mb-8 w-full text-left border-b border-gray-100 dark:border-slate-700 pb-3 text-slate-800 dark:text-slate-200">Confidence Rating</h3>
          <div className="relative w-40 h-20 overflow-hidden">
            {/* Background Arch */}
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-[12px] border-gray-100 dark:border-slate-700 border-b-transparent border-r-transparent transform -rotate-45"></div>
            {/* Filled Arch */}
            <div 
              className="absolute top-0 left-0 w-40 h-40 rounded-full border-[12px] border-indigo-600 dark:border-indigo-500 border-b-transparent border-r-transparent transform -rotate-45 transition-transform duration-1000 ease-out"
              style={{ transform: `rotate(${-45 + gaugeFill}deg)` }}
            ></div>
          </div>
          <div className="text-4xl font-bold mt-4 tracking-tight text-slate-900 dark:text-white">{confidenceScore}<span className="text-xl font-medium text-slate-400 ml-1">%</span></div>
          <div className="text-sm mt-1 font-medium text-slate-500 dark:text-slate-400">
            {confidenceScore > 80 ? 'Optimal' : confidenceScore > 50 ? 'Acceptable' : 'Sub-optimal'}
          </div>
        </div>

        {/* Filler Words Breakdown */}
        <div className="clean-card p-6 min-h-[220px] flex flex-col">
          <h3 className="text-sm font-semibold mb-4 border-b border-gray-100 dark:border-slate-700 pb-3 text-slate-800 dark:text-slate-200">Lexical Friction (Fillers)</h3>
          {(!fillerWords || fillerWords.length === 0) ? (
            <div className="flex-1 flex items-center justify-center text-sm font-medium text-slate-400">
              No filler words detected.
            </div>
          ) : (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fillerWords}
                      innerRadius={35}
                      outerRadius={50}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {fillerWords.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={isDark ? DARK_COLORS[index % DARK_COLORS.length] : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                        borderColor: isDark ? '#334155' : '#f4f4f5', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      itemStyle={{ color: isDark ? '#f1f5f9' : '#334155', fontWeight: '500' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                {fillerWords.map((word, i) => (
                  <div key={word.name} className="text-xs font-medium flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isDark ? DARK_COLORS[i % DARK_COLORS.length] : COLORS[i % COLORS.length] }}></span>
                    {word.name}: <span className="text-slate-400">{word.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Speech Pace Tracker */}
        <div className="clean-card p-6 md:col-span-2">
          <h3 className="text-sm font-semibold mb-6 border-b border-gray-100 dark:border-slate-700 pb-3 text-slate-800 dark:text-slate-200">Delivery Cadence (WPM)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paceData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" stroke={isDark ? "#71717a" : "#a1a1aa"} fontSize={11} tickFormatter={(val) => `${val}s`} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke={isDark ? "#71717a" : "#a1a1aa"} fontSize={11} domain={[0, 200]} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#f4f4f5', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}
                />
                <ReferenceLine y={150} stroke={isDark ? "#3f3f46" : "#e4e4e7"} strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Upper Limit', fill: isDark ? '#71717a' : '#a1a1aa', fontSize: 10, fontWeight: '500' }} />
                <ReferenceLine y={110} stroke={isDark ? "#3f3f46" : "#e4e4e7"} strokeDasharray="4 4" label={{ position: 'insideBottomLeft', value: 'Lower Limit', fill: isDark ? '#71717a' : '#a1a1aa', fontSize: 10, fontWeight: '500' }} />
                <Line 
                  type="monotone" 
                  dataKey="wpm" 
                  stroke={isDark ? "#818cf8" : "#6366f1"} 
                  strokeWidth={3}
                  dot={{ r: 4, fill: isDark ? '#18181b' : '#ffffff', stroke: isDark ? '#818cf8' : '#6366f1', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: isDark ? '#818cf8' : '#6366f1', strokeWidth: 0 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

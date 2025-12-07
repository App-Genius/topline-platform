"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sparkles, ArrowRight, TrendingUp, ThumbsUp, ThumbsDown, RefreshCw, Briefcase } from 'lucide-react';
import { clsx } from 'clsx';

// Mock AI Suggestions based on Industry
const AI_SUGGESTIONS = {
  restaurant: [
    { id: 'ai1', name: 'Suggest Premium Spirits', description: 'When ordering cocktails, suggest specific top-shelf brands.', impact: 'High' },
    { id: 'ai2', name: 'Check-Back at 2 Mins', description: 'Check on table 2 minutes after food delivery to ensure satisfaction/add-ons.', impact: 'Med' },
  ],
  retail: [
    { id: 'ai3', name: 'Companion Item', description: 'If buying paint, suggest brushes or tape.', impact: 'High' },
  ]
};

export default function StrategyPage() {
  const { benchmarks, behaviors, addBehavior, industry } = useApp();
  const [step, setStep] = useState(1);

  // State for adding new AI suggestions
  const [addedSuggestions, setAddedSuggestions] = useState<string[]>([]);

  const handleAddBehavior = (s: any) => {
    addBehavior({
      id: Math.random().toString(36).substr(2, 9),
      name: s.name,
      description: s.description,
      type: 'lead'
    });
    setAddedSuggestions([...addedSuggestions, s.id]);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-pink-500" />
            Weekly Strategy Session
          </h1>
          <p className="text-slate-500">Review last week's performance and calibrate behaviors.</p>
        </div>
        <div className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase">
          {industry} Mode
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 space-y-8">

        {/* Step 1: Review (The "Look Back") */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
            <h2 className="font-bold text-lg">1. Last Week's Performance</h2>
            <span className="text-slate-400 text-sm">Week 42</span>
          </div>
          <div className="p-8 grid grid-cols-3 gap-8">
            <div className="text-center border-r border-slate-100">
              <div className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">Total Revenue</div>
              <div className="text-3xl font-bold text-slate-900">$14,250</div>
              <div className="text-emerald-600 text-sm font-bold mt-1 flex items-center justify-center gap-1">
                <TrendingUp size={14} /> +12% YoY
              </div>
            </div>
            <div className="text-center border-r border-slate-100">
              <div className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">Avg Check</div>
              <div className="text-3xl font-bold text-slate-900">$58.40</div>
              <div className="text-emerald-600 text-sm font-bold mt-1 flex items-center justify-center gap-1">
                <TrendingUp size={14} /> +$6.40 vs Base
              </div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">Behaviors Logged</div>
              <div className="text-3xl font-bold text-blue-600">420</div>
              <div className="text-slate-400 text-sm mt-1">94% Adoption</div>
            </div>
          </div>
        </section>

        {/* Step 2: Behavior Calibration (The "Keep/Drop") */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-lg text-slate-900">2. Behavior Calibration</h2>
            <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              AI Insight: "Suggest Dessert" isn't driving revenue this week.
            </div>
          </div>
          <div className="p-6 space-y-4">
            {behaviors.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-800">{b.name}</h3>
                  <p className="text-sm text-slate-500">{b.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-4">
                    <div className="text-xs font-bold text-slate-400 uppercase">Correlation</div>
                    <div className="font-bold text-emerald-600">Strong</div>
                  </div>
                  <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
                    <ThumbsDown size={18} />
                  </button>
                  <button className="p-2 rounded-lg bg-white border border-emerald-200 text-emerald-600 shadow-sm">
                    <ThumbsUp size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Step 3: AI Suggestions (The "New Ideas") */}
        <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl overflow-hidden text-white relative">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-lg">
               <Sparkles size={20} className="text-yellow-300" />
             </div>
             <div>
               <h2 className="font-bold text-lg">AI Recommendations for Next Week</h2>
               <p className="text-indigo-200 text-sm">Based on your industry ({industry}) and recent trends.</p>
             </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {AI_SUGGESTIONS[industry].map((suggestion) => {
              const isAdded = addedSuggestions.includes(suggestion.id);
              return (
                <div key={suggestion.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/20 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-indigo-500/50 text-xs font-bold px-2 py-1 rounded text-white border border-indigo-400/30">
                      {suggestion.impact} Impact
                    </span>
                    {isAdded ? (
                      <span className="flex items-center gap-1 text-emerald-300 font-bold text-sm">
                        <CheckCircle size={16} /> Added
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleAddBehavior(suggestion)}
                        className="bg-white text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                      >
                        <Plus size={16} /> Add to Rotation
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-xl mb-1">{suggestion.name}</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed">{suggestion.description}</p>
                </div>
              );
            })}
            
            {/* "Ask AI" Placeholder */}
            <div className="bg-indigo-900/40 border border-indigo-500/30 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 hover:bg-indigo-900/60 transition-colors cursor-pointer group">
              <div className="bg-indigo-500/20 p-3 rounded-full group-hover:scale-110 transition-transform">
                 <RefreshCw size={24} className="text-indigo-300" />
              </div>
              <p className="text-indigo-300 text-sm font-medium">Generate New Ideas</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// Icons for inside the component
import { Plus, CheckCircle } from 'lucide-react';

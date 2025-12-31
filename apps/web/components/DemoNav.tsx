"use client";

import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, ClipboardCheck, Smartphone, Settings, LineChart, 
  Sparkles, ChevronUp, ChevronDown, PlayCircle, AlertTriangle, 
  TrendingUp, TrendingDown, X, Menu, UserCircle, Shield, Monitor, PartyPopper, Store, ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { clsx } from 'clsx';

// Persona Definitions
const PERSONAS = [
  {
    id: 'owner',
    label: 'Owner',
    icon: Shield,
    color: 'text-purple-400',
    views: [
      { name: 'Admin DB', href: '/admin', icon: LineChart },
      { name: 'Strategy', href: '/strategy', icon: Sparkles },
      { name: 'Setup', href: '/setup', icon: Settings },
    ],
    scenarios: [
      { id: 'high_performance', label: 'Winning', icon: TrendingUp, color: 'emerald' },
      { id: 'low_adherence', label: 'Losing', icon: TrendingDown, color: 'amber' },
      { id: 'fraud_alert', label: 'Fraud Alert', icon: AlertTriangle, color: 'rose' },
    ]
  },
  {
    id: 'manager',
    label: 'Manager',
    icon: ClipboardCheck,
    color: 'text-emerald-400',
    views: [
      { name: 'Daily Log', href: '/manager', icon: ClipboardCheck },
      { name: 'Review', href: '/strategy', icon: Sparkles },
    ],
    scenarios: [
      { id: 'high_performance', label: 'High Rev Shift', icon: TrendingUp, color: 'emerald' },
      { id: 'low_adherence', label: 'Low Rev Shift', icon: TrendingDown, color: 'amber' },
    ]
  },
  {
    id: 'staff',
    label: 'Staff',
    icon: Smartphone,
    color: 'text-orange-400',
    views: [
      { name: 'Mobile App', href: '/staff', icon: Smartphone },
    ],
    scenarios: [
      { id: 'high_performance', label: 'Top Performer', icon: TrendingUp, color: 'emerald' },
    ]
  },
  {
    id: 'tv',
    label: 'TV Mode',
    icon: Monitor,
    color: 'text-blue-400',
    views: [
      { name: 'Scoreboard', href: '/scoreboard', icon: Users },
    ],
    scenarios: [
      { id: 'celebration', label: 'Trigger Win', icon: PartyPopper, color: 'pink' },
      { id: 'low_adherence', label: 'Show Lagging', icon: TrendingDown, color: 'amber' },
    ]
  }
];

export default function DemoNav() {
  const pathname = usePathname();
  const { triggerScenario, industry, setIndustry } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('owner');

  const activePersona = PERSONAS.find(p => p.id === activeTab) || PERSONAS[0];

  const handleScenario = (type: any) => {
    triggerScenario(type);
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-4">
        <button 
          onClick={() => setIsExpanded(true)}
          className="bg-slate-900 text-white p-3 rounded-full shadow-xl border border-slate-700 hover:scale-110 transition-transform flex items-center gap-2"
        >
          <Menu size={20} />
          <span className="text-xs font-bold pr-1">Demo Controller</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
      
      <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col">
        
        {/* 1. Persona Tabs */}
        <div className="flex items-center bg-slate-950/50 border-b border-white/5 p-1">
          {PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setActiveTab(persona.id)}
              className={clsx(
                "flex-1 py-3 flex flex-col items-center gap-1 transition-all relative",
                activeTab === persona.id ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <persona.icon size={20} className={clsx(activeTab === persona.id ? persona.color : "opacity-50")} />
              <span className="text-[10px] font-bold uppercase tracking-wide">{persona.label}</span>
              {activeTab === persona.id && (
                <div className={clsx("absolute bottom-0 w-12 h-1 rounded-t-full", persona.color.replace('text-', 'bg-'))}></div>
              )}
            </button>
          ))}
          <button 
            onClick={() => setIsExpanded(false)}
            className="p-3 text-slate-500 hover:text-white border-l border-white/5"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {/* 2. Active Persona Controls */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left: Views */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 pl-1">
              Navigate
            </div>
            <div className="flex flex-wrap gap-2">
              {activePersona.views.map(view => {
                const isActive = pathname === view.href;
                return (
                  <Link
                    key={view.href}
                    href={view.href}
                    className={clsx(
                      "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border",
                      isActive 
                        ? "bg-white text-slate-900 border-white shadow-lg scale-105" 
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white"
                    )}
                  >
                    <view.icon size={14} />
                    {view.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Context & Scenarios */}
          <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
            
            {/* Global Context (Only visible on Owner/Manager tabs for relevance) */}
            {(activeTab === 'owner' || activeTab === 'manager') && (
              <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-1 border border-white/5">
                <button 
                  onClick={() => setIndustry('restaurant')}
                  className={clsx(
                    "flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all",
                    industry === 'restaurant' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <Store size={12} /> Restaurant
                </button>
                <button 
                  onClick={() => setIndustry('retail')}
                  className={clsx(
                    "flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all",
                    industry === 'retail' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <ShoppingBag size={12} /> Retail
                </button>
              </div>
            )}

            {/* Scenarios */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 pl-1">
                Simulate State
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activePersona.scenarios.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleScenario(s.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-all text-xs font-medium text-slate-300 group"
                  >
                    <s.icon size={14} className={`text-${s.color}-400 group-hover:text-${s.color}-300`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}



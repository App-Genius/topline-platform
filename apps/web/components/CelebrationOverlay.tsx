"use client";

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Trophy, Sparkles, PartyPopper } from 'lucide-react';

export default function CelebrationOverlay() {
  const { gameState } = useApp();

  if (gameState !== 'celebrating') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute -inset-20 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <Trophy size={180} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
          <PartyPopper size={80} className="absolute -top-4 -right-12 text-pink-400 animate-bounce" />
          <Sparkles size={60} className="absolute -bottom-4 -left-10 text-cyan-400 animate-pulse" />
        </div>
        
        <h1 className="text-6xl font-black text-white mt-8 drop-shadow-2xl tracking-tighter text-center">
          NEW RECORD!
        </h1>
        <p className="text-2xl text-yellow-200 font-bold mt-4 tracking-wide">
          Team Hit $6,000 Revenue Goal!
        </p>
      </div>

      {/* CSS Confetti (Simplified) */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-3 h-3 bg-yellow-500 rounded-full animate-[fall_3s_linear_infinite]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['#facc15', '#ec4899', '#22d3ee', '#a855f7'][Math.floor(Math.random() * 4)]
            }}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Trophy, TrendingUp, TrendingDown, AlertCircle, Star } from 'lucide-react';
import { clsx } from 'clsx';

export default function ScoreboardPage() {
  const { staff, entries, currentDate, benchmarks, gameState } = useApp();

  // Get today's entry
  const todayEntry = entries.find(e => e.date === currentDate);
  const dailyRevenue = todayEntry?.totalRevenue || 0;
  const dailyTarget = Math.round(benchmarks.lastYearRevenue / benchmarks.daysOpen);
  const percentOfGoal = Math.round((dailyRevenue / dailyTarget) * 100);
  
  const isWinning = dailyRevenue >= dailyTarget;

  // Calculate Team Satisfaction (Reputation)
  const dailyReviews = todayEntry?.reviews || [];
  const currentRating = dailyReviews.length > 0
    ? dailyReviews.reduce((sum, r) => sum + r.rating, 0) / dailyReviews.length
    : benchmarks.baselineRating;

  // Process staff data for display
  const staffPerformance = staff
    .filter(s => s.role === 'staff')
    .map(s => {
      const stats = todayEntry?.staffStats.find(stat => stat.staffId === s.id);
      const behaviorCount = stats 
        ? Object.values(stats.behaviorCounts).reduce((a, b) => a + b, 0) 
        : 0;
      
      // Mock Average Check Calculation for the scoreboard if not explicitly tracked per person yet
      // In a real app, this comes from the POS integration or manual entry
      // We'll simulate a variation based on behavior count to show the correlation
      const baseCheck = benchmarks.baselineAvgCheck; 
      const boost = behaviorCount * 1.5; // Behaviors drive check size!
      const simulatedAvgCheck = stats?.avgCheck || (baseCheck + boost + (Math.random() * 5 - 2.5));

      return {
        ...s,
        behaviorCount,
        avgCheck: simulatedAvgCheck,
        revenue: stats?.revenue || 0
      };
    })
    .sort((a, b) => b.avgCheck - a.avgCheck); // Sort by Lag Measure (Outcome)

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Header / Marquee Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Daily Status Card */}
        <div className={clsx(
          "rounded-3xl p-6 flex items-center justify-between border-2 shadow-[0_0_40px_rgba(0,0,0,0.3)] relative overflow-hidden",
          isWinning ? "bg-emerald-900/20 border-emerald-500/50" : "bg-rose-900/20 border-rose-500/50"
        )}>
          <div className="relative z-10">
            <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">
              Today's Revenue
            </div>
            <div className="text-5xl font-black tracking-tighter">
              ${dailyRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-slate-400 text-sm">Target: ${dailyTarget.toLocaleString()}</span>
              <div className={clsx("px-2 py-0.5 rounded text-xs font-bold", isWinning ? "bg-emerald-500 text-black" : "bg-rose-500 text-white")}>
                {percentOfGoal}%
              </div>
            </div>
          </div>
          <div className={clsx("h-16 w-16 rounded-full flex items-center justify-center relative z-10", isWinning ? "bg-emerald-500 text-emerald-950" : "bg-rose-500 text-rose-950")}>
            {isWinning ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
          </div>
        </div>

        {/* Lead Measure Card (Team Behaviors) */}
        <div className="rounded-3xl p-6 bg-slate-900 border border-slate-800 flex flex-col justify-center">
          <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">
            Team Behaviors (Lead)
          </div>
          <div className="flex items-end gap-4">
            <div className="text-5xl font-black text-blue-400">
              {staffPerformance.reduce((acc, s) => acc + s.behaviorCount, 0)}
            </div>
            <div className="text-slate-500 pb-2 text-sm font-medium">
              Total Actions Taken
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full" 
              style={{ width: `${Math.min(staffPerformance.reduce((acc, s) => acc + s.behaviorCount, 0) * 2, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Top Performer Highlight */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 flex items-center gap-6 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-yellow-500/10">
            <Trophy size={120} />
          </div>
          <div className="h-20 w-20 rounded-full bg-yellow-500 flex items-center justify-center text-yellow-950 text-2xl font-bold border-4 border-yellow-600/30 shadow-lg z-10">
            {staffPerformance[0]?.avatar}
          </div>
          <div className="z-10">
            <div className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-1">
              Current Leader
            </div>
            <div className="text-3xl font-bold text-white">
              {staffPerformance[0]?.name}
            </div>
            <div className="text-yellow-200/80 text-sm mt-1">
              ${staffPerformance[0]?.avgCheck.toFixed(2)} Avg Check
            </div>
          </div>
        </div>
      </div>

      {/* The Main Scoreboard Table */}
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-6 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-800">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-4">Team Member</div>
          <div className="col-span-3 text-center">Behaviors (Lead)</div>
          <div className="col-span-4 text-right">Avg Check (Lag)</div>
        </div>

        <div className="divide-y divide-slate-800">
          {staffPerformance.map((member, index) => (
            <div key={member.id} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/5 transition-colors">
              <div className="col-span-1 flex justify-center">
                <div className={clsx(
                  "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                  index === 0 ? "bg-yellow-500 text-black" :
                  index === 1 ? "bg-slate-300 text-black" :
                  index === 2 ? "bg-orange-700 text-white" :
                  "text-slate-500 bg-slate-800"
                )}>
                  {index + 1}
                </div>
              </div>
              
              <div className="col-span-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                  {member.avatar}
                </div>
                <span className="font-bold text-lg">{member.name}</span>
              </div>

              <div className="col-span-3 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-blue-400">{member.behaviorCount}</span>
                <span className="text-[10px] text-slate-600 uppercase">Actions</span>
              </div>

              <div className="col-span-4 text-right">
                <div className="text-2xl font-mono font-bold text-emerald-400">
                  ${member.avgCheck.toFixed(2)}
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600/80">
                  <TrendingUp size={10} />
                  <span>vs Baseline ${benchmarks.baselineAvgCheck.toFixed(0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

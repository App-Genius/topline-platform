"use client";

import React from 'react';
import { useDashboard } from '@/hooks/queries/useDashboard';
import { Trophy, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function ScoreboardPage() {
  const { data, isLoading, error } = useDashboard();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-slate-400">Loading scoreboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400 text-lg">Failed to load scoreboard</p>
          <p className="text-slate-500 mt-2">{error?.message || 'Please try again'}</p>
        </div>
      </div>
    );
  }

  const { gameState, kpis, leaderboard } = data;

  // Determine if winning based on game state
  const isWinning = gameState.status === 'winning' || gameState.status === 'celebrating';
  const dailyRevenue = kpis.revenue.current;
  const dailyTarget = kpis.revenue.target;
  const percentOfGoal = dailyTarget > 0 ? Math.round((dailyRevenue / dailyTarget) * 100) : 0;

  // Process leaderboard for display
  const staffPerformance = leaderboard.map((entry) => ({
    id: entry.userId,
    name: entry.userName,
    avatar: entry.avatar || entry.userName.slice(0, 2).toUpperCase(),
    score: entry.score,
    rank: entry.rank,
  }));

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
              {kpis.behaviors.today}
            </div>
            <div className="text-slate-500 pb-2 text-sm font-medium">
              Today&apos;s Actions
            </div>
          </div>
          <div className="text-slate-600 text-xs mt-2">
            Avg: {kpis.behaviors.average}/day
          </div>
          <div className="w-full bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min((kpis.behaviors.today / Math.max(kpis.behaviors.average, 1)) * 50, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Top Performer Highlight */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 flex items-center gap-6 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-yellow-500/10">
            <Trophy size={120} />
          </div>
          {staffPerformance.length > 0 ? (
            <>
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
                  {staffPerformance[0]?.score.toLocaleString()} points
                </div>
              </div>
            </>
          ) : (
            <div className="z-10">
              <div className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-1">
                Current Leader
              </div>
              <div className="text-xl font-bold text-slate-400">
                No behaviors logged yet
              </div>
            </div>
          )}
        </div>
      </div>

      {/* The Main Scoreboard Table */}
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-6 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-800">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-7">Team Member</div>
          <div className="col-span-4 text-right">Points</div>
        </div>

        {staffPerformance.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {staffPerformance.map((member) => (
              <div key={member.id} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/5 transition-colors">
                <div className="col-span-1 flex justify-center">
                  <div className={clsx(
                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                    member.rank === 1 ? "bg-yellow-500 text-black" :
                    member.rank === 2 ? "bg-slate-300 text-black" :
                    member.rank === 3 ? "bg-orange-700 text-white" :
                    "text-slate-500 bg-slate-800"
                  )}>
                    {member.rank}
                  </div>
                </div>

                <div className="col-span-7 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                    {member.avatar}
                  </div>
                  <span className="font-bold text-lg">{member.name}</span>
                </div>

                <div className="col-span-4 text-right">
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {member.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-600 uppercase">
                    points earned
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-slate-500 text-lg">No behaviors logged yet</div>
            <p className="text-slate-600 text-sm mt-2">
              Start tracking behaviors to see the leaderboard
            </p>
          </div>
        )}
      </div>

      {/* Game Progress Footer */}
      <div className="mt-8 rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Season Progress
            </div>
            <div className="text-white text-lg font-bold mt-1">
              {gameState.percentComplete}% of annual goal
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-xs">
              {gameState.daysRemaining} days remaining
            </div>
            <div className="text-2xl font-bold text-white">
              ${gameState.currentScore.toLocaleString()}
            </div>
            <div className="text-slate-500 text-xs">
              of ${gameState.targetScore.toLocaleString()} target
            </div>
          </div>
        </div>
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all",
              isWinning ? "bg-emerald-500" : "bg-rose-500"
            )}
            style={{ width: `${Math.min(gameState.percentComplete, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

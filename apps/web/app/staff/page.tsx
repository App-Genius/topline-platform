"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBehaviors, useBehaviorLogs, useLogBehavior } from '@/hooks/queries';
import { ScanLine, Check, MessageSquarePlus, TrendingUp, Zap, Sparkles, X, ArrowRight, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function StaffPage() {
  // Real authentication - get the logged-in user
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // Real data from database
  const { data: behaviors = [], isLoading: behaviorsLoading } = useBehaviors();
  const { data: myLogs, isLoading: logsLoading, refetch: refetchLogs } = useBehaviorLogs({
    userId: user?.id,
    limit: 100
  });
  const logBehaviorMutation = useLogBehavior();

  // View State: 'dashboard' | 'log_input' | 'ai_coach'
  const [view, setView] = useState<'dashboard' | 'log_input' | 'ai_coach'>('dashboard');
  const [selectedBehavior, setSelectedBehavior] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Input State
  const [tableNum, setTableNum] = useState('');
  const [checkAmt, setCheckAmt] = useState('');

  // Calculate today's behavior count from real logs
  const today = new Date().toISOString().split('T')[0];
  const todaysLogs = myLogs?.data?.filter(log =>
    log.createdAt && new Date(log.createdAt).toISOString().split('T')[0] === today
  ) ?? [];
  const myTotalBehaviors = todaysLogs.length;

  // Count verified vs pending
  const verifiedCount = todaysLogs.filter(l => l.verified).length;
  const pendingCount = todaysLogs.filter(l => !l.verified).length;

  const handleStartLog = (bId: string) => {
    setSelectedBehavior(bId);
    setView('log_input');
  };

  const handleSubmitLog = () => {
    if (selectedBehavior) {
      logBehaviorMutation.mutate({
        behaviorId: selectedBehavior,
        metadata: {
          tableNumber: tableNum,
          checkAmount: parseFloat(checkAmt) || 0
        }
      }, {
        onSuccess: () => {
          // Reset
          setTableNum('');
          setCheckAmt('');
          setView('dashboard');
          refetchLogs();
        }
      });
    }
  };

  // Loading state
  if (authLoading || behaviorsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Please log in to access the staff page</p>
          <a href="/login" className="text-blue-500 hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-32 font-sans">

      {/* Current User Header */}
      <div className="bg-slate-800/50 backdrop-blur p-4 border-b border-slate-700 sticky top-0 z-20">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-sm">
            {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-bold text-white">{user.name}</div>
            <div className="text-xs text-slate-400">{user.role?.name || 'Staff'}</div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto">
        
        {/* --- VIEW: DASHBOARD --- */}
        {view === 'dashboard' && (
          <>
            {/* AI Nudge Banner */}
            <div 
              onClick={() => setView('ai_coach')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl p-1 shadow-lg mb-6 cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <div className="bg-slate-900/40 rounded-lg p-4 flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-full animate-pulse">
                  <Sparkles size={16} className="text-pink-200" />
                </div>
                <div>
                  <div className="text-xs font-bold text-pink-200 uppercase mb-1">AI Coach Tip</div>
                  <p className="text-sm font-medium text-white">"Hey {user.name.split(' ')[0]}, try suggesting the 'Chef Special' to Table 4. It pairs well with their wine."</p>
                  <div className="mt-2 text-xs text-white/60 flex items-center gap-1">
                    Tap for more tips <ArrowRight size={10} />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <div className="text-slate-400 text-xs font-bold uppercase mb-2">My Actions</div>
                <div className="text-4xl font-black text-white">{myTotalBehaviors}</div>
                <div className="text-xs mt-1 flex items-center gap-2">
                  {verifiedCount > 0 && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={12} /> {verifiedCount} verified
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span className="text-amber-400">{pendingCount} pending</span>
                  )}
                </div>
              </div>
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <div className="text-slate-400 text-xs font-bold uppercase mb-2">Avg Check</div>
                <div className="text-4xl font-black text-emerald-400">$62</div>
                <div className="text-slate-500 text-xs mt-1">Target: $55</div>
              </div>
            </div>

            {/* Action List */}
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 px-1">
              Log Behavior
            </h3>
            <div className="space-y-3 mb-8">
              {behaviors.map(b => {
                const isConfirming = selectedBehavior === b.id;
                const isLogging = logBehaviorMutation.isPending && selectedBehavior === b.id;

                return (
                  <button
                    key={b.id}
                    disabled={isLogging}
                    onClick={() => {
                      if (isConfirming && !isLogging) {
                        // Confirmed - log to real database
                        logBehaviorMutation.mutate({
                          behaviorId: b.id,
                          metadata: {}
                        }, {
                          onSuccess: () => {
                            setSelectedBehavior(null);
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 2000);
                            refetchLogs();
                          }
                        });
                      } else if (!isLogging) {
                        // First tap
                        setSelectedBehavior(b.id);
                        setTimeout(() => setSelectedBehavior(null), 3000); // Auto-reset if not confirmed
                      }
                    }}
                    className={clsx(
                      "w-full rounded-xl p-4 text-left transition-all group relative overflow-hidden",
                      isConfirming 
                        ? "bg-emerald-600 border border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-[1.02]" 
                        : "bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500"
                    )}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <div className={clsx("font-bold text-lg transition-colors", isConfirming ? "text-white" : "text-slate-200 group-hover:text-white")}>
                          {isLogging ? "Logging..." : isConfirming ? "Tap again to Confirm" : b.name}
                        </div>
                        <div className={clsx("text-xs transition-colors", isConfirming ? "text-emerald-100" : "text-slate-500 group-hover:text-slate-400")}>
                           {isLogging ? "Saving to database..." : isConfirming ? "Adding +1 to your score..." : b.description}
                        </div>
                      </div>
                      <div className={clsx(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                        isConfirming ? "bg-white text-emerald-600" : "bg-slate-700 group-hover:bg-blue-600 text-slate-400 group-hover:text-white"
                      )}>
                        {isLogging ? <Loader2 size={16} className="animate-spin" /> : isConfirming ? <Check size={20} /> : <Plus size={16} />}
                      </div>
                    </div>
                    
                    {/* Progress / Timer bar effect for confirmation */}
                    {isConfirming && (
                      <div className="absolute bottom-0 left-0 h-1 bg-emerald-300/50 w-full animate-[shrink_3s_linear_forwards]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scan Receipt */}
            <button className="w-full bg-slate-800/50 border border-dashed border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
              <ScanLine size={20} />
              <span className="text-sm font-medium">Scan Receipt via Camera</span>
            </button>
          </>
        )}

        {/* --- SUCCESS OVERLAY --- */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-emerald-500/90 backdrop-blur text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 animate-in zoom-in duration-200">
              <CheckCircle size={24} className="text-white" />
              <div>
                <div className="font-black text-lg">LOGGED!</div>
                <div className="text-emerald-100 text-xs font-bold">+1 Contribution</div>
              </div>
            </div>
            {/* Mini Confetti */}
            <div className="absolute inset-0 overflow-hidden">
               <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-[ping_1s_ease-out_infinite]"></div>
            </div>
          </div>
        )}

        {/* --- VIEW: AI COACH --- */}
        {view === 'ai_coach' && (
          <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col animate-in fade-in">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
               <h2 className="font-bold text-xl flex items-center gap-2">
                 <Sparkles className="text-pink-500" /> AI Coach
               </h2>
               <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-white">Close</button>
             </div>
             
             <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Daily Nudge */}
                <div className="bg-gradient-to-br from-pink-900/50 to-purple-900/50 border border-pink-500/30 rounded-2xl p-6">
                  <div className="text-pink-300 text-xs font-bold uppercase mb-2">Focus for Today</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Push Desserts 🍰</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    "We noticed your average check is slightly down ($52 vs $55). 
                    Dessert checks are the easiest way to bridge that gap today. Try specifically mentioning the Lava Cake."
                  </p>
                </div>

                {/* Quick Training */}
                <div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase mb-3">Micro-Training</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-4 items-center">
                      <div className="h-12 w-12 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                         <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">The "Sullivan Nod"</div>
                        <div className="text-xs text-slate-400">1 min video • Sales Psychology</div>
                      </div>
                    </div>
                     <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-4 items-center">
                      <div className="h-12 w-12 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                         <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">Upselling Wine without awkwardness</div>
                        <div className="text-xs text-slate-400">2 min video • Service</div>
                      </div>
                    </div>
                  </div>
                </div>

             </div>
          </div>
        )}

      </div>
    </div>
  );
}

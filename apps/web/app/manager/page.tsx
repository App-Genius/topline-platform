"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Save, Plus, DollarSign, Users, CheckCircle, AlertTriangle, Search, FileText, ArrowRight, Star, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export default function ManagerPage() {
  const { currentDate, entries, staff, behaviors, updateEntry, verifyLog } = useApp();

  // Find today's entry or initialize state
  const todayEntry = entries.find(e => e.date === currentDate);
  
  const [revenue, setRevenue] = useState(todayEntry?.totalRevenue?.toString() || '');
  const [covers, setCovers] = useState(todayEntry?.totalCovers?.toString() || '');
  
  // Effect to update local state when global state (scenario) changes
  React.useEffect(() => {
    if (todayEntry) {
      setRevenue(todayEntry.totalRevenue.toString());
      setCovers(todayEntry.totalCovers.toString());
    }
  }, [todayEntry]);
  
  // Local state for verifying staff behaviors
  const [auditMode, setAuditMode] = useState<string | null>(null); // Staff ID
  const [searchQuery, setSearchQuery] = useState('');

  const handleSaveLagMeasures = () => {
    const rev = parseFloat(revenue) || 0;
    const cov = parseFloat(covers) || 0;
    
    const updates = {
      totalRevenue: rev,
      totalCovers: cov,
      verified: true
    };
    updateEntry(currentDate, updates);
    alert("Shift totals updated.");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manager Log & Audit</h1>
          <p className="text-sm text-slate-500">Reconcile Lead Measures (Behaviors) with Lag Measures (Revenue & Reviews).</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded text-xs font-bold border border-emerald-200">
          {new Date(currentDate).toLocaleDateString()}
        </div>
      </div>

      {/* Daily Briefing Link */}
      <div className="bg-emerald-600 text-white px-6 py-3 flex justify-between items-center sticky top-[73px] z-10">
        <div className="text-sm font-medium">
          <span className="text-emerald-200">Start of Shift?</span> Run through today&apos;s briefing with your team.
        </div>
        <Link href="/manager/briefing" className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
          Start Daily Briefing <ArrowRight size={14} />
        </Link>
      </div>

      {/* Verification Queue Link */}
      <div className="bg-amber-50 text-amber-900 px-6 py-3 flex justify-between items-center sticky top-[146px] z-10 border-b border-amber-200">
        <div className="text-sm font-medium">
          <span className="text-amber-600">Pending behaviors?</span> Review and verify staff behavior logs in bulk.
        </div>
        <Link href="/manager/verification" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
          Verification Queue <ArrowRight size={14} />
        </Link>
      </div>

      {/* Weekly Strategy Link */}
      <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center sticky top-[219px] z-10">
        <div className="text-sm font-medium">
          <span className="text-slate-400">End of Week?</span> Review performance and set next week&apos;s behaviors.
        </div>
        <Link href="/strategy" className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
          Start Strategy Session <ArrowRight size={14} />
        </Link>
      </div>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Section 1: Shift Totals (Lag) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700">1. Shift Results</h2>
              <button onClick={handleSaveLagMeasures} className="text-xs font-bold text-blue-600 hover:underline">Save Changes</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Revenue</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><DollarSign size={16}/></span>
                  <input
                    type="number"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-mono text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Covers</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Users size={16}/></span>
                  <input
                    type="number"
                    value={covers}
                    onChange={(e) => setCovers(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-mono text-lg"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                 <div className="text-xs text-blue-500 font-bold uppercase">Calculated Avg Check</div>
                 <div className="text-2xl font-mono font-bold text-blue-700">
                   ${(parseFloat(revenue) > 0 && parseFloat(covers) > 0) ? (parseFloat(revenue) / parseFloat(covers)).toFixed(2) : "0.00"}
                 </div>
              </div>
            </div>
          </div>

          {/* Section 2: Audit Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <FileText size={16} /> Behavior Audit
              </h2>
              {auditMode && (
                <span className="text-xs text-slate-500">
                  Reviewing: <span className="font-bold text-slate-900">{staff.find(s => s.id === auditMode)?.name}</span>
                </span>
              )}
            </div>

            {!auditMode ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12">
                <Search size={48} className="mb-4 opacity-20" />
                <p>Select a staff member from the right to audit their behaviors.</p>
              </div>
            ) : (
              <div className="p-0">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50/50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <div className="col-span-3">Time</div>
                  <div className="col-span-4">Behavior</div>
                  <div className="col-span-2 text-right">Table #</div>
                  <div className="col-span-2 text-right">Check Amt</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {/* Logs */}
                <div className="divide-y divide-slate-100">
                  {todayEntry?.staffStats.find(s => s.staffId === auditMode)?.logs?.map(log => {
                    const behavior = behaviors.find(b => b.id === log.behaviorId);
                    return (
                      <div key={log.id} className={clsx("grid grid-cols-12 gap-4 p-4 items-center text-sm", log.verified ? "bg-emerald-50/30" : "hover:bg-slate-50")}>
                        <div className="col-span-3 font-mono text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="col-span-4 font-medium text-slate-800">
                          {behavior?.name}
                        </div>
                        <div className="col-span-2 text-right font-mono text-slate-600">
                          #{log.metadata?.tableNumber || '-'}
                        </div>
                        <div className="col-span-2 text-right font-mono text-slate-600">
                          ${log.metadata?.checkAmount?.toFixed(2) || '-'}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {log.verified ? (
                            <CheckCircle size={18} className="text-emerald-500" />
                          ) : (
                            <button 
                              onClick={() => verifyLog(currentDate, auditMode, log.id)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs border border-blue-200 hover:border-blue-400 rounded px-2 py-1 transition-colors"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!todayEntry?.staffStats.find(s => s.staffId === auditMode)?.logs?.length) && (
                     <div className="p-8 text-center text-slate-400 italic">No logs found for today.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Staff List & LIVE REVIEWS (Removed as requested) */}
        <div className="space-y-8">
          
          {/* Staff List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-700 text-sm">Staff Summary</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {staff.filter(s => s.role === 'staff').map(member => {
                const stats = todayEntry?.staffStats.find(s => s.staffId === member.id);
                const logs = stats?.logs || [];
                const pending = logs.filter(l => !l.verified).length;
                const total = logs.length;

                return (
                  <button 
                    key={member.id}
                    onClick={() => setAuditMode(member.id)}
                    className={clsx(
                      "w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between",
                      auditMode === member.id ? "bg-blue-50 border-l-4 border-blue-500" : "border-l-4 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                        <div className="text-xs text-slate-500">{total} logs today</div>
                      </div>
                    </div>
                    {pending > 0 ? (
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {pending} Pending
                      </span>
                    ) : (
                       <CheckCircle size={16} className="text-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

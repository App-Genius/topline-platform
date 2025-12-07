"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Calculator, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const { benchmarks, setBenchmark } = useApp();
  const router = useRouter();
  
  const [revenue, setRevenue] = useState(benchmarks.lastYearRevenue.toString());
  const [days, setDays] = useState(benchmarks.daysOpen.toString());
  const [rating, setRating] = useState(benchmarks.baselineRating?.toString() || "4.2");
  const [calculatedAvg, setCalculatedAvg] = useState(0);

  useEffect(() => {
    const rev = parseFloat(revenue) || 0;
    const d = parseFloat(days) || 1;
    setCalculatedAvg(rev / d);
  }, [revenue, days]);

  const handleSave = () => {
    setBenchmark({
      lastYearRevenue: parseFloat(revenue),
      daysOpen: parseFloat(days),
      baselineRating: parseFloat(rating)
    });
    router.push('/scoreboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 pb-24">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calculator size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Establish Your Baseline</h1>
          <p className="text-slate-500 mt-2">
            Enter your historical data to set the benchmarks for your team to beat.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Last Year's Total Revenue
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none font-mono text-lg"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Days Open (Last Year)
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none font-mono text-lg"
              placeholder="365"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer Voice Rating (Baseline)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Star size={16} /></span>
              <input
                type="number"
                step="0.1"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none font-mono text-lg"
                placeholder="4.5"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">We'll use this as the "Quality Guardrail".</p>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 text-white text-center">
            <div className="text-slate-400 text-sm uppercase tracking-wide font-semibold mb-1">
              Daily Revenue Target
            </div>
            <div className="text-3xl font-bold font-mono">
              ${calculatedAvg.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              To beat last year, your team needs to exceed this daily average.
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/30"
          >
            Start Tracking <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

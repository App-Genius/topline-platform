"use client";

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useDashboard } from '@/hooks/queries/useDashboard';
import { useAuth } from '@/context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, AlertTriangle, TrendingUp,
  BrainCircuit, DollarSign, Users, Star, CheckCircle, MessageSquare, Loader2
} from 'lucide-react';
import { clsx } from 'clsx';

export default function AdminPage() {
  const { isAuthenticated } = useAuth();
  const { entries, benchmarks, gameState } = useApp();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch real dashboard data when authenticated
  const timeRangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const { data: dashboardData, isLoading, error } = useDashboard(timeRangeDays);

  // Use real data when available, fallback to mock data for demo mode
  const useRealData = isAuthenticated && dashboardData && !error;

  // Prepare data for charts from mock data (used when not authenticated)
  const chartData = useMemo(() => {
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sorted.map(entry => {
      const totalBehaviors = entry.staffStats.reduce((acc, stat) => {
        return acc + Object.values(stat.behaviorCounts).reduce((sum, val) => sum + val, 0);
      }, 0);

      const avgCheck = entry.totalCovers > 0
        ? entry.totalRevenue / entry.totalCovers
        : 0;

      // Calculate average review score if present, else mock it based on rev
      const dailyReviews = entry.reviews || [];
      const avgReview = dailyReviews.length > 0
        ? dailyReviews.reduce((sum, r) => sum + r.rating, 0) / dailyReviews.length
        : 0;

      return {
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: entry.totalRevenue,
        avgCheck,
        behaviors: totalBehaviors,
        baselineAvg: benchmarks.baselineAvgCheck,
        covers: entry.totalCovers,
        avgReview: avgReview || (avgCheck > 55 ? 4.8 : 3.5),
        reviews: dailyReviews // Pass through reviews for feed
      };
    });
  }, [entries, benchmarks]);

  // KPI Calculations - use real data when available
  const currentData = chartData[chartData.length - 1] || {};
  const totalRevenueLast30 = useRealData
    ? dashboardData.kpis.revenue.current
    : chartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);

  const avgCheckValue = useRealData
    ? dashboardData.kpis.avgCheck.current
    : currentData.avgCheck || 0;

  const avgCheckTrend = useRealData
    ? dashboardData.kpis.avgCheck.trend
    : chartData.length > 1
      ? ((currentData.avgCheck - chartData[0].avgCheck) / chartData[0].avgCheck) * 100
      : 0;

  const baselineAvgCheck = useRealData
    ? dashboardData.kpis.avgCheck.baseline
    : benchmarks.baselineAvgCheck;

  // Quality Metric
  const currentRating = useRealData
    ? dashboardData.kpis.rating.current
    : currentData.avgReview || 4.2;
  const baselineRating = useRealData
    ? dashboardData.kpis.rating.baseline
    : benchmarks.baselineRating;
  const recentReviews = currentData.reviews || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-8 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="text-purple-600" /> 
            Business Intelligence
          </h1>
          <p className="text-xs text-slate-500">Real-time financial & operational analytics</p>
        </div>
        
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={clsx(
                "px-3 py-1 text-xs font-bold rounded-md transition-all",
                timeRange === range ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        
        {/* 1. High-Level KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Revenue (MTD)"
            value={`$${totalRevenueLast30.toLocaleString()}`}
            trend={useRealData ? `${dashboardData.kpis.revenue.trend > 0 ? '+' : ''}${dashboardData.kpis.revenue.trend}%` : '+12%'}
            trendUp={useRealData ? dashboardData.kpis.revenue.trend >= 0 : true}
            icon={DollarSign}
            color="emerald"
            isLoading={isLoading}
          />
          <KpiCard
            title="Avg Check Size"
            value={`$${avgCheckValue.toFixed(2)}`}
            trend={`${avgCheckTrend > 0 ? '+' : ''}${avgCheckTrend.toFixed(1)}%`}
            trendUp={avgCheckTrend > 0}
            icon={TrendingUp}
            color="blue"
            subValue={`vs Baseline $${baselineAvgCheck.toFixed(0)}`}
            isLoading={isLoading}
          />
          <KpiCard
            title="Customer Voice"
            value={currentRating.toFixed(1)}
            subLabel="Google & TripAdvisor"
            trend={currentRating >= baselineRating ? 'Above Target' : 'Below Target'}
            trendUp={currentRating >= baselineRating}
            icon={Star}
            color="yellow"
            isLoading={isLoading}
          />
          <KpiCard
            title="Behavior ROI"
            value={useRealData ? (dashboardData.kpis.behaviors.today > dashboardData.kpis.behaviors.average ? 'High' : 'Normal') : 'High'}
            subLabel={useRealData ? `${dashboardData.kpis.behaviors.today} today` : 'Correlation Strength'}
            trend={useRealData ? `Avg ${dashboardData.kpis.behaviors.average}/day` : 'Optimized'}
            trendUp={true}
            icon={BrainCircuit}
            color="purple"
            isLoading={isLoading}
          />
        </div>

        {/* 2. Main Financial Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Primary Chart: Correlation Engine */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Behavior vs. Revenue Correlation</h3>
                <p className="text-sm text-slate-500">Visualizing the impact of staff efforts (Lead) on outcomes (Lag).</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Effort
                <div className="w-2 h-2 rounded-full bg-emerald-500 ml-2"></div> Revenue
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 11}} stroke="#94a3b8" />
                  <YAxis yAxisId="left" stroke="#94a3b8" tick={{fontSize: 11}} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{fontSize: 11}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue ($)" 
                    fill="url(#colorRev)" 
                    stroke="#10b981" 
                    strokeWidth={3}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="behaviors" 
                    name="Behaviors Logged" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Column: Health & Feedback */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Health Monitor */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Service Health Monitor</h3>
                <p className="text-xs text-slate-500">Balancing Growth vs. Guest Experience</p>
              </div>
              
              <div className="flex-1 flex flex-col justify-center gap-6">
                 {/* Satisfaction Bar */}
                 <div>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="font-bold text-slate-700">Guest Satisfaction</span>
                     <span className={clsx("font-bold", currentRating < 3.5 ? "text-rose-500" : "text-blue-600")}>
                       {currentRating.toFixed(1)} / 5.0
                     </span>
                   </div>
                   <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                     <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" style={{left: `${(baselineRating / 5) * 100}%`}}></div>
                     <div
                        className={clsx("h-full rounded-full transition-all", currentRating < 3.5 ? "bg-rose-500" : "bg-blue-500")}
                        style={{width: `${(currentRating / 5) * 100}%`}}
                     ></div>
                   </div>
                   <p className="text-[10px] text-slate-400 mt-1 text-right">Target: {baselineRating.toFixed(1)}</p>
                 </div>

                 {/* Risk Flag */}
                 <div className={clsx(
                   "rounded-lg p-4 border text-sm font-medium flex items-start gap-3",
                   (currentRating < 3.8 && totalRevenueLast30 > 0) 
                     ? "bg-amber-50 border-amber-200 text-amber-800" 
                     : "bg-emerald-50 border-emerald-200 text-emerald-800"
                 )}>
                   {(currentRating < 3.8 && totalRevenueLast30 > 0) ? (
                     <>
                       <AlertTriangle className="shrink-0 text-amber-500" size={20} />
                       <div>
                         <span className="font-bold block">Churn Risk Detected</span>
                         High revenue but low satisfaction suggests staff may be too aggressive.
                       </div>
                     </>
                   ) : (
                     <>
                       <CheckCircle className="shrink-0 text-emerald-500" size={20} />
                       <div>
                         <span className="font-bold block">Healthy Growth</span>
                         Revenue and satisfaction are trending up together.
                       </div>
                     </>
                   )}
                 </div>
              </div>
            </div>

            {/* Recent Feedback KPI Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 min-h-[200px]">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                  <MessageSquare size={16} /> Recent Feedback
                </h3>
                <span className="text-[10px] font-bold uppercase text-slate-400">Last 24h</span>
              </div>
              <div className="divide-y divide-slate-100">
                {recentReviews.length > 0 ? (
                  recentReviews.map((r, i) => (
                    <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1">
                          {Array.from({length: 5}).map((_, idx) => (
                            <Star key={idx} size={10} className={clsx(idx < r.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200")} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">{r.source}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">"{r.text}"</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    No recent reviews found.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ComponentType<{ size?: number }>;
  color: 'emerald' | 'blue' | 'indigo' | 'purple' | 'yellow';
  subValue?: string;
  subLabel?: string;
  isLoading?: boolean;
}

function KpiCard({ title, value, trend, trendUp, icon: Icon, color, subValue, subLabel, isLoading }: KpiCardProps) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-[140px]">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
              {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
              {subLabel && <p className="text-xs text-slate-400 mt-1">{subLabel}</p>}
            </>
          )}
        </div>
        <div className={clsx("p-3 rounded-lg", colors[color])}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {isLoading ? (
          <div className="h-5 w-20 bg-slate-100 rounded animate-pulse" />
        ) : (
          <>
            <div className={clsx(
              "px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1",
              trendUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            )}>
              {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend}
            </div>
            <span className="text-xs text-slate-400">vs last 30 days</span>
          </>
        )}
      </div>
    </div>
  );
}

function SparklesIcon({className}: {className?: string}) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    )
}

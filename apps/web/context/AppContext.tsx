"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- Types ---

export type Role = 'admin' | 'manager' | 'staff';

export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  avatar: string; // minimal init, maybe initials or color
}

export interface Behavior {
  id: string;
  name: string;
  description: string;
  type: 'lead'; // The input
  target?: number;
}

export interface BehaviorLog {
  id: string;
  staffId: string;
  behaviorId: string;
  timestamp: string;
  metadata?: {
    tableNumber?: string;
    checkAmount?: number;
  };
  verified: boolean; // Manager verification status
}

export interface Review {
  id: string;
  source: 'google' | 'tripadvisor';
  rating: number; // 1-5
  text: string;
  date: string;
}

export interface StaffDailyStat {
  staffId: string;
  behaviorCounts: Record<string, number>; // behaviorId -> count
  avgCheck?: number; // Calculated or input if specific tracking available
  revenue?: number; // Attributed revenue
  logs?: BehaviorLog[]; // Detailed logs for audit
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  totalRevenue: number;
  totalCovers: number;
  staffStats: StaffDailyStat[];
  notes?: string;
  verified: boolean;
  reviews?: Review[]; // New: Daily reviews
}

export interface BenchmarkData {
  lastYearRevenue: number;
  daysOpen: number;
  baselineAvgCheck: number;
  baselineRating: number; // New: Benchmark for quality
}

export interface AppState {
  appName: string;
  currentView: string; // For the demo switcher state if needed, though we might use routes
  currentDate: string; // Simulating "Today"
  
  // Data
  staff: StaffMember[];
  behaviors: Behavior[];
  benchmarks: BenchmarkData;
  entries: DailyEntry[]; // History
  
  // Methods
  addEntry: (entry: DailyEntry) => void;
  updateEntry: (date: string, updates: Partial<DailyEntry>) => void;
  logBehavior: (staffId: string, behaviorId: string, metadata?: { tableNumber?: string; checkAmount?: number }) => void;
  verifyLog: (date: string, staffId: string, logId: string) => void;
  setBenchmark: (data: Partial<BenchmarkData>) => void;
  addBehavior: (behavior: Behavior) => void;
  // Demo Scenarios
  triggerScenario: (type: 'high_performance' | 'low_adherence' | 'fraud_alert' | 'celebration') => void;
  gameState: 'neutral' | 'winning' | 'losing' | 'celebrating';
  industry: 'restaurant' | 'retail';
  setIndustry: (ind: 'restaurant' | 'retail') => void;
}

// --- Initial Mock Data ---

const INITIAL_STAFF: StaffMember[] = [
  { id: 's1', name: 'Joel', role: 'staff', avatar: 'JD' },
  { id: 's2', name: 'Brit', role: 'staff', avatar: 'BR' },
  { id: 's3', name: 'Koen', role: 'staff', avatar: 'KO' },
  { id: 'm1', name: 'Sarah (Mgr)', role: 'manager', avatar: 'SM' },
];

const INITIAL_BEHAVIORS: Behavior[] = [
  { id: 'b1', name: 'Upsell Wine', description: 'Suggest a bottle instead of glass', type: 'lead', target: 5 },
  { id: 'b2', name: 'Suggest Dessert', description: 'Offer dessert menu after main', type: 'lead', target: 10 },
  { id: 'b3', name: 'Sparkling Water', description: 'Offer sparkling/still upon seating', type: 'lead' },
];

const INITIAL_BENCHMARK: BenchmarkData = {
  lastYearRevenue: 600000,
  daysOpen: 312,
  baselineAvgCheck: 52.00,
  baselineRating: 4.2,
};

// Seeded random number generator for deterministic values
// This ensures SSR and client render the same initial values
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate some fake history for charts - uses deterministic seed
const generateHistory = (): DailyEntry[] => {
  const history: DailyEntry[] = [];
  const baseDate = new Date('2023-11-01');
  // Use a fixed date string for initial render to avoid hydration issues
  const todayStr = '2023-11-21'; // Fixed for SSR consistency

  // Create past history (20 days)
  for (let i = 0; i < 20; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    // Use seeded random for deterministic values
    const seed = i * 1000;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseRev = isWeekend ? 4000 : 2500;
    const randomVar = seededRandom(seed) * 1000;
    const totalRevenue = Math.floor(baseRev + randomVar);
    const totalCovers = Math.floor(totalRevenue / (50 + (seededRandom(seed + 1) * 10)));

    history.push({
      date: dateStr,
      totalRevenue,
      totalCovers,
      verified: true,
      reviews: [],
      staffStats: INITIAL_STAFF.filter(s => s.role === 'staff').map((s, sIdx) => ({
        staffId: s.id,
        behaviorCounts: {
          'b1': Math.floor(seededRandom(seed + sIdx * 10) * 5),
          'b2': Math.floor(seededRandom(seed + sIdx * 10 + 1) * 8),
        },
        revenue: Math.floor(totalRevenue / 3),
        logs: []
      }))
    });
  }

  // Create "Today" Entry with DETAILED logs for Manager Audit
  const todayRevenue = 1250;
  const todayCovers = 25;

  history.push({
    date: todayStr,
    totalRevenue: todayRevenue,
    totalCovers: todayCovers,
    verified: false,
    reviews: [
      { id: 'r1', source: 'google', rating: 5, text: "Amazing service! The wine suggestion was perfect.", date: '2023-11-21T12:00:00.000Z' },
      { id: 'r2', source: 'tripadvisor', rating: 4, text: "Good food, slightly slow but friendly.", date: '2023-11-21T14:00:00.000Z' }
    ],
    staffStats: INITIAL_STAFF.filter(s => s.role === 'staff').map((s, sIdx) => {
      const baseSeed = 9000 + sIdx * 100;
      const count = Math.floor(seededRandom(baseSeed) * 4) + 2;
      const logs = Array(count).fill(null).map((_, idx) => ({
        id: `log-${sIdx}-${idx}`, // Deterministic IDs
        staffId: s.id,
        behaviorId: INITIAL_BEHAVIORS[Math.floor(seededRandom(baseSeed + idx) * INITIAL_BEHAVIORS.length)].id,
        timestamp: '2023-11-21T10:00:00.000Z',
        verified: seededRandom(baseSeed + idx + 50) > 0.5,
        metadata: {
          tableNumber: (Math.floor(seededRandom(baseSeed + idx + 100) * 20) + 1).toString(),
          checkAmount: parseFloat((seededRandom(baseSeed + idx + 200) * 100 + 20).toFixed(2))
        }
      }));

      const behaviorCounts: Record<string, number> = {};
      logs.forEach(l => {
        behaviorCounts[l.behaviorId] = (behaviorCounts[l.behaviorId] || 0) + 1;
      });

      return {
        staffId: s.id,
        behaviorCounts,
        revenue: Math.floor(todayRevenue / 3),
        logs
      };
    })
  });

  return history;
};

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Use fixed initial date for SSR, then update to real date client-side
  const [currentDate, setCurrentDate] = useState<string>('2023-11-21');
  const [staff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [behaviors, setBehaviors] = useState<Behavior[]>(INITIAL_BEHAVIORS);
  const [benchmarks, setBenchmarksState] = useState<BenchmarkData>(INITIAL_BENCHMARK);
  const [entries, setEntries] = useState<DailyEntry[]>(generateHistory());
  const [gameState, setGameState] = useState<'neutral' | 'winning' | 'losing' | 'celebrating'>('neutral');
  const [industry, setIndustry] = useState<'restaurant' | 'retail'>('restaurant');

  // Update currentDate to actual date after hydration (client-side only)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (today !== currentDate) {
      setCurrentDate(today);
    }
  }, []);

  const addEntry = (entry: DailyEntry) => {
    setEntries(prev => [...prev, entry]);
  };

  const updateEntry = (date: string, updates: Partial<DailyEntry>) => {
    setEntries(prev => prev.map(e => e.date === date ? { ...e, ...updates } : e));
  };

  // Helper to quickly log a behavior for "today"
  const logBehavior = (staffId: string, behaviorId: string, metadata?: { tableNumber?: string; checkAmount?: number }) => {
    setEntries(prev => {
      const existingIndex = prev.findIndex(e => e.date === currentDate);
      let newEntries = [...prev];
      let entry: DailyEntry;

      if (existingIndex >= 0) {
        entry = { ...newEntries[existingIndex] }; // Clone
        newEntries[existingIndex] = entry;
      } else {
        entry = {
          date: currentDate,
          totalRevenue: 0,
          totalCovers: 0,
          verified: false,
          staffStats: []
        };
        newEntries = [...newEntries, entry];
      }

      // Find staff stats
      let staffStatIndex = entry.staffStats.findIndex(s => s.staffId === staffId);
      if (staffStatIndex === -1) {
        entry.staffStats.push({
          staffId,
          behaviorCounts: {},
          logs: []
        });
        staffStatIndex = entry.staffStats.length - 1;
      }

      const stats = entry.staffStats[staffStatIndex];
      stats.behaviorCounts[behaviorId] = (stats.behaviorCounts[behaviorId] || 0) + 1;
      
      // Add detailed log
      if (!stats.logs) stats.logs = [];
      stats.logs.push({
        id: Math.random().toString(36).substr(2, 9),
        staffId,
        behaviorId,
        timestamp: new Date().toISOString(),
        metadata,
        verified: false
      });

      return newEntries;
    });
  };

  const verifyLog = (date: string, staffId: string, logId: string) => {
    setEntries(prev => prev.map(e => {
      if (e.date !== date) return e;
      return {
        ...e,
        staffStats: e.staffStats.map(s => {
          if (s.staffId !== staffId) return s;
          return {
            ...s,
            logs: s.logs?.map(l => l.id === logId ? { ...l, verified: true } : l)
          };
        })
      };
    }));
  };

  const setBenchmark = (data: Partial<BenchmarkData>) => {
    setBenchmarksState(prev => ({ ...prev, ...data }));
  };

  const addBehavior = (behavior: Behavior) => {
    setBehaviors(prev => [...prev, behavior]);
  };

  // --- Demo Scenario Logic ---
  const triggerScenario = (type: 'high_performance' | 'low_adherence' | 'fraud_alert' | 'celebration') => {
    if (type === 'celebration') {
      setGameState('celebrating');
      triggerScenario('high_performance'); // Set data to winning
      setTimeout(() => setGameState('winning'), 8000); 
      return;
    }

    const baseDate = new Date('2023-11-01');
    const todayStr = new Date().toISOString().split('T')[0];
    let newEntries: DailyEntry[] = [];

    // 1. Re-generate history based on scenario
    for (let i = 0; i < 20; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      let totalRevenue, totalCovers;
      let behaviorMultiplier = 1;

      if (type === 'high_performance') {
        behaviorMultiplier = 1.5;
        totalRevenue = isWeekend ? 6000 : 4000; 
        totalCovers = Math.floor(totalRevenue / 65); 
      } else if (type === 'low_adherence') {
        behaviorMultiplier = 0.3;
        totalRevenue = isWeekend ? 3500 : 2000; 
        totalCovers = Math.floor(totalRevenue / 48);
      } else {
        // Fraud/Default
        behaviorMultiplier = type === 'fraud_alert' ? 2.0 : 1.0;
        const baseRev = isWeekend ? 4000 : 2500;
        totalRevenue = baseRev;
        totalCovers = Math.floor(totalRevenue / 50);
      }

      newEntries.push({
        date: dateStr,
        totalRevenue,
        totalCovers,
        verified: type !== 'fraud_alert', 
        staffStats: INITIAL_STAFF.filter(s => s.role === 'staff').map(s => ({
          staffId: s.id,
          behaviorCounts: {
            'b1': Math.floor(Math.random() * 5 * behaviorMultiplier),
            'b2': Math.floor(Math.random() * 8 * behaviorMultiplier),
          },
          revenue: Math.floor(totalRevenue / 3),
          logs: [] 
        }))
      });
    }
    
    // 2. Create SPECIFIC "Today" entry for immediate impact on Manager/Staff views
    let todayRev = 3000;
    let todayCov = 50;
    let todayMultiplier = 1;
    let todayReviews: Review[] = [];

    if (type === 'high_performance') {
        todayRev = 6500; todayCov = 90; todayMultiplier = 2;
        todayReviews = [
          { id: 'hr1', source: 'google', rating: 5, text: "Best night ever! Joel recommended an amazing Cabernet.", date: new Date().toISOString() },
          { id: 'hr2', source: 'tripadvisor', rating: 5, text: "Service was impeccable. Will return.", date: new Date().toISOString() },
          { id: 'hr3', source: 'google', rating: 5, text: "Great upsell on the dessert, totally worth it.", date: new Date().toISOString() }
        ];
    } else if (type === 'low_adherence') {
        todayRev = 1200; todayCov = 30; todayMultiplier = 0.2;
        todayReviews = [
          { id: 'lr1', source: 'google', rating: 3, text: "Food was okay, but service felt indifferent.", date: new Date().toISOString() }
        ];
    } else if (type === 'fraud_alert') {
        todayRev = 4000; todayCov = 80; todayMultiplier = 1.5;
        // High Rev but BAD Reviews = Pushy/Fraud Risk
        todayReviews = [
          { id: 'fr1', source: 'tripadvisor', rating: 1, text: "Waiter was EXTREMELY pushy about the wine. Ruined the mood.", date: new Date().toISOString() },
          { id: 'fr2', source: 'google', rating: 2, text: "Felt like I was being sold a timeshare, not dinner.", date: new Date().toISOString() }
        ];
    }

    newEntries.push({
        date: todayStr,
        totalRevenue: todayRev,
        totalCovers: todayCov,
        verified: false,
        reviews: todayReviews,
        staffStats: INITIAL_STAFF.filter(s => s.role === 'staff').map(s => {
            // Fraud Injection
            if (type === 'fraud_alert' && s.id === 's1') {
                return {
                    staffId: s.id,
                    revenue: 800,
                    behaviorCounts: { 'b1': 50 },
                    logs: Array(15).fill(null).map(() => ({
                        id: Math.random().toString(),
                        staffId: s.id,
                        behaviorId: 'b1',
                        timestamp: new Date().toISOString(),
                        verified: false,
                        metadata: { tableNumber: '99', checkAmount: 5.00 }
                    }))
                };
            }

            // Normal Generation based on scenario
            const count = Math.floor((Math.random() * 4 + 2) * todayMultiplier);
            const logs = Array(count).fill(null).map(() => ({
                id: Math.random().toString(),
                staffId: s.id,
                behaviorId: INITIAL_BEHAVIORS[0].id,
                timestamp: new Date().toISOString(),
                verified: Math.random() > 0.5,
                metadata: { tableNumber: '1', checkAmount: 50 }
            }));
            const bCounts: any = {};
            logs.forEach(l => bCounts[l.behaviorId] = (bCounts[l.behaviorId] || 0) + 1);

            return {
                staffId: s.id,
                behaviorCounts: bCounts,
                revenue: Math.floor(todayRev/3),
                logs
            };
        })
    });

    setEntries(newEntries);
    
    // Set Game State
    if (type === 'high_performance') setGameState('winning');
    else if (type === 'low_adherence') setGameState('losing');
    else setGameState('neutral');
  };

  return (
    <AppContext.Provider value={{
      appName: 'Topline',
      currentView: 'dashboard',
      currentDate,
      staff,
      behaviors,
      benchmarks,
      entries,
      addEntry,
      updateEntry,
      logBehavior,
      verifyLog,
      setBenchmark,
      addBehavior,
      triggerScenario,
      gameState,
      industry,
      setIndustry
    }}>
      {children}
    </AppContext.Provider>
  );
};


export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

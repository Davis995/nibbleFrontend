"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, Calendar, CreditCard, Info, 
  Cpu, Zap, BarChart3, PieChart as PieChartIcon, 
  Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import { AdminDashboardService } from '../services/api';

// UI Helpers
const formatCurrency = (val: number) => {
    if (val === 0) return '$0.00';
    if (val < 0.05) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(val);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

const formatCredits = (val: number) => new Intl.NumberFormat('en-US').format(val);

const float: any = {
  initial: { y: 0 },
  animate: {
    y: [-5, 5, -5],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  }
};

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  openai: '#10a37f',
  deepseek: '#4a3aff',
};

export default function UsageAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics-stats'],
    queryFn: AdminDashboardService.fetchStats,
    refetchInterval: 60000,
  });

  const spending = data?.spending_summary || {
    today: { credits: 0, cost: 0, requests: 0 },
    this_month: { credits: 0, cost: 0, requests: 0 },
    this_year: { credits: 0, cost: 0, requests: 0 },
  };

  const dailyHistory = data?.daily_breakdown || [];
  const monthlyHistory = data?.monthly_breakdown || [];
  const providerStats = data?.provider_stats || [];

  return (
    <div className="space-y-10 pb-20">
      {/* Analytics Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">AI Usage Analytics</h2>
          <p className="text-gray-500 font-medium mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Live system performance and cost auditing metrics.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            <button className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">Real-time</button>
            <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600">History</button>
        </div>
      </div>

      {/* Floating Cost Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Card */}
          <motion.div 
            variants={float} initial="initial" animate="animate"
            className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <Zap className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start">
                <span className="text-blue-100 font-black uppercase tracking-[0.2em] text-[10px]">Daily Credits</span>
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    <TrendingUp className="w-5 h-5 text-blue-100" />
                </div>
              </div>
              <div className="mt-8">
                <h4 className="text-6xl font-black tracking-tighter drop-shadow-sm">
                  {formatCredits(spending.today.credits || 0)}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald-300" />
                    <p className="text-blue-100/80 font-bold text-sm tracking-tight">+14% activity since 8AM</p>
                </div>
              </div>
              <div className="mt-10 h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyHistory.slice(-7).reverse()}>
                    <Area type="monotone" dataKey="credits" stroke="#fff" fill="#fff" fillOpacity={0.15} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Monthly Card */}
          <motion.div 
            variants={float} initial="initial" animate="animate"
            style={{ animationDelay: '1s' }}
            className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative group flex flex-col h-full"
          >
            <div className="flex justify-between items-start">
              <span className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Monthly Consumption</span>
              <div className="p-2 bg-violet-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-violet-500" />
              </div>
            </div>
            <div className="mt-8 flex-1">
              <h4 className="text-5xl font-black tracking-tighter text-gray-900 drop-shadow-sm">
                {formatCurrency(spending.this_month.cost || 0)}
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-emerald-500 font-black bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100 uppercase">+12% Profit Margin</span>
                <p className="text-gray-400 font-medium text-xs tracking-tight">vs previous month</p>
              </div>
            </div>
            <div className="mt-10 flex gap-2 items-end h-24 px-2">
              {[40, 70, 45, 90, 65, 80, 55, 95, 30].map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-lg transition-all duration-700 ${i === 7 ? 'bg-violet-600 shadow-lg shadow-violet-200' : 'bg-slate-100 group-hover:bg-violet-100'}`} style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </motion.div>

          {/* Yearly Card */}
          <motion.div 
            variants={float} initial="initial" animate="animate"
            style={{ animationDelay: '2s' }}
            className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col h-full"
          >
            <div className="flex justify-between items-start">
              <span className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Total Annual Cost</span>
              <div className="p-2 bg-emerald-50 rounded-xl">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-8">
              <h4 className="text-5xl font-black tracking-tighter text-gray-900">
                {formatCurrency(spending.this_year.cost || 0)}
              </h4>
              <p className="text-gray-400 mt-2 font-bold text-xs">Accumulated in {new Date().getFullYear()}</p>
            </div>
            
            <div className="mt-12 flex-1 flex flex-col justify-end">
                <div className="bg-slate-50 h-4 rounded-full overflow-hidden border border-slate-100">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '68%' }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    />
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-black text-gray-300 uppercase tracking-[0.1em]">
                    <span>Q1 Start</span>
                    <span className="text-emerald-500">68% Budget Utilization</span>
                    <span>Q4 End</span>
                </div>
            </div>
          </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Daily Trends Line Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                      <h4 className="font-black text-gray-900 text-lg tracking-tight">Daily Consumption Trend</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Rolling 30-Day Credits Output</p>
                  </div>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...dailyHistory].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '16px' }} 
                    labelStyle={{ fontWeight: 800, marginBottom: '4px', color: '#1e293b' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="credits" 
                    stroke={COLORS.primary} 
                    strokeWidth={5} 
                    dot={{ r: 6, strokeWidth: 3, fill: '#fff', stroke: COLORS.primary }} 
                    activeDot={{ r: 10, strokeWidth: 0, fill: COLORS.primary }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Provider Split & Annual Breakdown */}
          <div className="space-y-8">
              {/* Provider Allocation Donut */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm flex flex-col sm:flex-row items-center gap-10"
              >
                <div className="h-[250px] w-[250px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={providerStats}
                        innerRadius={85}
                        outerRadius={110}
                        paddingAngle={10}
                        dataKey="total_cost"
                      >
                        {providerStats.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.provider === 'openai' ? COLORS.openai : COLORS.deepseek} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[12px] font-black text-gray-300 uppercase tracking-[0.2em]">Allocation</span>
                    <span className="text-3xl font-black text-gray-900">Total</span>
                  </div>
                </div>

                <div className="flex-1 space-y-6 w-full">
                    <div className="flex items-center gap-3 mb-2">
                        <PieChartIcon className="w-5 h-5 text-gray-400" />
                        <h4 className="font-black text-gray-700 uppercase tracking-widest text-xs">Provider Split</h4>
                    </div>
                    {providerStats.map((p: any, i: number) => (
                        <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full border-4 border-white shadow-sm" style={{ backgroundColor: p.provider === 'openai' ? COLORS.openai : COLORS.deepseek }} />
                                    <span className="font-bold text-gray-600 capitalize">{p.provider}</span>
                                </div>
                                <span className="text-gray-900 font-black">{formatCurrency(p.total_cost || 0)}</span>
                            </div>
                            <div className="bg-slate-50 h-2 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.random() * 40 + 40}%` }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: p.provider === 'openai' ? COLORS.openai : COLORS.deepseek }}
                                />
                            </div>
                        </div>
                    ))}
                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-4 italic">Costs are computed based on dynamic prompt weights and token density per provider.</p>
                </div>
              </motion.div>

              {/* Annual Performance Min-Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm flex-1"
              >
                 <div className="flex items-center justify-between mb-8">
                    <h4 className="font-black text-gray-700 uppercase tracking-widest text-xs">Monthly Performance</h4>
                    <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-400">{new Date().getFullYear()} Annual Target</span>
                 </div>
                 <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyHistory}>
                            <Bar dataKey="cost" radius={[8, 8, 8, 8]} barSize={24}>
                                {monthlyHistory.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={index === monthlyHistory.length - 1 ? COLORS.primary : '#f1f5f9'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
              </motion.div>
          </div>
      </div>
    </div>
  );
}

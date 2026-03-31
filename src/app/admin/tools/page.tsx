"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Layers, Box, CheckCircle, Star, Plus, 
  Settings, ListOrdered, BarChart3, 
  Activity, ShieldCheck, Zap, ArrowRight,
  Info, CreditCard, UserPlus, Receipt
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AdminDashboardService } from './services/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const }
  })
};

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard-stats-main'],
    queryFn: AdminDashboardService.fetchStats,
    refetchInterval: 60000, 
  });

  if (error) {
    console.error('Dashboard fetch error:', error);
  }

  const toolStats = data?.tool_stats || {
    total_categories: 0,
    total_tools: 0,
    active_tools: 0,
    premium_tools: 0,
  };

  const statCards = [
    { title: 'Tool Categories', value: toolStats.total_categories, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/tools/categories' },
    { title: 'Total AI Tools', value: toolStats.total_tools, icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/admin/tools/library' },
    { title: 'Active Services', value: toolStats.active_tools, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/admin/tools/library' },
    { title: 'Premium Modules', value: toolStats.premium_tools, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', link: '/admin/tools/library' },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Dynamic Status Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <ShieldCheck className="w-64 h-64 text-blue-600" />
          </div>
          <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">System Healthy</div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last Update: Just Now</span>
              </div>
              <h2 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Control the future of <span className="text-blue-600">AI Learning.</span>
              </h2>
              <p className="text-lg text-gray-500 font-medium max-w-lg leading-relaxed">
                Welcome back to the command center. Monitor traffic, manage prompt configurations, and audit usage across multiple LLM providers.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                  <Link href="/admin/tools/library" className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                      Manage Library
                  </Link>
                  <Link href="/admin/tools/logs" className="px-8 py-3.5 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                      View System Logs
                  </Link>
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 relative z-10">
              {statCards.map((card, i) => (
                  <motion.div 
                    key={i}
                    custom={i} initial="hidden" animate="visible" variants={fadeInUp}
                    className="p-6 bg-slate-50 border border-white rounded-[2rem] shadow-inner flex flex-col items-center text-center group hover:bg-white hover:shadow-xl transition-all duration-500"
                  >
                      <div className={`p-4 rounded-2xl mb-4 ${card.bg} group-hover:scale-110 transition-transform`}>
                          <card.icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                      <h4 className="text-gray-400 font-black uppercase tracking-widest text-[9px] mb-2">{card.title}</h4>
                      <div className="text-3xl font-black text-gray-900 mb-4">{isLoading ? '...' : card.value}</div>
                      <Link href={card.link} className="text-xs font-bold text-blue-600 bg-white px-4 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-blue-50">
                          View Details
                      </Link>
                  </motion.div>
              ))}
          </div>
      </div>

      {/* Quick Launch / Shortcuts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="p-8 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
          >
              <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl w-fit">
                      <Settings className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Global Settings</h3>
                  <p className="text-sm text-gray-500 font-medium">Configure universal prompt inputs, default providers, and global model weights for the entire platform.</p>
              </div>
              <Link href="/admin/tools/inputs" className="mt-8 flex items-center gap-2 font-black text-[11px] text-blue-600 uppercase tracking-widest hover:gap-4 transition-all">
                  Configure Inputs <ArrowRight className="w-4 h-4" />
              </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
          >
              <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-2xl w-fit">
                      <ListOrdered className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Detailed Logs</h3>
                  <p className="text-sm text-gray-500 font-medium">Audit every user interaction with the system. Monitor tokens, costs, and identify potential high-usage outliers.</p>
              </div>
              <Link href="/admin/tools/logs" className="mt-8 flex items-center gap-2 font-black text-[11px] text-blue-600 uppercase tracking-widest hover:gap-4 transition-all">
                  Audit Logs <ArrowRight className="w-4 h-4" />
              </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="p-8 bg-blue-600 rounded-[2.5rem] shadow-2xl shadow-blue-500/30 flex flex-col justify-between group hover:-translate-y-2 transition-all duration-500"
          >
              <div className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-2xl w-fit backdrop-blur-md">
                      <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Usage Analytics</h3>
                  <p className="text-sm text-blue-100/70 font-medium">Deep-dive into spending trends, provider allocation, and annual credits forecasts with visual charts.</p>
              </div>
              <Link href="/admin/tools/analytics" className="mt-8 flex items-center gap-2 font-black text-[11px] text-white uppercase tracking-widest hover:gap-4 transition-all">
                  Explore Data <ArrowRight className="w-4 h-4" />
              </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
          >
              <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl w-fit">
                      <CreditCard className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Subscription Plans</h3>
                  <p className="text-sm text-gray-500 font-medium">Manage pricing tiers, AI model restrictions, and token quotas for all individual and enterprise accounts.</p>
              </div>
              <Link href="/admin/tools/plans" className="mt-8 flex items-center gap-2 font-black text-[11px] text-blue-600 uppercase tracking-widest hover:gap-4 transition-all">
                  Manage Plans <ArrowRight className="w-4 h-4" />
              </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
          >
              <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-2xl w-fit">
                      <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">User Management</h3>
                  <p className="text-sm text-gray-500 font-medium">Control global user accounts, assign administrative roles, manage school access, and monitor account verification status.</p>
              </div>
              <Link href="/admin/tools/users" className="mt-8 flex items-center gap-2 font-black text-[11px] text-blue-600 uppercase tracking-widest hover:gap-4 transition-all">
                  Manage Users <ArrowRight className="w-4 h-4" />
              </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
          >
              <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl w-fit">
                      <Receipt className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Financial Records</h3>
                  <p className="text-sm text-gray-500 font-medium">Monitor all successful and failed transactions, view detailed invoices, and audit Pesapal IPN receipts for all customer accounts.</p>
              </div>
              <Link href="/admin/tools/payments" className="mt-8 flex items-center gap-2 font-black text-[11px] text-blue-600 uppercase tracking-widest hover:gap-4 transition-all">
                  Manage Payments <ArrowRight className="w-4 h-4" />
              </Link>
          </motion.div>
      </div>

      {/* Recent Activity Mini-Card */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl animate-pulse">
                  <Activity className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                  <h4 className="font-bold text-gray-800 tracking-tight">System Performance Monitor</h4>
                  <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">Average Response: <span className="text-emerald-500 font-black">210ms</span></p>
              </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-2xl group cursor-help relative">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Active LLM sessions across 4 nodes.</span>
          </div>
      </div>
    </div>
  );
}

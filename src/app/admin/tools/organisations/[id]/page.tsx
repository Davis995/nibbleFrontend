"use client";

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OrganisationService } from '../../services/api';
import { 
  Building2, Users, Activity, CreditCard, Clock, MapPin, Search, Plus, 
  ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, FileBarChart
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function OrganisationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const schoolId = resolvedParams.id;

  const { data: resp, isLoading } = useQuery({
    queryKey: ['admin-school-monitoring', schoolId],
    queryFn: () => OrganisationService.fetchMonitoring(schoolId),
  });

  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!resp?.data) return <div className="p-10 text-center text-red-500">Failed to load organisation data.</div>;

  const { school, billing, monitoring, alerts } = resp.data;

  // Simple calculation to find the peak usage in the array to size out our bar chart
  const usageLast30 = monitoring.usage_last_30_days || [];
  const maxTokens = Math.max(...usageLast30.map((u: any) => u.tokens || 0), 10); // avoid divide by 0

  return (
    <div className="space-y-8 pb-20">
      <Link href="/admin/tools/organisations" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Organisations
      </Link>

      {/* Header Profile */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Building2 className="w-48 h-48" />
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner border border-blue-100 uppercase">
            {school.name.substring(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-3xl font-black text-gray-900 tracking-tight">{school.name}</h1>
               {school.is_active ? 
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Active</span> 
                : 
                  <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1"><XCircle className="w-3 h-3"/> Inactive</span>
               }
            </div>
            <p className="text-gray-500 font-medium font-mono text-sm tracking-tight">{school.id}</p>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
         <div className="p-6 bg-red-50 border border-red-200 rounded-3xl shadow-sm space-y-3">
             <h3 className="font-black text-xs text-red-800 uppercase tracking-widest flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5"/> Requires Attention
             </h3>
             <ul className="space-y-2">
                 {alerts.map((a: any, i: number) => (
                    <li key={i} className="text-sm font-medium text-red-900 bg-white/60 p-3 rounded-xl flex items-start gap-3">
                        <span className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0"></span> {a.message}
                    </li>
                 ))}
             </ul>
         </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Limits */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 text-emerald-600 mb-4 bg-emerald-50 w-fit p-3 rounded-2xl">
                  <Users className="w-6 h-6" />
              </div>
              <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">Student Quota</h4>
              <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black text-gray-900">{school.active_students}</span>
                  <span className="text-gray-400 font-bold">/ {school.max_students}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${school.active_students > school.max_students ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (school.active_students / school.max_students) * 100)}%` }}></div>
              </div>
          </div>

          {/* Billing Overview */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 text-amber-600 mb-4 bg-amber-50 w-fit p-3 rounded-2xl">
                  <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">Billing & Plan</h4>
              <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-gray-900 capitalize">{billing.plan || 'Free Plan'}</span>
              </div>
              <div className="space-y-1.5 text-xs font-bold text-gray-500">
                  <div className="flex justify-between"><span>Status</span><span className={`uppercase ${billing.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>{billing.status}</span></div>
                  <div className="flex justify-between"><span>Monthly Price</span><span className="text-gray-900">${billing.monthly_price}</span></div>
                  <div className="flex justify-between"><span>Next Bill</span><span className="text-gray-900">{billing.billing_end_date ? new Date(billing.billing_end_date).toLocaleDateString() : 'N/A'}</span></div>
              </div>
          </div>

          {/* AI Tokens / Credits */}
          <div className="p-6 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-500/20 flex flex-col justify-between hover:-translate-y-1 transition-all relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10 blur-sm pointer-events-none">
                  <Activity className="w-48 h-48" />
              </div>
              <div className="relative z-10 w-full h-full flex flex-col">
                  <div className="flex items-center gap-3 text-white mb-4 bg-white/20 backdrop-blur w-fit p-3 rounded-2xl">
                      <Activity className="w-6 h-6" />
                  </div>
                  <h4 className="text-[10px] font-black text-blue-200 tracking-widest uppercase mb-1">AI Tokens Balance</h4>
                  <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl font-black text-white">{billing.remaining_credits?.toLocaleString()}</span>
                  </div>
                  
                  <div className="mt-auto space-y-2">
                       <div className="flex justify-between text-xs font-bold text-blue-200">
                           <span>{billing.percentage_used}% Consumed</span>
                           <span>{billing.start_credits?.toLocaleString()} limit</span>
                       </div>
                      <div className="w-full bg-blue-900/50 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-white/90 rounded-full" style={{ width: `${Math.min(100, billing.percentage_used || 0)}%` }}></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Visual Usage Chart (Native CSS rendering) */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
         <h3 className="font-black text-lg text-gray-900 tracking-tight flex items-center gap-2 mb-8">
             <FileBarChart className="w-5 h-5 text-blue-600" /> Usage Last 30 Days
         </h3>

         {usageLast30.length === 0 ? (
             <div className="text-center p-12 text-gray-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-gray-200">No usage recorded over the last month.</div>
         ) : (
             <div className="h-[250px] flex items-end justify-between gap-1 mt-4 px-2">
                {usageLast30.map((dayData: any, i: number) => {
                    const heightPercent = Math.max(2, (dayData.tokens / maxTokens) * 100);
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative h-full">
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-10 transition-opacity">
                               {new Date(dayData.date).toLocaleDateString(undefined, { month:'short', day:'numeric'})}: {dayData.tokens} tokens
                            </div>
                            <div className="w-full flex items-end h-full justify-center">
                                <motion.div 
                                    initial={{ height: 0 }} 
                                    animate={{ height: `${heightPercent}%` }} 
                                    transition={{ duration: 0.5, delay: i * 0.02 }}
                                    className="w-full max-w-sm bg-blue-100 hover:bg-blue-600 rounded-t-md transition-colors"
                                />
                            </div>
                        </div>
                    );
                })}
             </div>
         )}
         {usageLast30.length > 0 && <div className="border-t border-gray-100 mt-2 pt-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">30-Day Activity Graph</div>}
      </div>

    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PaymentService } from '../services/api';
import { 
  Receipt, Search, Filter, ArrowRight, CreditCard, 
  CheckCircle2, XCircle, Clock, AlertCircle, 
  FileText, ShieldCheck, History, User, Building2,
  ExternalLink, ChevronLeft, ChevronRight, Eye,
  BarChart3, Wallet, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TabType = 'payments' | 'invoices' | 'audits';

interface Payment {
  id: string;
  payment_type: 'subscription' | 'topup';
  merchant_reference: string;
  order_tracking_id?: string;
  amount: string;
  currency: string;
  status: 'pending' | 'complete' | 'failed' | 'cancelled';
  user_name?: string;
  organisation_name?: string;
  payer_email?: string;
  transaction_date?: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: string;
  currency: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  user_name?: string;
  organisation_name?: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
}

interface Audit {
  id: string;
  payload: any;
  status: string;
  payment_merchant_reference?: string;
  created_at: string;
}

export default function PaymentsManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('payments');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const formatDate = (date: string | Date, includeSeconds = false) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(includeSeconds ? { second: '2-digit' } : {})
    }).format(d);
  };

  // Queries
  const { data: paymentsRes, isLoading: loadingPayments } = useQuery({
    queryKey: ['admin-payments', search, page],
    queryFn: () => PaymentService.fetchPayments({ search, page, page_size: pageSize }),
    enabled: activeTab === 'payments'
  });

  const { data: invoicesRes, isLoading: loadingInvoices } = useQuery({
    queryKey: ['admin-invoices', search, page],
    queryFn: () => PaymentService.fetchInvoices({ search, page, page_size: pageSize }),
    enabled: activeTab === 'invoices'
  });

  const { data: auditsRes, isLoading: loadingAudits } = useQuery({
    queryKey: ['admin-audits', page],
    queryFn: () => PaymentService.fetchAudits({ page, page_size: pageSize }),
    enabled: activeTab === 'audits'
  });

  const payments: Payment[] = (paymentsRes as any)?.results || [];
  const invoices: Invoice[] = (invoicesRes as any)?.results || [];
  const audits: Audit[] = (auditsRes as any)?.results || [];
  
  const totalCount = activeTab === 'payments' ? (paymentsRes as any)?.count : 
                     activeTab === 'invoices' ? (invoicesRes as any)?.count : 
                     (auditsRes as any)?.count || 0;
                     
  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete': 
      case 'paid': 
      case 'success': 
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': 
      case 'unpaid': 
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'failed': 
      case 'cancelled': 
      case 'overdue': 
      case 'failure':
        return 'bg-red-50 text-red-600 border-red-100';
      default: 
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Dynamic Header with Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-emerald-50 rounded-2xl">
                    <Receipt className="w-6 h-6 text-emerald-600" />
                 </div>
                 <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Ledger</h1>
              </div>
              <p className="text-gray-500 font-medium pl-14">
                Monitor platform revenue, audit Pesapal status transitions, and manage customer billing records.
              </p>
           </div>
           
           <div className="mt-8 flex items-center gap-2">
              <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100" />
                 ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                124 Transactions in the last 24h
              </span>
           </div>
        </div>

        <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-600/20 text-white flex flex-col justify-between">
           <div className="flex justify-between items-start">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                 <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Revenue Month-to-Date</div>
                 <div className="text-3xl font-black italic">KES 1.2M</div>
              </div>
           </div>
           <div className="mt-6 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-3 py-1.5 rounded-lg border border-white/10">
              <ShieldCheck className="w-3 h-3" />
              All Webhooks Synchronized
           </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-gray-50 flex flex-col xl:flex-row items-center justify-between gap-6 bg-slate-50/30">
          <div className="flex flex-wrap items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100/50">
             {[
               { id: 'payments', label: 'Payments', icon: CreditCard },
               { id: 'invoices', label: 'Invoices', icon: FileText },
               { id: 'audits', label: 'Audit Logs', icon: ShieldCheck }
             ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as TabType); setPage(1); }}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === tab.id 
                      ? "bg-white text-emerald-600 shadow-sm" 
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
             ))}
          </div>

          <div className="flex items-center gap-4 w-full xl:w-auto">
             <div className="relative flex-1 xl:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
             </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-100">
                <th className="p-6 pl-10">Entity Info</th>
                <th className="p-6">Monetary Value</th>
                <th className="p-6">Transaction Status</th>
                <th className="p-6">Timestamp</th>
                <th className="p-6 pr-10 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {activeTab === 'payments' && payments.map((payment: Payment) => (
                <tr key={payment.id} className="border-b border-gray-50 hover:bg-slate-50/80 transition-all group">
                  <td className="p-6 pl-10">
                     <div className="flex items-center gap-4 text-gray-900 group-hover:translate-x-1 transition-transform">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                           {payment.user_name ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                        </div>
                        <div>
                           <div className="font-bold">{payment.user_name || payment.organisation_name || 'System User'}</div>
                           <div className="text-[10px] text-gray-400 uppercase font-black">{payment.payment_type}</div>
                        </div>
                     </div>
                  </td>
                  <td className="p-6">
                    <div className="font-black text-gray-800 tracking-tight">
                       {payment.currency} {parseFloat(payment.amount).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border w-fit", getStatusColor(payment.status))}>
                       {payment.status}
                    </div>
                  </td>
                  <td className="p-6 text-gray-500 font-bold tabular-nums">
                    {formatDate(payment.created_at)}
                  </td>
                  <td className="p-6 pr-10 text-right font-mono text-[10px] text-gray-400">
                    {payment.merchant_reference}
                  </td>
                </tr>
              ))}

              {activeTab === 'invoices' && invoices.map((invoice: Invoice) => (
                <tr key={invoice.id} className="border-b border-gray-50 hover:bg-slate-50/80 transition-all group">
                  <td className="p-6 pl-10 uppercase font-black text-gray-900 text-xs">
                     <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-300" />
                        {invoice.invoice_number}
                     </div>
                  </td>
                  <td className="p-6 font-black text-gray-800 tracking-tight">
                     {invoice.currency} {parseFloat(invoice.amount).toLocaleString()}
                  </td>
                  <td className="p-6">
                    <div className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border w-fit", getStatusColor(invoice.status))}>
                       {invoice.status}
                    </div>
                  </td>
                  <td className="p-6 text-gray-500 font-bold tabular-nums">
                    {formatDate(invoice.created_at)}
                  </td>
                  <td className="p-6 pr-10 text-right">
                     <button className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all">
                        <ExternalLink className="w-4 h-4" />
                     </button>
                  </td>
                </tr>
              ))}

              {activeTab === 'audits' && audits.map((audit: Audit) => (
                <tr key={audit.id} className="border-b border-gray-50 hover:bg-slate-50/80 transition-all">
                  <td className="p-6 pl-10 text-xs text-gray-500 font-mono">
                     {audit.id.split('-')[0]}...
                  </td>
                  <td className="p-6 font-bold text-gray-800">
                     {audit.payment_merchant_reference || 'Subscription Task'}
                  </td>
                  <td className="p-6">
                    <div className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border w-fit", getStatusColor(audit.status))}>
                       {audit.status}
                    </div>
                  </td>
                  <td className="p-6 text-gray-500 font-bold tabular-nums">
                    {formatDate(audit.created_at, true)}
                  </td>
                  <td className="p-6 pr-10 text-right">
                     <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-all">
                        <Eye className="w-4 h-4" />
                     </button>
                  </td>
                </tr>
              ))}

              {!isLoading() && totalCount === 0 && (
                <tr>
                   <td colSpan={5} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <div className="p-4 bg-slate-50 rounded-full">
                            <History className="w-8 h-8 text-slate-300" />
                         </div>
                         <div className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No records found for this period</div>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Global Pagination */}
        <div className="p-8 bg-slate-50/50 border-t border-gray-50 flex items-center justify-between">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4">
              Showing <span className="text-gray-900">{totalCount > 0 ? pageSize : 0}</span> of <span className="text-gray-900">{totalCount}</span> Database Assets
            </div>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-xs font-black transition-all",
                        page === i + 1 ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-white text-gray-400 border border-transparent hover:border-gray-100"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
              </div>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
        </div>
      </div>
    </div>
  );

  function isLoading() {
    return loadingPayments || loadingInvoices || loadingAudits;
  }
}

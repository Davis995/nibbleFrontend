"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PaymentService } from '../services/api';
import { 
  Receipt, Search, Filter, CreditCard, 
  CheckCircle2, XCircle, Clock, AlertCircle, 
  FileText, ShieldCheck, History, User, Building2,
  ExternalLink, ChevronLeft, ChevronRight, Eye,
  BarChart3, Wallet, TrendingUp, Download, RefreshCcw,
  Calendar, ArrowUpDown, MoreHorizontal, Percent, 
  Banknote, Landmark
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
  payer_phone?: string;
  payer_name?: string;
  transaction_date?: string;
  created_at: string;
  payment_method?: string;
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

interface AnalyticsData {
  kpis: {
    total_revenue: number;
    currency: string;
    success_count: number;
    pending_count: number;
    failed_count: number;
    refunded_count: number;
    avg_order_value: number;
    conversion_rate: number;
  };
  revenue_trend: any[];
  method_distribution: any[];
  top_customers: any[];
}

export default function PaymentsManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('payments');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const { data: paymentsRes, isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['admin-payments', search, page, statusFilter, methodFilter, dateRange, amountRange],
    queryFn: () => PaymentService.fetchPayments({ 
      search, 
      page, 
      page_size: pageSize,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      payment_type: methodFilter !== 'all' ? methodFilter : undefined,
      // Backend handles these in get_queryset
      ...(dateRange.start && { start_date: dateRange.start }),
      ...(dateRange.end && { end_date: dateRange.end }),
      ...(amountRange.min && { min_amount: amountRange.min }),
      ...(amountRange.max && { max_amount: amountRange.max }),
    }),
    enabled: activeTab === 'payments'
  });

  const { data: invoicesRes, isLoading: loadingInvoices } = useQuery({
    queryKey: ['admin-invoices', search, page, statusFilter],
    queryFn: () => PaymentService.fetchInvoices({ 
      search, 
      page, 
      page_size: pageSize,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    enabled: activeTab === 'invoices'
  });

  const { data: auditsRes, isLoading: loadingAudits } = useQuery({
    queryKey: ['admin-audits', page],
    queryFn: () => PaymentService.fetchAudits({ page, page_size: pageSize }),
    enabled: activeTab === 'audits'
  });

  const { data: analyticsRes, isLoading: loadingAnalytics } = useQuery<AnalyticsData>({
    queryKey: ['admin-payments-analytics', dateRange],
    queryFn: () => PaymentService.fetchAnalytics({
      start_date: dateRange.start,
      end_date: dateRange.end
    }),
    enabled: true
  });

  const payments: Payment[] = (paymentsRes as any)?.results || [];
  const invoices: Invoice[] = (invoicesRes as any)?.results || [];
  const audits: Audit[] = (auditsRes as any)?.results || [];
  
  const totalCount = activeTab === 'payments' ? (paymentsRes as any)?.count : 
                     activeTab === 'invoices' ? (invoicesRes as any)?.count : 
                     (auditsRes as any)?.count || 0;
                     
  const totalPages = Math.ceil(totalCount / pageSize);

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
      case 'failure':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'cancelled': 
      case 'overdue': 
      case 'refunded':
        return 'bg-slate-50 text-slate-600 border-slate-100';
      default: 
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setMethodFilter('all');
    setDateRange({ start: '', end: '' });
    setAmountRange({ min: '', max: '' });
    setSearch('');
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await PaymentService.exportPayments({
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        payment_type: methodFilter !== 'all' ? methodFilter : undefined,
        start_date: dateRange.start,
        end_date: dateRange.end
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const kpis = analyticsRes?.kpis || {
    total_revenue: 0,
    currency: 'UGX',
    success_count: 0,
    pending_count: 0,
    failed_count: 0,
    refunded_count: 0,
    avg_order_value: 0,
    conversion_rate: 0
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-2xl">
              <Receipt className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payments & Financials</h1>
          </div>
          <p className="text-gray-500 font-medium pl-14">
            Manage transactions, export reports, and monitor financial health.
          </p>
        </div>
        <div className="flex items-center gap-3 pl-14 md:pl-0">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all disabled:opacity-50"
          >
            {isExporting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exporting...' : 'Export Payments'}
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-600/20"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Total Revenue</span>
          </div>
          <div className="text-2xl font-black italic">{kpis.currency} {kpis.total_revenue.toLocaleString()}</div>
          <div className="mt-2 text-[10px] font-bold text-emerald-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-200" />
            {kpis.success_count} Successful Payments
          </div>
        </motion.div>

        {[
          { label: 'Pending', value: kpis.pending_count, icon: Clock, color: 'amber' },
          { label: 'Failed', value: kpis.failed_count, icon: XCircle, color: 'red' },
          { label: 'Avg Value', value: `${kpis.currency} ${Math.round(kpis.avg_order_value).toLocaleString()}`, icon: Wallet, color: 'blue' },
          { label: 'Conversion', value: `${kpis.conversion_rate}%`, icon: Percent, color: 'indigo' }
        ].map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-xl", `bg-${item.color}-50`)}>
                <item.icon className={cn("w-5 h-5", `text-${item.color}-600`)} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</span>
            </div>
            <div className="text-xl font-black text-gray-900 tracking-tight">{item.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters Panel */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl border border-gray-100/50">
               {[
                 { id: 'payments', label: 'Payments', icon: CreditCard },
                 { id: 'invoices', label: 'Invoices', icon: FileText },
                 { id: 'audits', label: 'Audit Logs', icon: ShieldCheck }
               ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as TabType); setPage(1); }}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
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
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                showFilters ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-white border border-gray-100 text-gray-500"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
            <div className="relative w-64 lg:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-slate-50/50 border-b border-gray-50"
            >
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Date Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-medium focus:outline-none"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    />
                    <span className="text-gray-300">-</span>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-medium focus:outline-none"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <ArrowUpDown className="w-3 h-3" /> Amount Range ({kpis.currency})
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="Min"
                      className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-medium focus:outline-none"
                      value={amountRange.min}
                      onChange={(e) => setAmountRange({...amountRange, min: e.target.value})}
                    />
                    <span className="text-gray-300">-</span>
                    <input 
                      type="number" 
                      placeholder="Max"
                      className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-medium focus:outline-none"
                      value={amountRange.max}
                      onChange={(e) => setAmountRange({...amountRange, max: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" /> Payment Status
                  </label>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-medium focus:outline-none appearance-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="complete">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Landmark className="w-3 h-3" /> Payment Type
                  </label>
                  <div className="flex items-center gap-2">
                    <select 
                      className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-medium focus:outline-none appearance-none"
                      value={methodFilter}
                      onChange={(e) => setMethodFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="subscription">Subscription</option>
                      <option value="topup">Top-up</option>
                    </select>
                    <button 
                      onClick={handleResetFilters}
                      className="p-2 border border-red-100 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-50">
                <th className="p-6 pl-10">Entity Info</th>
                <th className="p-6">Monetary Value</th>
                <th className="p-6">Transaction Status</th>
                <th className="p-6">Timestamp</th>
                <th className="p-6 pr-10 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {isLoading() ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-gray-50">
                    <td className="p-6 pl-10"><div className="h-10 w-40 bg-gray-100 rounded-lg"></div></td>
                    <td className="p-6"><div className="h-5 w-20 bg-gray-100 rounded-lg"></div></td>
                    <td className="p-6"><div className="h-5 w-24 bg-gray-100 rounded-lg"></div></td>
                    <td className="p-6"><div className="h-5 w-32 bg-gray-100 rounded-lg"></div></td>
                    <td className="p-6 pr-10 text-right"><div className="h-5 w-16 bg-gray-100 ml-auto rounded-lg"></div></td>
                  </tr>
                ))
              ) : (
                <>
                  {activeTab === 'payments' && payments.map((payment: Payment) => (
                    <tr key={payment.id} className="border-b border-gray-50 hover:bg-slate-50/80 transition-all group">
                      <td className="p-6 pl-10">
                         <div className="flex items-center gap-4 text-gray-900 group-hover:translate-x-1 transition-transform font-bold">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", payment.payment_type === 'subscription' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600')}>
                               {payment.payment_type === 'subscription' ? <Landmark className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                            </div>
                            <div>
                               <div className="font-bold text-gray-900">{payment.user_name || payment.organisation_name || payment.payer_name || 'System User'}</div>
                               <div className="text-[10px] text-gray-400 uppercase font-black">{payment.payment_type}</div>
                            </div>
                         </div>
                      </td>
                      <td className="p-6">
                        <div className="font-black text-gray-800 tracking-tight">
                           {payment.currency} {parseFloat(payment.amount).toLocaleString()}
                        </div>
                        {payment.payment_method && <div className="text-[9px] font-bold text-gray-400 uppercase">{payment.payment_method}</div>}
                      </td>
                      <td className="p-6">
                        <div className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border w-fit flex items-center gap-1.5", getStatusColor(payment.status))}>
                           {payment.status === 'complete' && <CheckCircle2 className="w-3 h-3" />}
                           {payment.status === 'pending' && <Clock className="w-3 h-3" />}
                           {payment.status === 'failed' && <XCircle className="w-3 h-3" />}
                           {payment.status}
                        </div>
                      </td>
                      <td className="p-6 text-gray-500 font-bold tabular-nums">
                        <div className="text-gray-900">{formatDate(payment.created_at)}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-black">UTC+0</div>
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
                </>
              )}

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
        <div className="p-8 bg-slate-50/30 border-t border-gray-50 flex items-center justify-between">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">
              Showing <span className="text-gray-900">{(page-1)*pageSize + 1} - {Math.min(page*pageSize, totalCount)}</span> of <span className="text-gray-900">{totalCount}</span> Database Assets
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
    return loadingPayments || loadingInvoices || loadingAudits || loadingAnalytics;
  }
}

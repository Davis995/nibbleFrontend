"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Eye, Calendar, User, 
  Cpu, Zap, Clock, X, Terminal, ChevronDown, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminDashboardService, ToolService, API_BASE_URL } from '../services/api';

// UI Helpers
const formatCurrency = (val: number) => {
  if (val === 0) return '$0.00';
  if (val < 0.05) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(val);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

const formatCredits = (val: number) => new Intl.NumberFormat('en-US').format(val);

export default function AILogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [provider, setProvider] = useState('all');
  const [tool, setTool] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, provider, tool, startDate, endDate, pageSize]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', page, pageSize, debouncedSearch, provider, tool, startDate, endDate],
    queryFn: () => AdminDashboardService.fetchLogs({
      page,
      page_size: pageSize,
      search: debouncedSearch,
      provider,
      tool,
      start_date: startDate,
      end_date: endDate
    }),
  });

  const { data: allTools = [] } = useQuery({
    queryKey: ['all-tools-flat'],
    queryFn: ToolService.fetchAllFlat
  });

  const logs = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = data?.total_pages || 1;

  const handleExport = async (format: 'csv' | 'excel' = 'csv') => {
    setIsExporting(true);
    try {
      const data = await AdminDashboardService.exportLogs({
        search: debouncedSearch,
        provider,
        tool,
        start_date: startDate,
        end_date: endDate,
        format
      });
      
      // Define CSV headers
      const headers = ['ID', 'Date', 'User Email', 'Tool', 'Title', 'Provider', 'Credits', 'Cost ($)', 'Tokens (Total)', 'Response Time (ms)'];
      
      // Map data to rows
      const rows = data.map((log: any) => [
        log.id,
        new Date(log.created_at).toLocaleString(),
        log.user?.email || 'Unknown',
        log.tool,
        log.title || 'No Title',
        log.provider,
        log.credits,
        log.cost,
        log.total_tokens,
        log.response_time_ms ? `${log.response_time_ms}ms` : '---'
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_logs_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
       console.error('Export error:', error);
       alert(error.message || 'Failed to export logs');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="relative flex-1 w-full max-w-2xl group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
             <input 
                type="text" 
                placeholder="Search by user email, tool name, or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none font-medium text-gray-700"
             />
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
             <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm ${showFilters ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-gray-600 border border-gray-100'}`}
             >
                <Filter className="w-5 h-5" />
                Filters
             </button>

             <div className="relative group flex-1 lg:flex-none">
                 <button 
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white border border-gray-100 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-bold shadow-sm"
                 >
                    {isExporting ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div> : <Download className="w-5 h-5 text-blue-500" />}
                    Export Logs
                    <ChevronDown className="w-4 h-4 opacity-50" />
                 </button>
                 {/* Export Dropdown */}
                 <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-2 overflow-hidden ring-1 ring-black/5">
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors">Export as CSV</button>
                    <button onClick={() => handleExport('excel' as any)} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors border-t border-gray-50">Export as Excel (.xlsx)</button>
                 </div>
             </div>
        </div>
      </div>

      {/* Filters Section */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-sm">
                {/* Tool Filter */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tool Provider</label>
                    <select 
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-semibold text-gray-600"
                    >
                        <option value="all">All Providers</option>
                        <option value="openai">OpenAI</option>
                        <option value="deepseek">DeepSeek</option>
                    </select>
                </div>
                
                {/* Specific Tool Filter */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Specific Tool</label>
                    <select 
                        value={tool}
                        onChange={(e) => setTool(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-semibold text-gray-600"
                    >
                        <option value="all">All System Tools</option>
                        {allTools.map((t: any) => (
                            <option key={t.id} value={t.slug}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {/* Date Filters */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                    <div className="relative">
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-semibold text-gray-600"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">End Date</label>
                    <div className="relative">
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-semibold text-gray-600"
                        />
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-[0_20px_60px_rgba(0,0,0,0.02)] overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-gray-50">
                        <th className="py-6 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">User & Tool</th>
                        <th className="py-6 px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                        <th className="py-6 px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Tokens</th>
                        <th className="py-6 px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Credits</th>
                        <th className="py-6 px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Cost</th>
                        <th className="py-6 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Status / Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                    {isLoading ? (
                        [...Array(6)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                <td colSpan={6} className="py-10 px-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                            </tr>
                        ))
                    ) : logs.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-20 text-center">
                                <Database className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-semibold">No activity logs found for these filters.</p>
                            </td>
                        </tr>
                    ) : logs.map((log: any) => (
                        <motion.tr 
                            key={log.id} 
                            whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                            onClick={() => setSelectedLog(log)}
                            className="group cursor-pointer transition-all border-l-4 border-l-transparent hover:border-l-blue-500"
                        >
                            <td className="py-6 px-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 leading-none truncate max-w-[220px]" title={log.user?.email || log.user?.username}>{log.user?.email || log.user?.username || 'Unknown'}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-0.5 rounded-md bg-white border border-gray-100 text-[10px] font-black text-gray-400 uppercase group-hover:text-blue-600 transition-colors">{log.tool}</span>
                                            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{log.title || 'No Title'}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-6 px-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${log.provider === 'openai' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                    {log.provider}
                                </span>
                            </td>
                            <td className="py-6 px-4 text-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-bold text-gray-700">{log.total_tokens}</span>
                                    <span className="text-[9px] text-gray-300 font-black uppercase tracking-tighter">Total Tokens</span>
                                </div>
                            </td>
                            <td className="py-6 px-4 text-right">
                                <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-[10px] font-black shadow-lg shadow-blue-500/20">
                                    {formatCredits(log.credits)}
                                </span>
                            </td>
                            <td className="py-6 px-4 text-right">
                                <p className="text-sm font-black text-gray-900">{formatCurrency(log.cost)}</p>
                            </td>
                            <td className="py-6 px-8 text-right">
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs">
                                        <Clock className="w-3 h-3" />
                                        {log.response_time_ms ? `${log.response_time_ms}ms` : '---'}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium mt-1">{new Date(log.created_at).toLocaleString()}</span>
                                </div>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
         </div>

         {/* Pagination Bar */}
         <div className="bg-slate-50/50 px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Showing {totalCount > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} logs
            </p>
            
            <div className="flex items-center gap-2">
                <div className="flex items-center bg-white border border-gray-100 rounded-xl px-2">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(1)}
                        className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50/50">
                        {page} / {totalPages}
                    </span>
                    <button 
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                        disabled={page === totalPages}
                        onClick={() => setPage(totalPages)}
                        className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
                
                <select 
                    value={pageSize}
                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                    className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 outline-none focus:ring-2 focus:ring-blue-100"
                >
                    <option value={10}>10 / Page</option>
                    <option value={25}>25 / Page</option>
                    <option value={50}>50 / Page</option>
                    <option value={100}>100 / Page</option>
                </select>
            </div>
         </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedLog(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                 {/* Modal Header */}
                 <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <Terminal className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Log Interaction Detail</h3>
                            <p className="text-sm text-gray-400 uppercase font-black tracking-widest mt-1">Ref ID: {selectedLog.id} • {selectedLog.provider}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-all group">
                        <X className="w-6 h-6" />
                    </button>
                 </div>

                 {/* Modal Content */}
                 <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Interaction Recap */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">User</p>
                            <p className="font-bold text-gray-800">{selectedLog.user?.email}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tokens</p>
                            <p className="font-bold text-gray-800">{selectedLog.total_tokens}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Credits</p>
                            <p className="font-bold text-blue-600">{formatCredits(selectedLog.credits)}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Response Time</p>
                            <p className="font-bold text-emerald-500">{selectedLog.response_time_ms}ms</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Prompt */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl w-fit text-xs font-black uppercase">
                                <Zap className="w-3 h-3" /> Input Prompt
                            </div>
                            <div className="p-6 bg-slate-900 rounded-[2rem] text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed border-4 border-slate-800 shadow-inner">
                                {selectedLog.prompt || "No prompt data available for this record."}
                            </div>
                        </div>

                        {/* Completion */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl w-fit text-xs font-black uppercase">
                                <Cpu className="w-3 h-3" /> AI Response
                            </div>
                            <div className="p-6 bg-white border border-gray-100 rounded-[2rem] text-gray-700 text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
                                {selectedLog.completion || "Empty response or error recorded."}
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Modal Footer */}
                 <div className="p-6 border-t border-gray-50 bg-slate-50/50 flex justify-end">
                    <button 
                        onClick={() => setSelectedLog(null)}
                        className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-100 transition-all text-sm shadow-sm"
                    >
                        Dismiss Detail
                    </button>
                 </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

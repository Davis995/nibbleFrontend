"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, Check, Star, GripVertical, Settings, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { ToolService, CategoryService } from '../services/api';
import Link from 'next/link';

type Tool = {
  id: number;
  slug: string;
  name: string;
  student_friendly_name: string;
  description: string;
  category: { id: number; name: string; type: string };
  icon: string | null;
  color: string;
  system_prompt: string;
  is_premium: boolean;
  is_recommended: boolean;
  is_active: boolean;
  preferred_modal: string;
  inputs?: any[];
};

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function ToolsLibraryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [premiumFilter, setPremiumFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const debouncedSearch = useDebounce(searchTerm, 400);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'inputs'>('general');
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    student_friendly_name: '',
    description: '',
    categories: '',
    icon: '',
    color: '#3b82f6',
    preferred_modal: 'gpt-4o-mini',
    system_prompt: '',
    is_premium: false,
    is_recommended: false,
    is_active: true,
  });

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, categoryFilter, statusFilter, premiumFilter, pageSize]);

  const { data: toolsResponse, isLoading, isFetching } = useQuery({
    queryKey: ['ai-tools', currentPage, pageSize, debouncedSearch, categoryFilter, statusFilter, premiumFilter],
    queryFn: () => ToolService.fetchAll({
      page: currentPage,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      category: categoryFilter !== 'all' ? parseInt(categoryFilter) : undefined,
      active: statusFilter !== 'all' ? (statusFilter === 'active' ? 'true' : 'false') : undefined,
      premium: premiumFilter !== 'all' ? (premiumFilter === 'premium' ? 'true' : 'false') : undefined,
    }),
    placeholderData: (prev) => prev  // keep previous data while loading
  });

  const tools: Tool[] = toolsResponse?.results ?? [];
  const totalCount = toolsResponse?.count ?? 0;
  const totalPages = toolsResponse?.total_pages ?? 1;

  const { data: categories = [] } = useQuery({
    queryKey: ['tool-categories'],
    queryFn: CategoryService.fetchAll
  });

  const { data: toolDetail } = useQuery({
    queryKey: ['ai-tool-detail', editingTool?.slug],
    queryFn: () => ToolService.fetchDetail(editingTool!.slug),
    enabled: !!editingTool && activeTab === 'inputs',
  });

  const toolInputs = toolDetail?.inputs || [];

  const createMutation = useMutation({
    mutationFn: ToolService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ slug, data }: { slug: string, data: any }) => ToolService.update(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ToolService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-tools'] })
  });

  const openModal = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      setActiveTab('general');
      setFormData({
        name: tool.name,
        student_friendly_name: tool.student_friendly_name,
        description: tool.description,
        categories: tool.category?.id.toString() || '',
        icon: tool.icon || '',
        color: tool.color || '#3b82f6',
        preferred_modal: tool.preferred_modal || 'gpt-4o-mini',
        system_prompt: tool.system_prompt || '',
        is_premium: tool.is_premium,
        is_recommended: tool.is_recommended,
        is_active: tool.is_active,
      });
    } else {
      setEditingTool(null);
      setActiveTab('general');
      setFormData({
        name: '',
        student_friendly_name: '',
        description: '',
        categories: categories.length > 0 ? categories[0].id.toString() : '',
        icon: '',
        color: '#3b82f6',
        preferred_modal: 'gpt-4o-mini',
        system_prompt: '',
        is_premium: false,
        is_recommended: false,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleExportLogs = async () => {
    try {
      const tokensStr = localStorage.getItem('tokens');
      const token = tokensStr ? JSON.parse(tokensStr)?.access : null;
      
      const response = await fetch(`${API_BASE_URL}/tools/admin/logs/export/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_usage_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      categories: parseInt(formData.categories, 10)
    };
    if (editingTool) {
      updateMutation.mutate({ slug: editingTool.slug, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (slug: string) => {
    if (window.confirm('Are you sure you want to delete this AI Tool?')) {
      deleteMutation.mutate(slug);
    }
  };

  // Build page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Nested Inputs Form component
  const InputManager = ({ slug, inputs }: { slug: string, inputs: any[] }) => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">Manage required fields for this tool.</p>
          <Link href={`/admin/tools/inputs?slug=${slug}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <Settings className="w-4 h-4" /> Open Input Details Handler
          </Link>
        </div>
        {inputs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            No inputs mapped to this tool.
          </div>
        ) : (
          <div className="space-y-2">
            {inputs.map((inp: any) => (
              <div key={inp.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">{inp.label}</div>
                  <div className="text-xs text-gray-500">
                    Type: {inp.type} | Required: {inp.required ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">AI Tools Library</h2>
          <p className="text-sm text-gray-500 mt-1">Manage AI tools and prompts.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Logs (CSV)
          </button>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Tool
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center bg-gray-50">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={premiumFilter}
            onChange={(e) => setPremiumFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Premium: All</option>
            <option value="premium">Premium Only</option>
            <option value="free">Free Only</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px] relative">
          {isFetching && !isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 z-10 overflow-hidden">
              <div className="h-full w-1/3 bg-blue-500 animate-pulse rounded-full" />
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tool Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Badges</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading tools...</td></tr>
              ) : tools.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No tools found matching criteria.</td></tr>
              ) : (
                tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded shadow-sm flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: tool.color || '#3b82f6' }}>
                        {tool.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{tool.student_friendly_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Internal: {tool.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tool.category ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {tool.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {tool.is_active ?
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active"></span> :
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500" title="Inactive"></span>
                        }
                        {tool.is_premium && <span title="Premium"><Star className="w-4 h-4 text-amber-500" /></span>}
                        {tool.is_recommended && <span title="Recommended"><Check className="w-4 h-4 text-blue-500" /></span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tool.preferred_modal || 'Default'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <Link href={`/admin/tools/preview?slug=${tool.slug}`} className="inline-block p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Preview">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => openModal(tool)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(tool.slug)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>
                Showing <span className="font-semibold text-gray-900">{startIndex}</span> – <span className="font-semibold text-gray-900">{endIndex}</span> of <span className="font-semibold text-gray-900">{totalCount}</span>
              </span>
              <div className="h-5 w-px bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <label className="text-gray-500">Per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((page, idx) =>
                typeof page === 'string' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm select-none">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[36px] h-9 flex items-center justify-center rounded text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Full Screen on mobile, large modal on desktop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTool ? 'Edit AI Tool' : 'Create AI Tool'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-gray-200 px-6 shrink-0 bg-white">
              <button
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('general')}
              >
                General Info
              </button>
              <button
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'inputs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} ${!editingTool && 'opacity-50 cursor-not-allowed'}`}
                onClick={() => editingTool && setActiveTab('inputs')}
                disabled={!editingTool}
                title={!editingTool ? 'Save tool first to manage inputs' : ''}
              >
                Inputs Config
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {(createMutation.isError || updateMutation.isError) && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Failed to save tool. Please check required fields.</span>
                </div>
              )}

              {activeTab === 'general' ? (
                <form id="toolForm" onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Internal Name *</label>
                      <input
                        required type="text"
                        placeholder="e.g. EssayGrader"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Display Name (Student Friendly) *</label>
                      <input
                        required type="text"
                        placeholder="e.g. Essay Helper"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.student_friendly_name} onChange={e => setFormData({...formData, student_friendly_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Category *</label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.categories} onChange={e => setFormData({...formData, categories: e.target.value})}
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Preferred AI Model</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.preferred_modal} onChange={e => setFormData({...formData, preferred_modal: e.target.value})}
                      >
                        <option value="gpt-4o-mini">GPT 4o Mini (Default)</option>
                        <option value="gpt-4">GPT 4</option>
                        <option value="deepseek-chat">DeepSeek Chat</option>
                      </select>
                    </div>
                  </div>

                  {/* UI customization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Theme Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          className="h-10 w-14 p-1 cursor-pointer rounded border border-gray-300"
                          value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}
                        />
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                          value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Icon Name</label>
                      <input
                        type="text" placeholder="e.g. Feather, Zap"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={2} required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex justify-between">
                      System Prompt
                      <span className="text-gray-400 font-normal text-xs">Use input names like {'{topic}'} to inject data</span>
                    </label>
                    <textarea
                      rows={5} required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      value={formData.system_prompt} onChange={e => setFormData({...formData, system_prompt: e.target.value})}
                      placeholder="You are a helpful assistant..."
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-wrap gap-6 pt-2 pb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded"
                        checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-amber-500 rounded"
                        checked={formData.is_premium} onChange={e => setFormData({...formData, is_premium: e.target.checked})} />
                      <span className="text-sm font-medium text-gray-700">Premium Tool</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded"
                        checked={formData.is_recommended} onChange={e => setFormData({...formData, is_recommended: e.target.checked})} />
                      <span className="text-sm font-medium text-gray-700">Recommended</span>
                    </label>
                  </div>
                </form>
              ) : (
                <div className="animate-in fade-in duration-300">
                  <InputManager slug={editingTool!.slug} inputs={toolInputs} />
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {activeTab === 'general' && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" form="toolForm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save General Info'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

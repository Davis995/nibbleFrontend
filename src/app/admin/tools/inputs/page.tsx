"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { ToolService, InputService } from '../services/api';
import { useSearchParams, useRouter } from 'next/navigation';

export default function InputsManagementPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slugFromUrl = searchParams.get('slug');

  const [selectedTool, setSelectedTool] = useState(slugFromUrl || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInput, setEditingInput] = useState<any>(null);

  const [formData, setFormData] = useState({
    label: '',
    type: 'text',
    placeholder: '',
    default_value: '',
    options: '', // stringified JSON internally or comma-separated
    required: false,
    minlength: '',
    maxlength: '',
    order: 0,
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['ai-tools-flat'],
    queryFn: () => ToolService.fetchAllFlat()
  });

  // Automatically select the first tool if none is selected
  useEffect(() => {
    if (tools.length > 0 && !selectedTool) {
      setSelectedTool(tools[0].slug);
    }
  }, [tools, selectedTool]);

  const { data: inputs = [], isLoading } = useQuery({
    queryKey: ['tool-inputs', selectedTool],
    queryFn: () => InputService.fetchAllByTool(selectedTool),
    enabled: !!selectedTool,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => InputService.create(selectedTool, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-inputs', selectedTool] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => InputService.update(selectedTool, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-inputs', selectedTool] });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => InputService.delete(selectedTool, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tool-inputs', selectedTool] })
  });
  
  const reorderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => InputService.update(selectedTool, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tool-inputs', selectedTool] })
  });

  const filteredInputs = inputs.filter((inp: any) => {
    const matchesSearch = inp.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || inp.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedInputs = [...filteredInputs].sort((a, b) => a.order - b.order);

  const openModal = (inp?: any) => {
    if (inp) {
      setEditingInput(inp);
      setFormData({
        label: inp.label,
        type: inp.type,
        placeholder: inp.placeholder || '',
        default_value: inp.default_value || '',
        options: inp.options ? (Array.isArray(inp.options) ? inp.options.map((o: any) => o.value || o).join(', ') : JSON.stringify(inp.options)) : '',
        required: inp.required,
        minlength: inp.minlength?.toString() || '',
        maxlength: inp.maxlength?.toString() || '',
        order: inp.order || 0,
      });
    } else {
      setEditingInput(null);
      setFormData({
        label: '', type: 'text', placeholder: '', default_value: '', options: '', required: false, minlength: '', maxlength: '', order: inputs.length * 10
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process options string into JSON array if dropdown
    let optionsJson = null;
    if (formData.type === 'dropdown' && formData.options) {
      optionsJson = formData.options.split(',').map(s => s.trim()).filter(Boolean);
    }

    const submitData = {
      ...formData,
      minlength: formData.minlength ? parseInt(formData.minlength) : null,
      maxlength: formData.maxlength ? parseInt(formData.maxlength) : null,
      options: optionsJson,
    };

    if (editingInput) {
      updateMutation.mutate({ id: editingInput.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this input field?')) deleteMutation.mutate(id);
  };
  
  const handleShiftOrder = (input: any, direction: 'up' | 'down') => {
    // simplified reordering
    const offset = direction === 'up' ? -15 : 15;
    reorderMutation.mutate({ id: input.id, data: { ...input, order: input.order + offset } });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Tool Inputs Management</h2>
          <p className="text-sm text-gray-500 mt-1">Configure user prompts and dynamic fields for AI tools.</p>
        </div>
        <button 
          disabled={!selectedTool}
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Input
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center bg-gray-50">
          <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
            <span className="text-sm font-medium text-gray-700">Select Tool:</span>
            <select 
              value={selectedTool}
              onChange={(e) => {
                const slug = e.target.value;
                setSelectedTool(slug);
                router.replace(`/admin/tools/inputs?slug=${slug}`);
              }}
              className="border border-gray-300 rounded-lg text-sm px-3 py-2 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="" disabled>-- Select a Tool --</option>
              {tools.map((t: any) => (
                <option key={t.slug} value={t.slug}>{t.name} ({t.student_friendly_name})</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder="Search inputs..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Type: All</option>
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="dropdown">Dropdown</option>
            <option value="number">Number</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="w-16 px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Label & Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Required</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!selectedTool ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Please select an AI Tool to view its inputs.</td></tr>
              ) : isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading inputs...</td></tr>
              ) : sortedInputs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No inputs configured for this tool.</td></tr>
              ) : (
                sortedInputs.map((inp, idx) => (
                  <tr key={inp.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center opacity-30 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleShiftOrder(inp, 'up')} disabled={idx === 0} className="p-0.5 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-20"><ArrowUp className="w-4 h-4"/></button>
                        <span className="text-xs font-mono text-gray-400 my-0.5">{inp.order}</span>
                        <button onClick={() => handleShiftOrder(inp, 'down')} disabled={idx === sortedInputs.length - 1} className="p-0.5 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-20"><ArrowDown className="w-4 h-4"/></button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{inp.label}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                        Placeholder: {inp.placeholder || '-'} • Default: {inp.default_value || '-'}
                      </div>
                      {inp.type === 'dropdown' && (
                        <div className="text-xs text-blue-600 mt-0.5">
                          Options: {Array.isArray(inp.options) ? inp.options.join(', ') : 'None'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {inp.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {inp.required ? 
                        <span className="text-emerald-600 font-medium text-sm">Yes</span> : 
                        <span className="text-gray-400 text-sm">No</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <button onClick={() => openModal(inp)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(inp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {editingInput ? 'Edit Input Field' : 'Create Input Field'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {(createMutation.isError || updateMutation.isError) && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Failed to save input field. Please check required fields.</span>
                </div>
              )}

              <form id="inputForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Label (UI Name) *</label>
                    <input 
                      required type="text" placeholder="e.g. Essay Topic"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Input Type *</label>
                    <select 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="text">Single Line Text</option>
                      <option value="textarea">Multi-line Textarea</option>
                      <option value="dropdown">Dropdown Options</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Placeholder</label>
                    <input 
                      type="text" placeholder="e.g. Enter the topic here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={formData.placeholder} onChange={e => setFormData({...formData, placeholder: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Default Value</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={formData.default_value} onChange={e => setFormData({...formData, default_value: e.target.value})}
                    />
                  </div>
                </div>

                {formData.type === 'dropdown' && (
                  <div className="space-y-1 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <label className="text-sm font-medium text-blue-800">Dropdown Options *</label>
                    <textarea 
                      required={formData.type === 'dropdown'} rows={2}
                      placeholder="e.g. Option 1, Option 2, Option 3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={formData.options} onChange={e => setFormData({...formData, options: e.target.value})}
                    />
                    <p className="text-xs text-blue-600 mt-1">Separate options with commas (,)</p>
                  </div>
                )}

                {(formData.type === 'text' || formData.type === 'textarea') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Min Length</label>
                      <input 
                        type="number" min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={formData.minlength} onChange={e => setFormData({...formData, minlength: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Max Length</label>
                      <input 
                        type="number" min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={formData.maxlength} onChange={e => setFormData({...formData, maxlength: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Sort Order</label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${formData.required ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.required ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <input 
                      type="checkbox" className="hidden"
                      checked={formData.required} onChange={e => setFormData({...formData, required: e.target.checked})} 
                    />
                    <span className="text-sm font-medium text-gray-800">This field is required</span>
                  </label>
                </div>
              </form>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" form="inputForm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Input'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

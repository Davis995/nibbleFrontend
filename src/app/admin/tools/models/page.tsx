"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Terminal, Plus, Edit2, Trash2, X, AlertCircle, 
  CheckCircle2, ShieldCheck, Zap, Activity, Cpu, Brain
} from 'lucide-react';
import { AdminModelConfigService } from '../services/api';
import toast from 'react-hot-toast';

interface AIModelConfig {
  id: number;
  model_id: string;
  name: string;
  provider: string;
  input_token_weight: string;
  output_token_weight: string;
  min_charge: number;
  credit_multiplier: string;
  enterprise_discount: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function ModelEndpointsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelConfig | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-models'],
    queryFn: AdminModelConfigService.fetchAll
  });

  const createMutation = useMutation({
    mutationFn: AdminModelConfigService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      toast.success('Model configuration created successfully');
      setIsModalOpen(false);
      setEditingModel(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create model config');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => AdminModelConfigService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      toast.success('Model configuration updated successfully');
      setIsModalOpen(false);
      setEditingModel(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update model config');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: AdminModelConfigService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      toast.success('Model configuration deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete model config');
    }
  });

  const handleOpenModal = (model?: AIModelConfig) => {
    if (model) {
      setEditingModel(model);
    } else {
      setEditingModel(null);
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this configuration? This might break functionality relying on this model identifier.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      model_id: formData.get('model_id'),
      name: formData.get('name'),
      provider: formData.get('provider'),
      input_token_weight: formData.get('input_token_weight'),
      output_token_weight: formData.get('output_token_weight'),
      min_charge: parseInt(formData.get('min_charge') as string) || 0,
      credit_multiplier: formData.get('credit_multiplier'),
      enterprise_discount: formData.get('enterprise_discount'),
      is_active: formData.get('is_active') === 'on'
    };

    if (editingModel) {
      updateMutation.mutate({ id: editingModel.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Determine the results structure: some DRF viewsets wrap in list/results, here ListCreateAPIView just returns array unless paginated.
  let models: AIModelConfig[] = [];
  if (Array.isArray(data)) {
    models = data;
  } else if (data?.results) {
    models = data.results;
  }

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute -top-24 -right-24 p-12 opacity-5 pointer-events-none">
          <Terminal className="w-96 h-96 text-indigo-600" />
        </div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Terminal className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Configuration</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">
            AI Model <span className="text-indigo-600">Endpoints</span>
          </h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            Manage cost weights, token multipliers, and minimum charges for various LLM capabilities powering your application.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="relative z-10 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Model Route</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-8 rounded-[2rem] flex items-center gap-4">
          <AlertCircle className="w-8 h-8" />
          <p className="font-bold">Error loading model configurations. Please check backend connection.</p>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {models.map((model) => (
            <motion.div 
              key={model.id} 
              variants={fadeUp}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-8 flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${model.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                    {model.provider === 'openai' ? <Brain className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 leading-tight">{model.name}</h3>
                    <p className="text-xs text-gray-400 font-bold tracking-wider uppercase mt-1">{model.provider}</p>
                  </div>
                </div>
                <div className="flex bg-slate-50 rounded-full p-1 border border-gray-100">
                  <button 
                    onClick={() => handleOpenModal(model)}
                    className="p-2 hover:bg-white rounded-full text-indigo-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(model.id)}
                    className="p-2 hover:bg-white rounded-full text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl mb-6 relative z-10 border border-gray-100/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Model ID (Binding)</p>
                <p className="font-mono text-sm text-gray-800 font-bold truncate">{model.model_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Input Wgt</p>
                  <p className="font-black text-gray-800">{Number(model.input_token_weight).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Output Wgt</p>
                  <p className="font-black text-gray-800">{Number(model.output_token_weight).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Min Charge</p>
                  <p className="font-black text-amber-600">{model.min_charge} cr</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Multiplier</p>
                  <p className="font-black text-indigo-600">{Number(model.credit_multiplier).toFixed(2)}x</p>
                </div>
              </div>

              {model.is_active ? (
                <div className="absolute right-6 bottom-6 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 shadow-sm border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              ) : (
                <div className="absolute right-6 bottom-6 flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 shadow-sm border border-gray-200">
                  <X className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </motion.div>
          ))}
          {models.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">No model configurations found.</p>
              <p className="text-sm text-gray-400 mt-2">Click 'Add Model Route' to begin tracking API token costs securely.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingModel ? 'Edit Model Configuration' : 'Add Model Route'}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <form id="model-config-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Model Binding ID <span className="text-red-500">*</span></label>
                      <input 
                        name="model_id" 
                        required 
                        defaultValue={editingModel?.model_id}
                        placeholder="e.g. gpt-4o-mini"
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                      />
                      <p className="text-[10px] text-gray-400">Exact string sent to provider API.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Display Name <span className="text-red-500">*</span></label>
                      <input 
                        name="name" 
                        required 
                        defaultValue={editingModel?.name}
                        placeholder="e.g. GPT-4 Optimized"
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Provider</label>
                      <select 
                        name="provider" 
                        defaultValue={editingModel?.provider || 'openai'}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="deepseek">DeepSeek</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Min Request Charge</label>
                      <input 
                        name="min_charge" 
                        type="number"
                        required 
                        defaultValue={editingModel?.min_charge ?? 50}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Input Wgt (per 1m)</label>
                      <input 
                        name="input_token_weight" 
                        type="number"
                        step="0.0001"
                        required 
                        defaultValue={editingModel?.input_token_weight || '1.0'}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Output Wgt (per 1m)</label>
                      <input 
                        name="output_token_weight" 
                        type="number"
                        step="0.0001"
                        required 
                        defaultValue={editingModel?.output_token_weight || '1.0'}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Credit Multiplier</label>
                      <input 
                        name="credit_multiplier" 
                        type="number"
                        step="0.0001"
                        required 
                        defaultValue={editingModel?.credit_multiplier || '1.0'}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Enterprise Discount</label>
                      <input 
                        name="enterprise_discount" 
                        type="number"
                        step="0.01"
                        required 
                        defaultValue={editingModel?.enterprise_discount || '0.20'}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2 pt-4">
                      <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-indigo-50 transition-colors group">
                        <input 
                          type="checkbox" 
                          name="is_active"
                          defaultChecked={editingModel ? editingModel.is_active : true}
                          className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <div>
                          <p className="font-bold text-gray-900">Active Status</p>
                          <p className="text-xs text-gray-500 group-hover:text-indigo-600/70 transition-colors">Whether this LLM can currently be invoked by the application layer.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 mt-auto">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="model-config-form"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  )}
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

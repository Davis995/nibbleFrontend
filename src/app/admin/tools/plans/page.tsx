"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlanService, FeatureService } from '../services/api';
import { 
  Package, Plus, Search, ArrowRight, Edit2, Trash2, 
  CheckCircle2, XCircle, Star, BadgeCheck, Zap, 
  Settings2, CreditCard, Layers, Globe, Palette,
  Info, AlertCircle, ChevronRight, Save, X, ListOrdered
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface Feature {
  id: number;
  text: string;
  order: number;
}

export interface PlanFeature {
  id?: number;
  feature_id?: number | null;
  text?: string;
  included: boolean;
  highlight: boolean;
  order: number;
}

interface Plan {
  id: number;
  plan_id: string;
  name: string;
  description: string;
  use_type: 'individual' | 'enterprise';
  theme: 'cream' | 'dark' | 'light';
  currency: string;
  allowed_modals: string[];
  total_credits: number;
  max_users: number | null;
  monthly_price: string;
  annual_price: string;
  annual_billed: string;
  badge: string;
  cta: string;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  features: PlanFeature[];
}

export default function PlansManagementPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'features'>('basic');

  // Feature Management State
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newFeatureOrder, setNewFeatureOrder] = useState(0);

  // Form State
  const [formData, setFormData] = useState<Partial<Plan>>({
    plan_id: '',
    name: '',
    description: '',
    use_type: 'individual',
    theme: 'cream',
    currency: 'UGX',
    allowed_modals: ['gpt-4o-mini', 'gpt-4o', 'deepseek-chat'],
    total_credits: 10000,
    max_users: 1,
    monthly_price: '0.00',
    annual_price: '0.00',
    annual_billed: '0.00',
    badge: '',
    cta: 'Select Plan',
    is_popular: false,
    is_active: true,
    display_order: 0,
    features: []
  });

  const { data: plansResponse, isLoading } = useQuery({
    queryKey: ['admin-plans', search],
    queryFn: () => PlanService.fetchAll({ search }),
  });

  const { data: globalFeaturesResponse, refetch: refetchFeatures } = useQuery({
    queryKey: ['admin-features'],
    queryFn: () => FeatureService.fetchAll(),
  });

  const plans = (plansResponse as any)?.results || [] as Plan[];
  const globalFeatures = (globalFeaturesResponse as any)?.results || [] as Feature[];

  // Mutations for Features
  const createFeatureMutation = useMutation({
    mutationFn: FeatureService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-features'] });
      setNewFeatureText('');
      setNewFeatureOrder(0);
      toast.success('Global feature created');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create feature')
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: FeatureService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-features'] });
      toast.success('Feature removed');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete feature')
  });

  // Mutations for Plans (existing)
  const createMutation = useMutation({
    mutationFn: PlanService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plan created successfully');
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create plan')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => PlanService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plan updated successfully');
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update plan')
  });

  const deleteMutation = useMutation({
    mutationFn: PlanService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plan deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete plan')
  });

  useEffect(() => {
    if (editingPlan) {
      setFormData(editingPlan);
    } else {
      setFormData({
        plan_id: '',
        name: '',
        description: '',
        use_type: 'individual',
        theme: 'cream',
        currency: 'UGX',
        allowed_modals: ['gpt-4o-mini', 'gpt-4o', 'deepseek-chat'],
        total_credits: 10000,
        max_users: 1,
        monthly_price: '0.00',
        annual_price: '0.00',
        annual_billed: '0.00',
        badge: '',
        cta: 'Select Plan',
        is_popular: false,
        is_active: true,
        display_order: 0,
        features: []
      });
    }
  }, [editingPlan]);

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addFeature = () => {
    const newFeature: PlanFeature = {
      feature_id: null,
      text: '',
      included: true,
      highlight: false,
      order: (formData.features?.length || 0)
    };
    setFormData({ ...formData, features: [...(formData.features || []), newFeature] });
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = [...(formData.features || [])];
    updatedFeatures.splice(index, 1);
    setFormData({ ...formData, features: updatedFeatures });
  };

  const updateFeature = (index: number, field: keyof PlanFeature, value: any) => {
    const updatedFeatures = [...(formData.features || [])];
    updatedFeatures[index] = { ...updatedFeatures[index], [field]: value };
    setFormData({ ...formData, features: updatedFeatures });
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm shadow-indigo-500/5 transition-all">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-indigo-50 rounded-2xl">
                <Package className="w-6 h-6 text-indigo-600" />
             </div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">Plan Architecture</h1>
          </div>
          <p className="text-gray-500 font-medium pl-14">
            Design pricing structures, define token economies, and model AI model accessibility.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsFeatureModalOpen(true)}
            className="px-6 py-4 bg-white text-gray-600 font-bold rounded-2xl flex items-center gap-2 hover:bg-gray-50 transition-all border border-gray-100 shadow-sm active:scale-95 group"
          >
            <ListOrdered className="w-5 h-5 text-indigo-500 group-hover:rotate-12 transition-transform" />
            Manage Features
          </button>
          <button 
            onClick={handleOpenAdd}
            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Create New Tier
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {/* Table Controls */}
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-6">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Active Index
             </h3>
             <div className="h-4 w-px bg-gray-200 hidden md:block"></div>
             <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-400">
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {(plans as Plan[]).filter(p => p.is_active).length || 0} Listed</span>
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> {(plans as Plan[]).length || 0} Total</span>
             </div>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search plan name or ID..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-32 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Syncing Tiers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-100">
                  <th className="p-6 pl-10">Tiers & Model Access</th>
                  <th className="p-6">Type & Theme</th>
                  <th className="p-6">Pricing Config</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 pr-10 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {(plans as Plan[]).map((plan) => (
                  <tr key={plan.id} className="border-b border-gray-50 hover:bg-slate-50/80 transition-all group">
                    <td className="p-6 pl-10">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                            plan.theme === 'dark' ? 'bg-slate-900 text-white shadow-slate-900/20' : 
                            plan.theme === 'cream' ? 'bg-amber-50 text-amber-900 shadow-amber-100/50' : 
                            'bg-white text-indigo-600 shadow-indigo-100/50'
                         )}>
                            <Globe className="w-6 h-6 opacity-40" />
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <span className="font-bold text-gray-900 text-base">{plan.name}</span>
                               {plan.is_popular && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                               <span className="text-[10px] font-black uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-md text-gray-500">{plan.plan_id}</span>
                               <span className="text-xs text-gray-400 truncate max-w-[150px]">{plan.allowed_modals.length} AI Models</span>
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="p-6">
                       <div className="space-y-2">
                          <div className={cn(
                             "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit border",
                             plan.use_type === 'enterprise' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                          )}>
                             {plan.use_type}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold capitalize">
                             <Palette className="w-3.5 h-3.5" />
                             {plan.theme} Skin
                          </div>
                       </div>
                    </td>
                    <td className="p-6">
                       <div className="space-y-1">
                          <div className="text-gray-900 font-black flex items-baseline gap-1">
                             <span className="text-[10px] text-gray-400 font-medium">{plan.currency}</span>
                             <span className="text-lg">{Number(plan.monthly_price).toLocaleString()}</span>
                             <span className="text-[10px] text-gray-400 font-bold tracking-widest lowercase">/mo</span>
                          </div>
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                             <Zap className="w-3 h-3" />
                             {plan.total_credits.toLocaleString()} Credits
                          </div>
                       </div>
                    </td>
                    <td className="p-6 font-bold">
                       <div className="flex items-center gap-2">
                          {plan.is_active ? (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                               <CheckCircle2 className="w-4 h-4" />
                               <span className="text-xs uppercase font-black tracking-widest">Global</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-100 text-gray-400 px-3 py-1.5 rounded-xl border border-gray-200/50">
                               <XCircle className="w-4 h-4" />
                               <span className="text-xs uppercase font-black tracking-widest">Parked</span>
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="p-6 pr-10 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(plan)}
                          className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm bg-white border border-gray-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('IRREVERSIBLE! This will delete the plan and all attached subscriptions. Proceed?')) {
                                deleteMutation.mutate(plan.id);
                            }
                          }}
                          className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all shadow-sm bg-white border border-gray-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Plan Editor */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsModalOpen(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <CreditCard className="w-6 h-6 text-indigo-600" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">{editingPlan ? 'Edit Configuration' : 'Construct New Tier'}</h2>
                      <p className="text-sm text-gray-400 font-medium">Define metadata and token economy constants.</p>
                   </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-all text-gray-400 hover:text-gray-900 shadow-sm border border-gray-100 bg-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-8 pt-4 flex items-center gap-1 border-b border-gray-50 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'basic', label: 'Identity', icon: Globe },
                  { id: 'pricing', label: 'Token Economy', icon: Zap },
                  { id: 'features', label: 'Ecosystem Features', icon: ListOrdered },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "px-6 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2.5 transition-all border-b-2 relative",
                      activeTab === tab.id ? "text-indigo-600 border-indigo-600" : "text-gray-400 border-transparent hover:text-gray-600"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="space-y-10">
                  {/* BASIC TAB */}
                  {activeTab === 'basic' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Plan Display Name</label>
                             <input 
                                required
                                className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. المؤسسة (Enterprise)"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Unique Plan ID (System Identifier)</label>
                             <input 
                                required
                                className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-indigo-600"
                                value={formData.plan_id}
                                onChange={e => setFormData({...formData, plan_id: e.target.value})}
                                placeholder="e.g. plus-unlimited"
                             />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Marketing Description</label>
                              <textarea 
                                 className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium h-24 resize-none"
                                 value={formData.description}
                                 onChange={e => setFormData({...formData, description: e.target.value})}
                                 placeholder="Summary shown on listing cards..."
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Display Priority Order</label>
                              <input 
                                 type="number"
                                 className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-indigo-600"
                                 value={formData.display_order}
                                 onChange={e => setFormData({...formData, display_order: Number(e.target.value)})}
                                 placeholder="0 (First), 1, 2..."
                              />
                           </div>
                       </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Account Type</label>
                              <select 
                                 className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                 value={formData.use_type}
                                 onChange={e => setFormData({...formData, use_type: e.target.value as any})}
                              >
                                 <option value="individual">Individual / Pilot</option>
                                 <option value="enterprise">Multi-Seat Enterprise</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Visual Theme</label>
                              <select 
                                 className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                 value={formData.theme}
                                 onChange={e => setFormData({...formData, theme: e.target.value as any})}
                              >
                                 <option value="cream">Cream (Classic)</option>
                                 <option value="dark">Dark (Premium)</option>
                                 <option value="light">High Contrast Light</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Plan Badge</label>
                              <input 
                                 className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-amber-600"
                                 value={formData.badge}
                                 onChange={e => setFormData({...formData, badge: e.target.value})}
                                 placeholder="e.g. MOST POPULAR"
                              />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-2">
                              <Layers className="w-3 h-3 text-indigo-500" />
                              AI Model Permissions (Comma Separated)
                           </label>
                           <input 
                              className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium"
                              value={formData.allowed_modals?.join(', ')}
                              onChange={e => setFormData({...formData, allowed_modals: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                              placeholder="e.g. gpt-4o-mini, gpt-4o, deepseek-chat"
                           />
                           <div className="flex flex-wrap gap-2 mt-2">
                              {formData.allowed_modals?.map((modal, i) => (
                                 <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-tighter rounded-md border border-indigo-100">
                                    {modal}
                                 </span>
                              ))}
                           </div>
                        </div>

                       <div className="flex flex-wrap gap-8 items-center pt-4 px-2">
                          <label className="flex items-center gap-4 cursor-pointer group">
                             <div 
                                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                                className={cn(
                                   "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                   formData.is_active ? "bg-emerald-500" : "bg-slate-300"
                                )}
                             >
                                <div className={cn("w-4 h-4 bg-white rounded-full transition-all", formData.is_active ? "translate-x-6" : "translate-x-0")} />
                             </div>
                             <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Is Active (Publicly Viewable)</span>
                          </label>

                          <label className="flex items-center gap-4 cursor-pointer group">
                             <div 
                                onClick={() => setFormData({...formData, is_popular: !formData.is_popular})}
                                className={cn(
                                   "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                   formData.is_popular ? "bg-amber-400" : "bg-slate-300"
                                )}
                             >
                                <div className={cn("w-4 h-4 bg-white rounded-full transition-all", formData.is_popular ? "translate-x-6" : "translate-x-0")} />
                             </div>
                             <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Mark as Featured Tier</span>
                          </label>
                       </div>
                    </motion.div>
                  )}

                  {/* PRICING TAB */}
                  {activeTab === 'pricing' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                       <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                           <div className="flex items-center gap-3 mb-6">
                              <Zap className="w-5 h-5 text-indigo-600" />
                              <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Resource Quotas</h4>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Total Monthly Credits</label>
                                 <input 
                                    type="number"
                                    className="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 outline-none font-black text-xl text-indigo-600"
                                    value={formData.total_credits}
                                    onChange={e => setFormData({...formData, total_credits: Number(e.target.value)})}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Seat Limit (Max Users)</label>
                                 <input 
                                    type="number"
                                    className="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 outline-none font-black text-xl text-indigo-600"
                                    value={formData.max_users || 0}
                                    onChange={e => setFormData({...formData, max_users: e.target.value ? Number(e.target.value) : null})}
                                 />
                                 <p className="text-[10px] font-bold text-indigo-300 ml-1 italic">Enter 0 for unlimited individual seats.</p>
                              </div>
                           </div>
                       </div>

                       <div className="space-y-6 px-2">
                          <div className="flex items-center gap-3 mb-2">
                             <CreditCard className="w-5 h-5 text-gray-400" />
                             <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Billing Structure</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Currency Code</label>
                                <input 
                                   className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none font-bold text-center"
                                   value={formData.currency}
                                   onChange={e => setFormData({...formData, currency: e.target.value.toUpperCase()})}
                                   placeholder="UGX / USD"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Monthly Billing</label>
                                <input 
                                   className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none font-black text-lg"
                                   value={formData.monthly_price}
                                   onChange={e => setFormData({...formData, monthly_price: e.target.value})}
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Monthly (Paid Annually)</label>
                                <input 
                                   className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none font-black text-lg text-emerald-600"
                                   value={formData.annual_price}
                                   onChange={e => setFormData({...formData, annual_price: e.target.value})}
                                />
                             </div>
                          </div>
                          
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Annual Total Billed Amount (Lump sum)</label>
                             <input 
                                className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none font-black text-lg"
                                value={formData.annual_billed}
                                onChange={e => setFormData({...formData, annual_billed: e.target.value})}
                                placeholder="Total annual charge..."
                             />
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {/* FEATURES TAB */}
                  {activeTab === 'features' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                       <div className="flex items-center justify-between px-2">
                          <div>
                             <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Feature Matrix</h4>
                             <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Define what value users get in this tier.</p>
                          </div>
                          <button 
                             type="button"
                             onClick={addFeature}
                             className="px-6 py-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
                          >
                             Append Feature
                          </button>
                       </div>

                       <div className="space-y-3">
                          {formData.features?.map((feature, idx) => (
                            <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-6 relative group">
                               <div className="flex-1 space-y-2">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Global Feature Instance</label>
                                  <select
                                     className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm"
                                     value={feature.feature_id || ''}
                                     onChange={(e) => {
                                        const fId = Number(e.target.value);
                                        const globalFeat = globalFeatures.find((g: Feature) => g.id === fId);
                                        updateFeature(idx, 'feature_id', fId);
                                        updateFeature(idx, 'text', globalFeat?.text || '');
                                     }}
                                  >
                                     <option value="" disabled>Select a feature...</option>
                                     {globalFeatures.map((gf: Feature) => (
                                         <option key={gf.id} value={gf.id}>{gf.text}</option>
                                     ))}
                                  </select>
                               </div>
                               <div className="flex items-center gap-8 pt-4">
                                  <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => updateFeature(idx, 'included', !feature.included)}>
                                     <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Included</span>
                                     <div className={cn("w-10 h-5 rounded-full p-0.5 transition-all", feature.included ? "bg-emerald-500" : "bg-slate-300")}>
                                        <div className={cn("w-4 h-4 bg-white rounded-full transition-all", feature.included ? "translate-x-5" : "0")} />
                                     </div>
                                  </div>
                                  <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => updateFeature(idx, 'highlight', !feature.highlight)}>
                                     <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Highlight</span>
                                     <div className={cn("w-10 h-5 rounded-full p-0.5 transition-all", feature.highlight ? "bg-amber-400" : "bg-slate-300")}>
                                        <div className={cn("w-4 h-4 bg-white rounded-full transition-all", feature.highlight ? "translate-x-5" : "0")} />
                                     </div>
                                  </div>
                                  <button 
                                     type="button"
                                     onClick={() => removeFeature(idx)}
                                     className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mt-3"
                                  >
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                          ))}

                          {(formData.features?.length || 0) === 0 && (
                            <div className="p-16 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4">
                               <div className="p-4 bg-slate-50 rounded-full">
                                  <Info className="w-8 h-8 text-slate-300" />
                               </div>
                               <div>
                                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Features Registered</p>
                                  <p className="text-xs text-gray-300 mt-1">This tier will appear empty on the landing page.</p>
                               </div>
                            </div>
                          )}
                       </div>
                    </motion.div>
                  )}
                </div>
              </form>

              {/* Modal Footer */}
              <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <AlertCircle className="w-4 h-4 text-gray-300" />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Changes are destructive to linked subscriptions.</span>
                </div>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                    Discard Changes
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-10 py-3.5 bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3 disabled:opacity-50"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                       <Save className="w-4 h-4" />
                    )}
                    {editingPlan ? 'Commit Configuration' : 'Release Tier'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Global Feature Management Modal */}
      <AnimatePresence>
        {isFeatureModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsFeatureModalOpen(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/10">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-50 rounded-2xl">
                      <ListOrdered className="w-6 h-6 text-indigo-600" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">Feature Registry</h2>
                      <p className="text-sm text-gray-400 font-medium">Standardize features across all subscription tiers.</p>
                   </div>
                </div>
                <button onClick={() => setIsFeatureModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                {/* Create New Feature */}
                <div className="mb-10 bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100/50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900 mb-4 ml-1">Register New Capability</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        <input 
                            className="flex-1 px-5 py-4 bg-white border border-indigo-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-600/5 transition-all"
                            placeholder="Feature name (e.g. Multi-seat Dashboard)"
                            value={newFeatureText}
                            onChange={e => setNewFeatureText(e.target.value)}
                        />
                        <input 
                            type="number"
                            className="w-full md:w-24 px-4 py-4 bg-white border border-indigo-100 rounded-2xl outline-none font-black text-center"
                            placeholder="Order"
                            value={newFeatureOrder}
                            onChange={e => setNewFeatureOrder(Number(e.target.value))}
                        />
                        <button 
                            onClick={() => createFeatureMutation.mutate({ text: newFeatureText, order: newFeatureOrder })}
                            disabled={!newFeatureText || createFeatureMutation.isPending}
                            className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {createFeatureMutation.isPending ? 'Saving...' : 'Add'}
                        </button>
                    </div>
                </div>

                {/* List Existing Features */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Global Catalog</h3>
                    {globalFeatures.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                            <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px]">Registry is empty</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {globalFeatures.map((feat: Feature) => (
                                <div key={feat.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-100">
                                            {feat.order}
                                        </div>
                                        <span className="font-bold text-gray-700">{feat.text}</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('Delete this feature? It will be removed from all plans using it.')) {
                                                deleteFeatureMutation.mutate(feat.id);
                                            }
                                        }}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              </div>

              <div className="p-8 border-t border-gray-50 flex justify-end bg-slate-50/10">
                <button 
                    onClick={() => setIsFeatureModalOpen(false)}
                    className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
                >
                    Close Registry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

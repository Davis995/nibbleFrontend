"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService, OrganisationService } from '../services/api';
import { 
  Users, Search, Plus, Filter, Edit2, Trash2, 
  CheckCircle2, XCircle, Shield, Briefcase, GraduationCap, 
  Building2, Mail, Phone, Calendar, Info, 
  AlertCircle, Save, X, ChevronLeft, ChevronRight,
  MoreHorizontal, UserCheck, UserX, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  user_type: 'individual' | 'enterprise' | 'nibble';
  organisation: number | null;
  role: string;
  effective_role: string;
  phone_number: string | null;
  date_of_birth: string | null;
  is_verified: boolean;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  last_login_at: string | null;
  password?: string;
}

interface Organisation {
  id: number;
  name: string;
  slug?: string;
}

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'student',
    user_type: 'individual',
    is_active: true,
    is_verified: false,
    organisation: null
  });

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: () => UserService.fetchAll({ 
      search, 
      role: roleFilter === 'all' ? undefined : roleFilter,
      page,
      page_size: pageSize
    }),
  });

  const { data: organisationsResponse } = useQuery({
    queryKey: ['admin-organisations-flat'],
    queryFn: () => OrganisationService.fetchAll({ limit: 100 }), // Simplified flat list for dropdown
  });

  const users = (usersResponse as any)?.results || [] as User[];
  const totalCount = (usersResponse as any)?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const organisations = (organisationsResponse as any)?.data?.schools || [] as Organisation[];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => UserService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated successfully');
      setIsModalOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update user')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => UserService.update(id, { is_active: active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status toggled');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to toggle status')
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<User>) => UserService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User created successfully');
      setIsModalOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create user')
  });

  useEffect(() => {
    if (editingUser) {
      setFormData(editingUser);
    } else {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'student',
        user_type: 'individual',
        is_active: true,
        is_verified: false,
        organisation: null
      });
    }
  }, [editingUser]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="w-4 h-4" />;
      case 'teacher': return <Briefcase className="w-4 h-4" />;
      case 'school_admin': return <Building2 className="w-4 h-4" />;
      case 'operator': return <Crown className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-purple-50 rounded-2xl">
                <Users className="w-6 h-6 text-purple-600" />
             </div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Directory</h1>
          </div>
          <p className="text-gray-500 font-medium pl-14">
            Manage member accounts, assign administrative roles, and monitor engagement across the platform.
          </p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-3 px-8 py-4 bg-purple-600 text-white font-black uppercase tracking-widest text-[11px] rounded-[1.5rem] hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Member
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {/* Table Controls */}
        <div className="p-8 border-b border-gray-50 flex flex-col xl:flex-row items-center justify-between gap-6 bg-slate-50/30">
          <div className="flex flex-wrap items-center gap-3">
             {['all', 'student', 'teacher', 'school_admin', 'operator'].map((role) => (
                <button
                  key={role}
                  onClick={() => { setRoleFilter(role); setPage(1); }}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                    roleFilter === role 
                      ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200" 
                      : "bg-white text-gray-400 border-gray-100 hover:border-purple-200 hover:text-purple-600"
                  )}
                >
                  {role}
                </button>
             ))}
          </div>
          
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by name, email, or phone..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-32 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Syncing Accounts...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-100">
                    <th className="p-6 pl-10">User Identity</th>
                    <th className="p-6">Role & Permissions</th>
                    <th className="p-6">Type & Org</th>
                    <th className="p-6">Account Status</th>
                    <th className="p-6 pr-10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {users.map((user: User) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-slate-50/80 transition-all group">
                      <td className="p-6 pl-10">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                              {user.first_name?.[0] || user.username[0].toUpperCase()}
                           </div>
                           <div>
                              <div className="font-bold text-gray-900">{user.full_name || user.username}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                 <Mail className="w-3 h-3" />
                                 {user.email}
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="p-6">
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 w-fit">
                            <span className="text-purple-600">{getRoleIcon(user.role)}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{user.role}</span>
                         </div>
                      </td>
                      <td className="p-6">
                         <div className="space-y-1">
                            <div className="text-xs font-bold text-gray-700 capitalize">{user.user_type} Account</div>
                            {user.organisation ? (
                               <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {organisations.find((o: Organisation) => o.id === user.organisation)?.name || 'Linked School'}
                               </div>
                            ) : (
                               <div className="text-[10px] text-gray-300 font-medium italic">No Organisation</div>
                            )}
                         </div>
                      </td>
                      <td className="p-6">
                         <div className="flex flex-wrap gap-2">
                            {user.is_active ? (
                               <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-tight border border-emerald-100">Active</div>
                            ) : (
                               <div className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[9px] font-black uppercase tracking-tight border border-red-100">Disabled</div>
                            )}
                            {user.is_verified && (
                               <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-tight border border-blue-100">Verified</div>
                            )}
                         </div>
                      </td>
                      <td className="p-6 pr-10 text-right">
                        <div className="flex items-center justify-end gap-2 text-gray-400">
                          <button 
                            onClick={() => handleOpenEdit(user)}
                            className="p-2.5 hover:bg-white hover:text-purple-600 hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => toggleStatusMutation.mutate({ id: user.id, active: !user.is_active })}
                            className={cn(
                              "p-2.5 rounded-xl transition-all border border-transparent hover:border-gray-100 hover:shadow-sm",
                              user.is_active ? "hover:text-red-600 hover:bg-red-50" : "hover:text-emerald-600 hover:bg-emerald-50"
                            )}
                          >
                            {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-8 bg-slate-50/50 border-t border-gray-50 flex items-center justify-between">
               <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4">
                  Showing <span className="text-gray-900">{users.length}</span> of <span className="text-gray-900">{totalCount}</span> Accounts
               </div>
               <div className="flex items-center gap-2">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-purple-600 hover:border-purple-200 transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1 mx-2">
                     {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                       const pageNum = i + 1; // Simplified pagination for demo
                       return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            "w-10 h-10 rounded-xl text-xs font-black transition-all",
                            page === pageNum ? "bg-purple-600 text-white shadow-lg shadow-purple-100" : "bg-white text-gray-400 border border-transparent hover:border-gray-100"
                          )}
                        >
                          {pageNum}
                        </button>
                       );
                     })}
                  </div>
                  <button 
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-purple-600 hover:border-purple-200 transition-all disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
               </div>
            </div>
          </>
        )}
      </div>

      {/* Modal - User Editor */}
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
               className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                      {editingUser ? <Edit2 className="w-6 h-6 text-purple-600" /> : <Plus className="w-6 h-6 text-purple-600" />}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {editingUser ? 'Account Parameters' : 'New Member Profile'}
                      </h2>
                      <p className="text-sm text-gray-400 font-medium">
                        {editingUser ? 'Update account level, roles, and platform access.' : 'Initialize a new system account with specific roles.'}
                      </p>
                   </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-all text-gray-400 hover:text-gray-900 shadow-sm border border-gray-100 bg-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="space-y-10">
                   {/* Primary Identity Section */}
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">First Name</label>
                             <input 
                                className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-purple-500/10"
                                value={formData.first_name || ''}
                                onChange={e => setFormData({...formData, first_name: e.target.value})}
                             />
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Last Name</label>
                             <input 
                                className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-purple-500/10"
                                value={formData.last_name || ''}
                                onChange={e => setFormData({...formData, last_name: e.target.value})}
                             />
                         </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Primary Email Address</label>
                          <div className="relative">
                             <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                             <input 
                                type="email"
                                className={cn(
                                  "w-full pl-12 pr-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-purple-500/10",
                                  editingUser && "text-gray-500 opacity-70 cursor-not-allowed"
                                )}
                                disabled={!!editingUser}
                                value={formData.email || ''}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                             />
                          </div>
                      </div>
                      
                      {!editingUser && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Initial Password (Optional)</label>
                            <input 
                               type="password"
                               placeholder="Set a temporary password..."
                               className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-purple-500/10"
                               onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                      )}
                   </div>

                   {/* Role & Access Section */}
                   <div className="bg-purple-50/50 p-8 rounded-[2.5rem] border border-purple-100 space-y-6">
                      <h4 className="text-xs font-black text-purple-900 uppercase tracking-widest flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Role Assignment
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 ml-1">Global Role</label>
                             <select 
                                className="w-full px-5 py-4 bg-white border border-purple-100 rounded-2xl outline-none font-black text-purple-600 focus:ring-4 focus:ring-purple-600/10"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value})}
                             >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="school_admin">School Admin</option>
                                <option value="operator">Operator (Admin)</option>
                                <option value="sale_manager">Sales Manager</option>
                             </select>
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 ml-1">User Account Type</label>
                             <select 
                                className="w-full px-5 py-4 bg-white border border-purple-100 rounded-2xl outline-none font-black text-purple-600 focus:ring-4 focus:ring-purple-600/10"
                                value={formData.user_type}
                                onChange={e => setFormData({...formData, user_type: e.target.value as any})}
                             >
                                <option value="individual">Individual</option>
                                <option value="enterprise">Enterprise / School</option>
                                <option value="nibble">Nibble Staff</option>
                             </select>
                         </div>
                      </div>

                      {formData.user_type === 'enterprise' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                            <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 ml-1">Associated Organisation</label>
                            <select 
                               className="w-full px-5 py-4 bg-white border border-purple-100 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-purple-600/10"
                               value={formData.organisation || ''}
                               onChange={e => setFormData({...formData, organisation: e.target.value ? Number(e.target.value) : null})}
                            >
                               <option value="">Select an Organisation...</option>
                               {organisations.map((org: Organisation) => (
                                 <option key={org.id} value={org.id}>{org.name}</option>
                               ))}
                            </select>
                        </div>
                      )}
                   </div>

                   {/* Toggles */}
                   <div className="flex flex-wrap gap-10 px-2 pt-2">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div 
                          onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                          className={cn(
                            "w-12 h-6 rounded-full p-1 transition-all duration-300",
                            formData.is_active ? "bg-emerald-500 shadow-lg shadow-emerald-100" : "bg-slate-300"
                          )}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-sm", formData.is_active ? "translate-x-6" : "translate-x-0")} />
                        </div>
                        <div>
                           <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest block">Account Active</span>
                           <span className="text-[9px] text-gray-400 font-bold uppercase">Enable or restrict system access.</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div 
                          onClick={() => setFormData({...formData, is_verified: !formData.is_verified})}
                          className={cn(
                            "w-12 h-6 rounded-full p-1 transition-all duration-300",
                            formData.is_verified ? "bg-blue-500 shadow-lg shadow-blue-100" : "bg-slate-300"
                          )}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-sm", formData.is_verified ? "translate-x-6" : "translate-x-0")} />
                        </div>
                        <div>
                           <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest block">Verified Status</span>
                           <span className="text-[9px] text-gray-400 font-bold uppercase">Mark email as validated.</span>
                        </div>
                      </label>
                   </div>
                </div>
              </form>

              {/* Modal Footer */}
              <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <AlertCircle className="w-4 h-4 text-amber-500" />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administrative changes are audited globally.</span>
                </div>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                    Discard
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending || createMutation.isPending}
                    className="px-10 py-3.5 bg-purple-600 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20 flex items-center gap-3 disabled:opacity-50"
                  >
                    {updateMutation.isPending || createMutation.isPending ? (
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                       editingUser ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />
                    )}
                    {editingUser ? 'Commit Updates' : 'Create Account'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

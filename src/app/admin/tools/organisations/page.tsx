"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganisationService } from '../services/api';
import { Building2, Plus, AlertTriangle, AlertCircle, TrendingUp, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OrganisationsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: schoolsData, isLoading: isLoadingSchools } = useQuery({
    queryKey: ['admin-schools', search],
    queryFn: () => OrganisationService.fetchAll({ search, limit: 100 }),
  });

  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['admin-schools-alerts'],
    queryFn: OrganisationService.fetchAlerts,
  });

  const createMutation = useMutation({
    mutationFn: OrganisationService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schools'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to create school');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    createMutation.mutate({
      name: data.name,
      school_email: data.school_email,
      max_students: Number(data.max_students),
      admin_username: data.admin_email, // Use email as username
      admin_email: data.admin_email,
      admin_password: data.admin_password,
      admin_first_name: data.admin_first_name,
      admin_last_name: data.admin_last_name,
    });
  };

  const schools = schoolsData?.data?.schools || [];
  const alertsList = alertsData?.data || [];
  
  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Organisations Management
          </h1>
          <p className="text-gray-500 font-medium mt-2">
            Monitor attached schools, manage quotas, and view automated risk alerts.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add School
        </button>
      </div>

      {alertsList.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" /> Active Risk Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {alertsList.map((schoolAlert: any) => (
              <div key={schoolAlert.school_id} className="bg-red-50 border border-red-100 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">{schoolAlert.school_name}</h4>
                  <Link href={`/admin/tools/organisations/${schoolAlert.school_id}`} className="text-xs font-bold text-red-600 hover:text-red-800">Review</Link>
                </div>
                <div className="space-y-2">
                  {schoolAlert.alerts.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-800 bg-white/50 p-2 rounded-lg">
                      {a.type === 'unusual_usage_spike' ? <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                      <span className="font-medium">{a.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Directory</h3>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search schools..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoadingSchools ? (
          <div className="p-10 text-center text-gray-400">Loading directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-100">
                  <th className="p-4 pl-6">Organisation</th>
                  <th className="p-4">Plan & Status</th>
                  <th className="p-4">Limits</th>
                  <th className="p-4">Usage</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {schools.map((school: any) => (
                  <tr key={school.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-gray-900">{school.name}</div>
                      <div className="text-xs text-gray-400">{school.school_email}</div>
                    </td>
                    <td className="p-4">
                      {school.is_subscription_active ? (
                        <span className="px-2 py-1 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg">{school.plan_name || 'Active'}</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-lg">Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      <span className="font-bold text-gray-900">{school.student_count}</span> / {school.max_students}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                         {alertsList.find((a: any) => a.school_id === school.id) ? (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                         ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                         )}
                         <span className="text-xs text-gray-500">{alertsList.find((a: any) => a.school_id === school.id) ? 'Risk Detected' : 'Normal'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(school.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Link 
                        href={`/admin/tools/organisations/${school.id}`}
                        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add New Organisation</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full">&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">School Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">School Name</label>
                    <input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl" placeholder="Liberty High" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Contact Email</label>
                    <input name="school_email" type="email" required className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl" placeholder="admin@liberty.edu" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Max Students Quota</label>
                    <input name="max_students" type="number" required defaultValue={100} className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Administrator Setup</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Admin First Name (Optional)</label>
                    <input name="admin_first_name" className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Admin Last Name (Optional)</label>
                    <input name="admin_last_name" className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-sm font-bold text-gray-700">Admin Login Email (Username)</label>
                    <input name="admin_email" type="email" required className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl" placeholder="principal@liberty.edu" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-sm font-bold text-gray-700">Temporary Password</label>
                    <input name="admin_password" required minLength={8} className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl" placeholder="Choose a strong password" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                  {createMutation.isPending ? 'Creating...' : 'Provision School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

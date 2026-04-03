"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Settings, Layers, Box, Cpu, Bell, 
  ChevronDown, ChevronRight, BarChart3, ListOrdered, 
  Menu, X, Fingerprint, Database, Building2, Package, ShieldCheck, Users,
  Receipt, LogOut, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthContext';

interface SidebarItemProps {
  title: string;
  icon: React.ElementType;
  children?: { title: string; href: string; icon: React.ElementType }[];
  href?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  active?: boolean;
}

const SidebarItem = ({ title, icon: Icon, children, href, isOpen, onToggle, active }: SidebarItemProps) => {
  const pathname = usePathname();
  const hasChildren = children && children.length > 0;
  
  const content = (
    <div 
      onClick={onToggle}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
        active && !hasChildren 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${active && !hasChildren ? 'text-white' : ''}`} />
        <span className="font-semibold text-sm">{title}</span>
      </div>
      {hasChildren && (
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 opacity-50" />
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="space-y-1">
      {href ? <Link href={href}>{content}</Link> : content}
      
      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden pl-9 space-y-1"
          >
            {children.map((child, idx) => (
              <Link 
                key={idx} 
                href={child.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === child.href 
                    ? 'text-blue-600 font-bold bg-blue-50/50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <child.icon className="w-4 h-4" />
                {child.title}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AdminToolsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!user.is_superuser) {
        router.push('/dashboard');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, isLoading, router]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white/80 backdrop-blur-xl border-r border-gray-100 shadow-[20px_0_40px_rgba(0,0,0,0.02)] z-30">
        <div className="h-20 flex items-center px-8 border-b border-gray-50">
          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            Nibble AI
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          {/* General Section */}
          <div className="space-y-2">
            <h3 className="px-4 text-[11px] font-black text-gray-300 uppercase tracking-[0.2em]">General</h3>
            <SidebarItem 
              title="Dashboard" 
              icon={LayoutDashboard} 
              href="/admin/tools" 
              active={pathname === '/admin/tools'}
            />
          </div>

          {/* AI Tool Management Section */}
          <div className="space-y-2">
            <h3 className="px-4 text-[11px] font-black text-gray-300 uppercase tracking-[0.2em]">Configuration</h3>
            <SidebarItem 
              title="AI Tool Management" 
              icon={Database}
              isOpen={openSections.includes('tools')}
              onToggle={() => toggleSection('tools')}
              active={pathname.includes('/tools/library') || pathname.includes('/tools/categories') || pathname.includes('/tools/inputs') || pathname.includes('/tools/models')}
              children={[
                { title: 'Tool Categories', href: '/admin/tools/categories', icon: Layers },
                { title: 'AI Tools', href: '/admin/tools/library', icon: Box },
                { title: 'Model Endpoints', href: '/admin/tools/models', icon: Terminal },
                { title: 'Global Inputs', href: '/admin/tools/inputs', icon: Settings },
              ]}
            />
          </div>

          {/* AI Usage Management Section */}
          <div className="space-y-2">
            <h3 className="px-4 text-[11px] font-black text-gray-300 uppercase tracking-[0.2em]">Analytics</h3>
            <SidebarItem 
              title="AI Usage Management" 
              icon={Fingerprint}
              isOpen={openSections.includes('usage')}
              onToggle={() => toggleSection('usage')}
              active={pathname.includes('/logs') || pathname.includes('/analytics')}
              children={[
                { title: 'AI Logs', href: '/admin/tools/logs', icon: ListOrdered },
                { title: 'Usage Analytics', href: '/admin/tools/analytics', icon: BarChart3 },
              ]}
            />
          </div>

          {/* Organisation Management Section */}
          <div className="space-y-2">
            <h3 className="px-4 text-[11px] font-black text-gray-300 uppercase tracking-[0.2em]">Platform</h3>
            <SidebarItem 
              title="Organisations" 
              icon={Building2} 
              href="/admin/tools/organisations" 
              active={pathname.includes('/organisations')}
            />
            <SidebarItem 
              title="Plan Management" 
              icon={Package} 
              href="/admin/tools/plans" 
              active={pathname.includes('/plans')}
            />
            <SidebarItem 
              title="User Management" 
              icon={Users} 
              href="/admin/tools/users" 
              active={pathname.includes('/users')}
            />
            <SidebarItem 
              title="Payment Management" 
              icon={Receipt} 
              href="/admin/tools/payments" 
              active={pathname.includes('/payments')}
            />
          </div>
        </div>

        {/* User Profile Hook in Sidebar */}
        <div className="p-4 border-t border-gray-50">
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200 uppercase">
              {user?.username?.[0] || 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{user?.username || 'Admin User'}</p>
              <p className="text-[10px] text-gray-400 truncate">System Superuser</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              {pathname === '/admin/tools' && 'Dashboard Overview'}
              {pathname === '/admin/tools/library' && 'AI Tools Library'}
              {pathname === '/admin/tools/categories' && 'Tool Categories'}
              {pathname === '/admin/tools/logs' && 'System Activity Logs'}
              {pathname === '/admin/tools/analytics' && 'AI Usage Analytics'}
              {pathname.includes('/admin/tools/organisations') && 'Organisation Management'}
              {pathname.includes('/admin/tools/plans') && 'Subscription Plan Management'}
              {pathname.includes('/admin/tools/users') && 'User Account Management'}
              {pathname.includes('/admin/tools/payments') && 'Payment & Transaction Management'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Internal Server</span>
                <span className="text-[9px] text-gray-400 mt-1">v2.4.0-auth</span>
            </div>
            <button className="relative p-2.5 text-gray-400 hover:text-blue-600 rounded-2xl hover:bg-blue-50 transition-all group">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <div className="flex-1 overflow-auto bg-slate-50/50 relative px-4 py-8 md:px-8 custom-scrollbar">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 md:hidden shadow-2xl flex flex-col"
            >
               {/* Mobile Header */}
               <div className="h-20 flex items-center justify-between px-8 border-b border-gray-50">
                  <span className="text-xl font-black text-blue-600 flex items-center gap-3">
                    <Cpu className="w-6 h-6" />
                    Nibble AI
                  </span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400">
                    <X className="w-6 h-6" />
                  </button>
               </div>
               
               {/* Mobile Nav Content (Simplified for brevity, can replicate desktop) */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* ... mobile nav items ... */}
                  <p className="text-xs text-gray-400 font-medium">Use desktop for advanced analytics.</p>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

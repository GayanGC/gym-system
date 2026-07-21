'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dumbbell, 
  Building2, 
  Users, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Coins,
  MapPin,
  TrendingUp,
  LayoutDashboard,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { getGyms, updateGymSubscription, getUsers, Gym } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [totalTrainers, setTotalTrainers] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);

  // Load metrics & gyms
  useEffect(() => {
    const allGyms = getGyms();
    const allUsers = getUsers();
    
    setGyms(allGyms);
    setTotalTrainers(allUsers.filter((u) => u.role === 'TRAINER').length);
    setTotalMembers(allUsers.filter((u) => u.role === 'MEMBER').length);
  }, []);

  const handleStatusChange = (gymId: string, gymName: string, status: 'Trial' | 'Active' | 'Expired') => {
    updateGymSubscription(gymId, status);
    
    // Refresh state
    setGyms(getGyms());
    
    toast({
      title: 'Subscription Updated',
      description: `${gymName} is now set to ${status}.`,
      type: 'success',
    });
  };

  const handleLogout = () => {
    toast({ title: 'Logged Out', description: 'Admin session terminated.', type: 'info' });
    router.push('/login');
  };

  // Metric aggregates
  const activeGyms = gyms.filter((g) => g.subscriptionStatus === 'Active').length;
  const trialGyms = gyms.filter((g) => g.subscriptionStatus === 'Trial').length;
  const expiredGyms = gyms.filter((g) => g.subscriptionStatus === 'Expired').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      {/* Sidebar background effect */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="bg-slate-900/40 border-b border-slate-900 px-6 py-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Dumbbell className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">
            FitPulse<span className="text-rose-500">.ADMIN</span>
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5" /> Logout
        </button>
      </header>

      {/* Main Panel Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-10 space-y-8 z-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">SaaS Central Registry</h1>
            <p className="text-xs text-slate-500 mt-1">Configure global memberships, billing status, and monitor tenants.</p>
          </div>
          <div className="px-4 py-2.5 bg-slate-900 border border-rose-500/20 rounded-xl flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Global Master Node</span>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tenancies</CardTitle>
              <Building2 className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white font-mono">{gyms.length}</div>
              <p className="text-xs text-slate-500 mt-1">Gym portals configured</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Global Members</CardTitle>
              <Users className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white font-mono">{totalMembers}</div>
              <p className="text-xs text-slate-500 mt-1">Across all fitness centers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Global Coaches</CardTitle>
              <UserCheck className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white font-mono">{totalTrainers}</div>
              <p className="text-xs text-slate-500 mt-1">Personal trainers registry</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Revenue</CardTitle>
              <Coins className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                ${activeGyms * 99}
              </div>
              <p className="text-xs text-slate-500 mt-1">Based on $99/mo licensing</p>
            </CardContent>
          </Card>
        </div>

        {/* Tenant List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Onboarded Gym Portals</CardTitle>
            <CardDescription>Verify subscription status and manage licensing privileges.</CardDescription>
          </CardHeader>
          <CardContent>
            {gyms.length === 0 ? (
              <div className="h-64 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
                <Building2 className="h-10 w-10 text-slate-600 mb-3" />
                <p className="text-sm text-slate-400 font-semibold">No gyms onboarded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Gym ID</th>
                      <th className="py-3 px-4">Gym Name</th>
                      <th className="py-3 px-4">Owner Contact</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">License Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {gyms.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{g.id}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{g.gymName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Trial Ends: {new Date(g.trialEndsAt).toLocaleDateString()}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-xs text-slate-200 font-semibold">{g.ownerName}</p>
                          <p className="text-[10px] text-slate-500">{g.email}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-rose-500 shrink-0" /> {g.location}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {g.subscriptionStatus === 'Active' && (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/20 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          )}
                          {g.subscriptionStatus === 'Trial' && (
                            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-blue-500/20 inline-flex items-center gap-1">
                              <Sparkles className="h-3 w-3 animate-spin duration-1000" /> Trial
                            </span>
                          )}
                          {g.subscriptionStatus === 'Expired' && (
                            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-rose-500/20 inline-flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> Expired
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleStatusChange(g.id, g.gymName, 'Active')}
                              disabled={g.subscriptionStatus === 'Active'}
                              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 text-[10px] font-bold uppercase rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              Activate
                            </button>

                            <button
                              onClick={() => handleStatusChange(g.id, g.gymName, 'Expired')}
                              disabled={g.subscriptionStatus === 'Expired'}
                              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-[10px] font-bold uppercase rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              Expire
                            </button>

                            <button
                              onClick={() => handleStatusChange(g.id, g.gymName, 'Trial')}
                              disabled={g.subscriptionStatus === 'Trial'}
                              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-blue-500/40 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 text-[10px] font-bold uppercase rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              Trial
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

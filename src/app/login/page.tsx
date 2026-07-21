'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, ShieldAlert, UserCheck, Users, Mail, Phone, Lock, Hash, ArrowRight, Activity, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { getGyms, getUsers, User } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type LoginTab = 'owner_admin' | 'trainer' | 'member';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<LoginTab>('owner_admin');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Simulated password
  const [phone, setPhone] = useState('');
  const [gymId, setGymId] = useState('');
  const [loading, setLoading] = useState(false);

  // Form submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const users = getUsers();

      if (activeTab === 'owner_admin') {
        // Super Admin or Gym Owner
        if (email.toLowerCase() === 'admin@fitpulse.ai') {
          toast({
            title: 'Logged in as Super Admin',
            description: 'System Management Panel activated.',
            type: 'success',
          });
          router.push('/admin');
          return;
        }

        const foundOwner = users.find((u) => u.email?.toLowerCase() === email.toLowerCase() && u.role === 'OWNER');
        if (foundOwner && foundOwner.gymId) {
          toast({
            title: 'Welcome Back',
            description: `Logged in as Gym Owner for ${foundOwner.name}.`,
            type: 'success',
          });
          router.push(`/dashboard?gym_id=${foundOwner.gymId}`);
        } else {
          toast({
            title: 'Login Failed',
            description: 'Invalid credentials or no owner found with this email.',
            type: 'error',
          });
          setLoading(false);
        }
      } else if (activeTab === 'trainer') {
        // Trainer Login
        const foundTrainer = users.find((u) => u.phone === phone && u.role === 'TRAINER');
        if (foundTrainer && foundTrainer.gymId) {
          toast({
            title: 'Trainer Portal Active',
            description: `Hello, Coach ${foundTrainer.name}!`,
            type: 'success',
          });
          router.push(`/trainer?gym_id=${foundTrainer.gymId}&trainer_id=${foundTrainer.id}`);
        } else {
          toast({
            title: 'Login Failed',
            description: 'Trainer with this phone number not found.',
            type: 'error',
          });
          setLoading(false);
        }
      } else if (activeTab === 'member') {
        // Member Portal
        const foundMember = users.find((u) => u.phone === phone && u.gymId === gymId && u.role === 'MEMBER');
        if (foundMember) {
          toast({
            title: 'Member Portal Connected',
            description: `Welcome back, ${foundMember.name}!`,
            type: 'success',
          });
          router.push(`/member?gym_id=${gymId}&member_id=${foundMember.id}`);
        } else {
          toast({
            title: 'Login Failed',
            description: 'No registered member matches this Gym ID and phone number combination.',
            type: 'error',
          });
          setLoading(false);
        }
      }
    }, 1000);
  };

  // Demo Login Actions
  const handleDemoLogin = (role: 'admin' | 'owner' | 'trainer' | 'member') => {
    setLoading(true);
    setTimeout(() => {
      if (role === 'admin') {
        toast({ title: 'Demo Login', description: 'Accessing Super Admin Dashboard.', type: 'success' });
        router.push('/admin');
      } else if (role === 'owner') {
        toast({ title: 'Demo Login', description: 'Accessing Gold\'s Gym Owner Dashboard.', type: 'success' });
        router.push('/dashboard?gym_id=GYM-101');
      } else if (role === 'trainer') {
        toast({ title: 'Demo Login', description: 'Accessing Trainer Portal (Alex Trainer).', type: 'success' });
        router.push('/trainer?gym_id=GYM-101&trainer_id=TRN-101');
      } else if (role === 'member') {
        toast({ title: 'Demo Login', description: 'Accessing Member App (Ryan Member).', type: 'success' });
        router.push('/member?gym_id=GYM-101&member_id=MBR-101');
      }
    }, 800);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="flex justify-center items-center gap-2.5 mb-4">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Dumbbell className="h-5.5 w-5.5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            FitPulse<span className="text-emerald-400">.AI</span>
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Access Your Fitness Portal</h2>
        <p className="mt-1.5 text-xs text-slate-400">Multi-tenant dashboard system configuration.</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative" glow>
          {/* Tabs header */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl mb-6">
            <button
              onClick={() => { setActiveTab('owner_admin'); setEmail(''); setPhone(''); }}
              className={`py-2 px-3 text-center rounded-lg text-xs font-bold transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'owner_admin'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Owner / Admin</span>
            </button>

            <button
              onClick={() => { setActiveTab('trainer'); setEmail(''); setPhone(''); }}
              className={`py-2 px-3 text-center rounded-lg text-xs font-bold transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'trainer'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Trainer</span>
            </button>

            <button
              onClick={() => { setActiveTab('member'); setEmail(''); setPhone(''); }}
              className={`py-2 px-3 text-center rounded-lg text-xs font-bold transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'member'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Member</span>
            </button>
          </div>

          <CardContent>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Owner / Admin Inputs */}
              {activeTab === 'owner_admin' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-emerald-400" /> Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. owner@golds.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-emerald-400" /> Security PIN / Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              {/* Trainer Inputs */}
              {activeTab === 'trainer' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-emerald-400" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +94 77 111 2222"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Member Inputs */}
              {activeTab === 'member' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5 text-emerald-400" /> Gym ID Reference
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GYM-101"
                      value={gymId}
                      onChange={(e) => setGymId(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-emerald-400" /> Member Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +94 77 444 5555"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-1.5 group cursor-pointer mt-4"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Access Dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 duration-300" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins Section */}
            <div className="mt-8 border-t border-slate-850 pt-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center mb-4 flex items-center justify-center gap-1">
                <Zap className="h-3 w-3 text-emerald-400" /> Quick-Login Demo shortcuts
              </p>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-left text-slate-300 transition-all flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="text-rose-400 text-[9px] uppercase tracking-wider">Super Admin</span>
                  <span>System Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('owner')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-left text-slate-300 transition-all flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="text-emerald-400 text-[9px] uppercase tracking-wider">Gym Owner</span>
                  <span>Gold's Gym Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('trainer')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-left text-slate-300 transition-all flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="text-cyan-400 text-[9px] uppercase tracking-wider">Trainer / Coach</span>
                  <span>Alex Trainer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('member')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-left text-slate-300 transition-all flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="text-amber-400 text-[9px] uppercase tracking-wider">Gym Member</span>
                  <span>Ryan Member</span>
                </button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

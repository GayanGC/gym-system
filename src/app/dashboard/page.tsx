'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Dumbbell, 
  Users, 
  UserCheck, 
  QrCode, 
  Plus, 
  Trash2, 
  Printer, 
  Sparkles,
  MapPin,
  Mail,
  Phone,
  LayoutDashboard,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { 
  getGym, 
  getTrainers, 
  addTrainer, 
  deleteTrainer, 
  getMembers, 
  getActiveGymId, 
  Trainer, 
  Gym,
  Member 
} from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Wrapper component to provide search params inside a Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [gymId, setGymId] = useState<string | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'trainers' | 'qr'>('overview');

  // Form states
  const [trainerForm, setTrainerForm] = useState({
    name: '',
    specialization: '',
    phone: '',
  });

  // Load gym details and dependencies
  useEffect(() => {
    let activeId = searchParams.get('gym_id');
    if (!activeId) {
      activeId = getActiveGymId();
    }

    if (!activeId) {
      // No active gym found, redirect to register page
      router.push('/register');
      return;
    }

    const currentGym = getGym(activeId);
    if (!currentGym) {
      toast({
        title: 'Gym Not Found',
        description: 'The specified Gym ID does not exist. Please register first.',
        type: 'error',
      });
      router.push('/register');
      return;
    }

    setGymId(activeId);
    setGym(currentGym);
    setTrainers(getTrainers(activeId));
    setMembers(getMembers(activeId));
  }, [searchParams, router, toast]);

  // Sync details periodically (useful for member count changes)
  useEffect(() => {
    if (!gymId) return;
    const interval = setInterval(() => {
      setMembers(getMembers(gymId));
    }, 3000);
    return () => clearInterval(interval);
  }, [gymId]);

  const handleAddTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId) return;

    if (!trainerForm.name || !trainerForm.specialization || !trainerForm.phone) {
      toast({
        title: 'Validation Error',
        description: 'Please complete all trainer details.',
        type: 'error',
      });
      return;
    }

    const newTrainer = addTrainer(gymId, {
      name: trainerForm.name,
      specialization: trainerForm.specialization,
      phone: trainerForm.phone,
    });

    setTrainers((prev) => [...prev, newTrainer]);
    setTrainerForm({ name: '', specialization: '', phone: '' });

    toast({
      title: 'Trainer Added',
      description: `${newTrainer.name} is now registered under your gym.`,
      type: 'success',
    });
  };

  const handleDeleteTrainer = (id: string, name: string) => {
    deleteTrainer(id);
    setTrainers((prev) => prev.filter((t) => t.id !== id));
    toast({
      title: 'Trainer Removed',
      description: `${name} has been removed.`,
      type: 'info',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!gym) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const joinUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/join/${gym.id}` 
    : `https://fitpulse.app/join/${gym.id}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent(joinUrl)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative">
      
      {/* -------------------- PRINT-ONLY COMPONENT -------------------- */}
      <div className="hidden print:flex flex-col items-center justify-between p-12 min-h-screen bg-white text-slate-950 text-center w-full" id="printable-poster">
        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
            <Dumbbell className="h-9 w-9 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            FitPulse<span className="text-emerald-500">.AI</span>
          </h1>
          <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase mt-1">Gym Member Portal</p>
        </div>

        <div className="flex flex-col items-center my-10 max-w-md">
          <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Scan to Join
          </h2>
          <p className="text-lg text-slate-600 mt-3 font-medium">
            Register your membership details, track stats, and configure your goals instantly.
          </p>

          <div className="mt-8 p-6 bg-slate-100 rounded-[2.5rem] border border-slate-200 shadow-xl flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageUrl} alt="Gym Onboarding QR Code" className="w-64 h-64 border-4 border-white rounded-2xl" />
          </div>

          <p className="mt-8 text-xs text-slate-400 font-mono break-all bg-slate-100 px-4 py-2 rounded-xl">
            {joinUrl}
          </p>
        </div>

        <div className="border-t border-slate-200 pt-8 w-full max-w-sm mb-8">
          <h3 className="text-2xl font-bold text-slate-800">{gym.gymName}</h3>
          <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1">
            <MapPin className="h-4 w-4 text-emerald-500 shrink-0" /> {gym.location}
          </p>
        </div>
      </div>

      {/* -------------------- MAIN DASHBOARD UI (HIDDEN ON PRINT) -------------------- */}
      <div className="flex-1 flex flex-col lg:flex-row print:hidden w-full">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-slate-900/40 border-b lg:border-b-0 lg:border-r border-slate-900 p-6 flex flex-col shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10 px-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Dumbbell className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              FitPulse<span className="text-emerald-400">.AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-sm cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              Overview
              <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${activeTab === 'overview' ? 'translate-x-0' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
            </button>

            <button
              onClick={() => setActiveTab('trainers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-sm cursor-pointer ${
                activeTab === 'trainers'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              <UserCheck className="h-4.5 w-4.5" />
              Trainers
              <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${activeTab === 'trainers' ? 'translate-x-0' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-sm cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              <QrCode className="h-4.5 w-4.5" />
              Counter QR Poster
              <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${activeTab === 'qr' ? 'translate-x-0' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
            </button>
          </nav>

          {/* User profile / active state at bottom */}
          <div className="pt-6 border-t border-slate-900 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-emerald-400 text-sm border border-slate-700">
              {gym.ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{gym.ownerName}</p>
              <p className="text-[10px] text-slate-500 truncate">Gym Administrator</p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-10 flex flex-col overflow-y-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-slate-900">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>{gym.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {gym.location}
                </span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">{gym.gymName}</h1>
            </div>

            {/* Trial Status Badge */}
            <div className="flex gap-4">
              <div className="px-4 py-2.5 bg-slate-900/80 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Active Trial
                </span>
              </div>
            </div>
          </header>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:border-emerald-500/20 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered Members</CardTitle>
                    <Users className="h-5 w-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-white font-mono">{members.length}</div>
                    <p className="text-xs text-slate-500 mt-1">Realtime onboarding updates</p>
                  </CardContent>
                </Card>

                <Card className="hover:border-emerald-500/20 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Trainers</CardTitle>
                    <UserCheck className="h-5 w-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-white font-mono">{trainers.length}</div>
                    <p className="text-xs text-slate-500 mt-1">Personal & specialized coaches</p>
                  </CardContent>
                </Card>

                <Card className="hover:border-emerald-500/20 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Membership Plans</CardTitle>
                    <Calendar className="h-5 w-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-white font-mono">1</div>
                    <p className="text-xs text-slate-500 mt-1">Trial membership package</p>
                  </CardContent>
                </Card>
              </div>

              {/* Gym Info Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gym Registration Details</CardTitle>
                    <CardDescription>Official account settings and registry details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-900">
                      <span className="text-slate-400 text-sm">Gym Identification (ID)</span>
                      <span className="font-mono text-sm text-white font-bold">{gym.id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-900">
                      <span className="text-slate-400 text-sm">Owner Name</span>
                      <span className="text-sm text-white font-semibold">{gym.ownerName}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-900">
                      <span className="text-slate-400 text-sm">Primary Location</span>
                      <span className="text-sm text-white font-semibold">{gym.location}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-900">
                      <span className="text-slate-400 text-sm flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</span>
                      <span className="text-sm text-slate-300">{gym.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-400 text-sm flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Phone</span>
                      <span className="text-sm text-slate-300">{gym.phone}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Registrations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Onboarded Members</CardTitle>
                    <CardDescription>Updates from your reception counter QR poster.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {members.length === 0 ? (
                      <div className="h-48 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                        <QrCode className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
                        <p className="text-sm text-slate-400 font-semibold">No members onboarded yet</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                          Place the Counter QR Poster at your reception desk to start onboarding!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                        {members.map((member) => (
                          <div key={member.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                            <div>
                              <p className="text-sm font-bold text-white">{member.fullName}</p>
                              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">{member.goal.replace('-', ' ')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-400 font-mono">{member.phone}</p>
                              <p className="text-[10px] text-slate-500">{new Date(member.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: TRAINERS */}
          {activeTab === 'trainers' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Trainer Form */}
                <Card className="lg:col-span-1 h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Trainer</CardTitle>
                    <CardDescription>Assign a coach or personal trainer to your fitness center.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddTrainer} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Trainer Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Michael Jordan"
                          value={trainerForm.name}
                          onChange={(e) => setTrainerForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Specialization</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Bodybuilding, Yoga, Cardio"
                          value={trainerForm.specialization}
                          onChange={(e) => setTrainerForm(prev => ({ ...prev, specialization: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +94 77 987 6543"
                          value={trainerForm.phone}
                          onChange={(e) => setTrainerForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5" /> Add Trainer
                      </button>
                    </form>
                  </CardContent>
                </Card>

                {/* Trainers List */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Assigned Trainers</CardTitle>
                    <CardDescription>Verify and manage registered personal trainers.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trainers.length === 0 ? (
                      <div className="h-64 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                        <UserCheck className="h-10 w-10 text-slate-600 mb-3" />
                        <p className="text-sm text-slate-400 font-semibold">No trainers assigned yet</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                          Fill in the registration form to list your first fitness coach.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-400 text-xs font-bold uppercase tracking-wider">
                              <th className="py-3 px-4">Trainer ID</th>
                              <th className="py-3 px-4">Name</th>
                              <th className="py-3 px-4">Specialization</th>
                              <th className="py-3 px-4">Phone</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60">
                            {trainers.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-900/20 transition-colors">
                                <td className="py-3 px-4 font-mono text-emerald-400 text-xs">{t.id}</td>
                                <td className="py-3 px-4 text-white font-semibold">{t.name}</td>
                                <td className="py-3 px-4 text-slate-300">
                                  <span className="px-2.5 py-1 bg-slate-900 rounded-full text-xs border border-slate-800 text-slate-300">
                                    {t.specialization}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-400 font-mono text-xs">{t.phone}</td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteTrainer(t.id, t.name)}
                                    className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg text-slate-500 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 3: QR POSTER */}
          {activeTab === 'qr' && (
            <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl mx-auto w-full">
              <Card className="overflow-hidden border-slate-800 relative bg-slate-900/40" glow>
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-emerald-400" /> Reception Desk QR Poster
                  </CardTitle>
                  <CardDescription>
                    Stylized counter poster. Print and place this poster at your gym front counter. When new members scan this QR code, they can instantly self-onboard using their smartphone.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex flex-col items-center py-8">
                  {/* Poster Preview Frame */}
                  <div className="border border-slate-800 bg-white rounded-3xl p-8 w-full max-w-sm text-center text-slate-900 shadow-2xl flex flex-col items-center">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center gap-2 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-emerald-400 stroke-[2.5]" />
                      </div>
                      <h4 className="text-xl font-black text-slate-900">
                        FitPulse<span className="text-emerald-500">.AI</span>
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Self-Registration</p>
                    </div>

                    <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">Scan to Register</h3>
                    <p className="text-xs text-slate-500 mt-2 max-w-[220px] mx-auto">
                      Fill out your profile, body stats, and goals from your phone.
                    </p>

                    {/* QR Code Container */}
                    <div className="my-6 p-4 bg-slate-100 rounded-[2rem] border border-slate-200 shadow-inner flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrImageUrl} alt="Gym Onboarding QR Code" className="w-48 h-48 border border-white rounded-xl" />
                    </div>

                    <div className="border-t border-slate-100 pt-4 w-full">
                      <p className="text-sm font-bold text-slate-800">{gym.gymName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-500 shrink-0" /> {gym.location}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button
                      onClick={handlePrint}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer className="h-4.5 w-4.5" /> Print QR Poster
                    </button>
                    
                    <a
                      href={joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 border border-slate-850 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      Test Onboarding Link
                    </a>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-slate-500 text-xs">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Poster scales perfectly to standard printable A4 or Letter sizes.</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

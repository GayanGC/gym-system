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
  Building2,
  CreditCard,
  AlertTriangle,
  Lock,
  LogOut,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  FileText,
  FileCheck,
  Upload,
  Coins
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { 
  getGym, 
  getTrainers, 
  addTrainer, 
  deleteTrainer, 
  getMembers, 
  getActiveGymId,
  updateGymSmsToggle,
  getSmsLogs,
  getPaymentSlips,
  addPaymentSlip,
  updatePaymentSlipStatus,
  User, 
  Gym,
  PaymentSlip,
  SmsLog
} from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
  const [trainers, setTrainers] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'trainers' | 'qr' | 'slips' | 'billing'>('overview');

  // SMS settings & logs state
  const [autoSms, setAutoSms] = useState(true);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);

  // Member Payment Slips uploaded
  const [memberSlips, setMemberSlips] = useState<PaymentSlip[]>([]);

  // Owner's own billing slip upload form
  const [billingBank, setBillingBank] = useState('Commercial Bank');
  const [billingAmount, setBillingAmount] = useState('29000');
  const [billingSlipName, setBillingSlipName] = useState('');
  const [ownerSlips, setOwnerSlips] = useState<PaymentSlip[]>([]);

  // Form states
  const [trainerForm, setTrainerForm] = useState({
    name: '',
    specialization: '',
    phone: '',
    email: '',
  });

  // Load gym details and dependencies
  const loadGymData = (id: string) => {
    const currentGym = getGym(id);
    if (!currentGym) {
      toast({
        title: 'Gym Not Found',
        description: 'The specified Gym ID does not exist.',
        type: 'error',
      });
      router.push('/login');
      return;
    }
    setGym(currentGym);
    setAutoSms(currentGym.autoSmsEnabled);
    setTrainers(getTrainers(id));
    
    const gymMembers = getMembers(id);
    setMembers(gymMembers);

    // Get sent SMS logs
    setSmsLogs(getSmsLogs(id));

    // Get member slips
    const allMemberSlips = getPaymentSlips('MEMBER');
    // Filter slips belonging to members of this gym
    const filteredSlips = allMemberSlips.filter(s => gymMembers.some(m => m.id === s.referenceId));
    setMemberSlips(filteredSlips);

    // Get owner slips for this gym
    setOwnerSlips(getPaymentSlips('OWNER', id));
  };

  useEffect(() => {
    let activeId = searchParams.get('gym_id');
    if (!activeId) {
      activeId = getActiveGymId();
    }

    if (!activeId) {
      router.push('/login');
      return;
    }

    setGymId(activeId);
    loadGymData(activeId);
  }, [searchParams, router, toast]);

  // Sync details periodically
  useEffect(() => {
    if (!gymId) return;
    const interval = setInterval(() => {
      loadGymData(gymId);
    }, 3000);
    return () => clearInterval(interval);
  }, [gymId]);

  const handleSmsToggle = () => {
    if (!gymId || !gym) return;
    const newValue = !autoSms;
    updateGymSmsToggle(gymId, newValue);
    setAutoSms(newValue);
    toast({
      title: 'SMS Settings Updated',
      description: newValue ? 'Automated check-in SMS alerts enabled.' : 'Automated SMS alerts disabled.',
      type: 'success',
    });
  };

  const handleAddTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId || !gym) return;

    if (gym.subscriptionStatus === 'Expired') {
      toast({
        title: 'Licensing Block',
        description: 'Your license is expired. Please renew under the Billing section.',
        type: 'error',
      });
      return;
    }

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
      email: trainerForm.email || undefined,
    });

    setTrainers((prev) => [...prev, newTrainer]);
    setTrainerForm({ name: '', specialization: '', phone: '', email: '' });

    toast({
      title: 'Trainer Added',
      description: `${newTrainer.name} is now registered under your gym.`,
      type: 'success',
    });
  };

  const handleDeleteTrainer = (id: string, name: string) => {
    if (gym?.subscriptionStatus === 'Expired') {
      toast({
        title: 'Licensing Block',
        description: 'Please renew your subscription to perform administrative changes.',
        type: 'error',
      });
      return;
    }

    deleteTrainer(id);
    setTrainers((prev) => prev.filter((t) => t.id !== id));
    toast({
      title: 'Trainer Removed',
      description: `${name} has been removed.`,
      type: 'info',
    });
  };

  // Member Payment Slip Approval
  const handleMemberSlipAction = (slipId: string, status: 'Approved' | 'Rejected') => {
    updatePaymentSlipStatus(slipId, status);
    if (gymId) loadGymData(gymId);
    toast({
      title: status === 'Approved' ? 'Slip Approved' : 'Slip Rejected',
      description: `Member fee receipt status has been updated to ${status}.`,
      type: status === 'Approved' ? 'success' : 'error',
    });
  };

  // Owner Renew Slip Upload
  const handleOwnerSlipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId) return;

    if (!billingSlipName) {
      toast({
        title: 'File Required',
        description: 'Please specify the name of the bank receipt slip document.',
        type: 'error',
      });
      return;
    }

    addPaymentSlip({
      tenantType: 'OWNER',
      referenceId: gymId,
      amount: parseFloat(billingAmount) || 29000,
      bankName: billingBank,
      slipImage: billingSlipName,
    });

    setBillingSlipName('');
    loadGymData(gymId);

    toast({
      title: 'Renewal Slip Submitted!',
      description: 'Super Admin will review and verify your payment shortly.',
      type: 'success',
    });
  };

  const handleLogout = () => {
    toast({ title: 'Logged Out', description: 'Session ended.', type: 'info' });
    router.push('/login');
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

  const isExpired = gym.subscriptionStatus === 'Expired';
  const pendingMemberSlipsCount = memberSlips.filter(s => s.status === 'Pending').length;

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
          <div className="flex items-center justify-between lg:justify-start gap-2.5 mb-10 px-2">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Dumbbell className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                FitPulse<span className="text-emerald-400">.AI</span>
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
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

            <button
              onClick={() => setActiveTab('slips')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-sm relative cursor-pointer ${
                activeTab === 'slips'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              <FileText className="h-4.5 w-4.5" />
              Member Slips
              {pendingMemberSlipsCount > 0 && (
                <span className="absolute right-3 top-2.5 h-4.5 w-4.5 rounded-full bg-emerald-500 text-slate-950 font-mono text-[9px] flex items-center justify-center font-black animate-pulse">
                  {pendingMemberSlipsCount}
                </span>
              )}
              <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${activeTab === 'slips' ? 'translate-x-0' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-sm cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              <CreditCard className="h-4.5 w-4.5" />
              Billing & Licensing
              <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${activeTab === 'billing' ? 'translate-x-0' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
            </button>
          </nav>

          {/* User profile / active state at bottom */}
          <div className="pt-6 border-t border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-emerald-400 text-sm border border-slate-700">
                {gym.ownerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{gym.ownerName}</p>
                <p className="text-[10px] text-slate-500 truncate">Gym Owner</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="hidden lg:block text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-10 flex flex-col overflow-y-auto relative">
          
          {/* Expired Overlay block (Except billing tab) */}
          {isExpired && activeTab !== 'billing' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex flex-col justify-center items-center p-6 text-center">
              <div className="h-16 w-16 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">License Expired</h2>
              <p className="text-slate-400 max-w-sm mt-2 text-sm">
                Your subscription license for <span className="text-white font-bold">{gym.gymName}</span> has expired. Please upload your payment bank transfer receipt slip in the Billing section to renew access.
              </p>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setActiveTab('billing')}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg cursor-pointer"
                >
                  Renew / Upload Slip
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

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
              <div className={`px-4 py-2.5 bg-slate-900/80 border rounded-xl flex items-center gap-2 ${
                gym.subscriptionStatus === 'Active' 
                  ? 'border-emerald-500/20 text-emerald-400' 
                  : gym.subscriptionStatus === 'Trial' 
                  ? 'border-blue-500/20 text-blue-400' 
                  : 'border-rose-500/20 text-rose-400'
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  gym.subscriptionStatus === 'Active' 
                    ? 'bg-emerald-500' 
                    : gym.subscriptionStatus === 'Trial' 
                    ? 'bg-blue-500 animate-pulse' 
                    : 'bg-rose-500'
                }`} />
                <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1">
                  {gym.subscriptionStatus === 'Active' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {gym.subscriptionStatus === 'Trial' && <Sparkles className="h-3.5 w-3.5" />}
                  {gym.subscriptionStatus === 'Expired' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {gym.subscriptionStatus} License
                </span>
              </div>
            </div>
          </header>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Gym Members</CardTitle>
                    <Users className="h-5 w-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-white font-mono">{members.length}</div>
                    <p className="text-xs text-slate-500 mt-1">Total registered users</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Coaches Assigned</CardTitle>
                    <UserCheck className="h-5 w-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-white font-mono">{trainers.length}</div>
                    <p className="text-xs text-slate-505 mt-1">Staff roster directories</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Attendance Avg</CardTitle>
                    <Calendar className="h-5 w-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-white font-mono">
                      {members.length > 0 ? (members.reduce((acc, m) => acc + (m.streak || 0), 0) / members.length).toFixed(1) : 0}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Average logged member streak</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sri Lankan SMS settings card & Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* SMS Controls card */}
                <div className="lg:col-span-5 space-y-6">
                  <Card glow={autoSms}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>SMS Gateway Control</span>
                        <button onClick={handleSmsToggle} className="text-emerald-400 cursor-pointer">
                          {autoSms ? (
                            <ToggleRight className="h-8 w-8 stroke-[1.5] text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 stroke-[1.5] text-slate-600" />
                          )}
                        </button>
                      </CardTitle>
                      <CardDescription>
                        SMS triggers integrated with Sri Lankan SMS networks (Textware / Dialog BizSMS).
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-900 text-xs">
                        <span className="text-slate-400">Auto SMS Check-ins</span>
                        <span className={`font-bold uppercase ${autoSms ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {autoSms ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-slate-900 text-xs">
                        <span className="text-slate-400">Renewal Alerts (3 days prior)</span>
                        <span className={`font-bold uppercase ${autoSms ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {autoSms ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-[10px] text-slate-500 leading-normal">
                        <strong>LANKA SMS Rules:</strong> Outgoing alerts are targeted at local operators (Dialog, Mobitel, Hutch). Costs are deducted from your prepaid SMS balance.
                      </div>
                    </CardContent>
                  </Card>

                  {/* Settings card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gym Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-900">
                        <span className="text-slate-500">Owner Contact</span>
                        <span className="text-white font-bold">{gym.ownerName}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-900">
                        <span className="text-slate-500">Phone Contact</span>
                        <span className="text-slate-300">{gym.phone}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Location Area</span>
                        <span className="text-white font-bold">{gym.location}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* SMS Sent Logs list */}
                <Card className="lg:col-span-7">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-1.5">
                      <MessageSquare className="h-5 w-5 text-emerald-400" /> Outbound SMS Logs
                    </CardTitle>
                    <CardDescription>Sent notifications via LANKA SMS gateways.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {smsLogs.length === 0 ? (
                      <div className="h-52 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-850 rounded-2xl bg-slate-950/20">
                        <MessageSquare className="h-8 w-8 text-slate-700 mb-2" />
                        <p className="text-xs text-slate-550">No SMS logs recorded under this gym yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {smsLogs.map((log) => (
                          <div key={log.id} className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl text-[11px] space-y-1.5">
                            <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                              <span>To: {log.receiverPhone}</span>
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-md font-mono">{log.triggerType}</span>
                            </div>
                            <p className="text-slate-300 leading-normal font-sans">"{log.message}"</p>
                            <p className="text-[9px] text-slate-600 font-mono text-right">{new Date(log.createdAt).toLocaleString()}</p>
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
                {/* Form */}
                <Card className="lg:col-span-1 h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg">Register Trainer</CardTitle>
                    <CardDescription>Assign coaches for workout allocations.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddTrainer} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Trainer Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mike Coach"
                          value={trainerForm.name}
                          onChange={(e) => setTrainerForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 animate-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Specialization</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Bodybuilding, Strength"
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
                          placeholder="e.g. +94 77 111 2222"
                          value={trainerForm.phone}
                          onChange={(e) => setTrainerForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="h-4 w-4" /> Add Trainer
                      </button>
                    </form>
                  </CardContent>
                </Card>

                {/* List */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Staff Roster</CardTitle>
                    <CardDescription>Verify your active gym coaches.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trainers.length === 0 ? (
                      <div className="h-64 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                        <UserCheck className="h-10 w-10 text-slate-600 mb-3" />
                        <p className="text-sm text-slate-400 font-semibold">No trainers assigned yet</p>
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
                              <tr key={t.id} className="hover:bg-slate-900/10 transition-colors">
                                <td className="py-3 px-4 font-mono text-emerald-400 text-xs">{t.id}</td>
                                <td className="py-3 px-4 text-white font-semibold">{t.name}</td>
                                <td className="py-3 px-4 text-slate-300">
                                  <span className="px-2.5 py-1 bg-slate-900 rounded-full text-[10px] border border-slate-800 text-slate-300 font-semibold uppercase tracking-wider">
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
            <div className="space-y-8 animate-in fade-in duration-300 max-w-xl mx-auto w-full">
              <Card className="overflow-hidden border-slate-800 bg-slate-900/40" glow>
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-emerald-400" /> Counter QR Code Poster
                  </CardTitle>
                  <CardDescription>
                    Print this QR poster to display at your reception desk. New members scan this code to register self-onboarding details via their phone.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex flex-col items-center py-6">
                  {/* Poster Preview */}
                  <div className="border border-slate-800 bg-white rounded-3xl p-8 w-full max-w-sm text-center text-slate-900 shadow-2xl flex flex-col items-center">
                    <div className="flex flex-col items-center gap-2 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-emerald-400 stroke-[2.5]" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900">
                        FitPulse<span className="text-emerald-500">.AI</span>
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Self-Onboarding</p>
                    </div>

                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">Scan to Register</h3>
                    
                    <div className="my-5 p-4 bg-slate-100 rounded-[2.5rem] border border-slate-200 shadow-inner flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrImageUrl} alt="Gym Onboarding QR Code" className="w-48 h-48 border border-white rounded-xl" />
                    </div>

                    <div className="border-t border-slate-100 pt-4 w-full">
                      <p className="text-xs font-bold text-slate-800">{gym.gymName}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-500 shrink-0" /> {gym.location}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button
                      onClick={handlePrint}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Printer className="h-4.5 w-4.5" /> Print QR Poster
                    </button>
                    
                    <a
                      href={joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 border border-slate-850 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      Test Onboarding Link
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: MEMBER SLIPS APPROVAL */}
          {activeTab === 'slips' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Member Subscription slips</CardTitle>
                  <CardDescription>Review bank slips submitted by gym members for monthly fees.</CardDescription>
                </CardHeader>
                <CardContent>
                  {memberSlips.length === 0 ? (
                    <div className="h-64 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-850 rounded-2xl bg-slate-950/20">
                      <FileText className="h-10 w-10 text-slate-700 mb-2" />
                      <p className="text-xs text-slate-500">No member slips uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Slip ID</th>
                            <th className="py-3 px-4">Member Name</th>
                            <th className="py-3 px-4">Bank Name</th>
                            <th className="py-3 px-4">Amount LKR</th>
                            <th className="py-3 px-4">Slip File</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60">
                          {memberSlips.map((slip) => {
                            const memberDetails = members.find(m => m.id === slip.referenceId);
                            return (
                              <tr key={slip.id} className="hover:bg-slate-900/10 transition-colors">
                                <td className="py-3 px-4 font-mono text-xs text-slate-500">{slip.id}</td>
                                <td className="py-3 px-4 font-bold text-white">
                                  {memberDetails ? memberDetails.name : 'Unknown Member'}
                                  <p className="text-[10px] text-slate-500 font-mono font-normal mt-0.5">{slip.referenceId}</p>
                                </td>
                                <td className="py-3 px-4 text-xs font-semibold text-slate-300">{slip.bankName}</td>
                                <td className="py-3 px-4 font-mono text-xs font-bold text-emerald-400">
                                  LKR {slip.amount.toLocaleString()}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/5 px-2 py-1 border border-emerald-500/10 rounded-lg w-fit">
                                    <FileCheck className="h-3.5 w-3.5" />
                                    <span className="font-mono text-[10px]">{slip.slipImage}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-xs">
                                  {slip.status === 'Approved' && <span className="text-emerald-400 font-bold">Approved</span>}
                                  {slip.status === 'Pending' && <span className="text-amber-400 font-bold">Pending</span>}
                                  {slip.status === 'Rejected' && <span className="text-rose-400 font-bold">Rejected</span>}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {slip.status === 'Pending' ? (
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        onClick={() => handleMemberSlipAction(slip.id, 'Approved')}
                                        className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleMemberSlipAction(slip.id, 'Rejected')}
                                        className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-455 text-[10px] font-bold uppercase border border-rose-500/30 rounded-lg transition-all cursor-pointer"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 italic">Verified</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: BILLING & LICENSING */}
          {activeTab === 'billing' && (
            <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl mx-auto w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subscription Details</CardTitle>
                  <CardDescription>Manage SaaS license, billing cycles, and packages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    gym.subscriptionStatus === 'Active' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : gym.subscriptionStatus === 'Trial' 
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {gym.subscriptionStatus === 'Active' && <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />}
                    {gym.subscriptionStatus === 'Trial' && <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />}
                    {gym.subscriptionStatus === 'Expired' && <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />}

                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        {gym.subscriptionStatus} Subscription Status
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {gym.subscriptionStatus === 'Active' && 'Your license is fully active with unlimited member access.'}
                        {gym.subscriptionStatus === 'Trial' && 'You are currently on a 1-Month free trial. Upgrade any time.'}
                        {gym.subscriptionStatus === 'Expired' && 'Your subscription has expired. System actions are restricted.'}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Plan details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SaaS Pricing</span>
                      <p className="text-base font-bold text-white mt-1">Growth Tier</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">29,000 LKR ($99) / month</p>
                    </div>
                    
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Expiry / Renewal</span>
                      <p className="text-base font-bold text-white mt-1">Monthly cycle</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Valid until: {new Date(gym.trialEndsAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* direct bank transfer details */}
                  <div className="p-5 border border-slate-900 bg-slate-950/40 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Building2 className="h-4.5 w-4.5 text-emerald-400" /> Sri Lankan Bank Transfer Registry
                    </h4>
                    <p className="text-xs text-slate-400">
                      Transfer subscription fees to either bank listed below and upload the receipt slip.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-900/60">
                        <p className="font-bold text-white">Commercial Bank</p>
                        <p className="text-slate-450 mt-1">Acc: 1002003004</p>
                        <p className="text-slate-550 text-[10px]">Branch: Colombo 07</p>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-900/60">
                        <p className="font-bold text-white">Sampath Bank</p>
                        <p className="text-slate-450 mt-1">Acc: 9008007006</p>
                        <p className="text-slate-550 text-[10px]">Branch: Kandy Main</p>
                      </div>
                    </div>

                    {/* Slip Uploader form */}
                    <form onSubmit={handleOwnerSlipSubmit} className="border-t border-slate-900/80 pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Select Target Bank</label>
                          <select
                            value={billingBank}
                            onChange={(e) => setBillingBank(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                          >
                            <option value="Commercial Bank">Commercial Bank</option>
                            <option value="Sampath Bank">Sampath Bank</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Amount (LKR)</label>
                          <input
                            type="text"
                            required
                            value={billingAmount}
                            onChange={(e) => setBillingAmount(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Receipt File Name / Upload</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="e.g. commbank_transfer_slip.jpg"
                            value={billingSlipName}
                            onChange={(e) => setBillingSlipName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none"
                          />
                          <Upload className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck className="h-4 w-4" /> Submit Renewal Slip
                      </button>
                    </form>
                  </div>

                  {/* List of uploaded owner slips */}
                  {ownerSlips.length > 0 && (
                    <div className="border-t border-slate-900 pt-6">
                      <h4 className="text-sm font-bold text-white mb-3">Submitted Slip Statuses</h4>
                      <div className="space-y-2">
                        {ownerSlips.map((slip) => (
                          <div key={slip.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-white">{slip.bankName}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{slip.slipImage} • LKR {slip.amount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              {slip.status === 'Pending' && <span className="text-amber-400 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">Pending</span>}
                              {slip.status === 'Approved' && <span className="text-emerald-400 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">Approved</span>}
                              {slip.status === 'Rejected' && <span className="text-rose-400 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md">Rejected</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

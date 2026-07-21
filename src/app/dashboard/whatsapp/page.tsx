'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Dumbbell, 
  Users, 
  UserCheck, 
  QrCode, 
  FileText, 
  CreditCard, 
  ShoppingBag,
  MessageSquare,
  Globe,
  ToggleLeft,
  ToggleRight,
  Send,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight,
  Building2,
  CheckCircle2,
  XCircle,
  FileCheck,
  Upload,
  LayoutDashboard,
  Zap,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { 
  getGym, 
  getMembers, 
  getWhatsAppLogs, 
  getWhatsAppSettings, 
  saveWhatsAppSettings, 
  getActiveGymId,
  Gym, 
  User as UserType, 
  WhatsAppLog, 
  WhatsAppSetting 
} from '@/lib/db';
import { sendWhatsAppMsg, simulateSlipOcr } from '@/lib/whatsapp';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function WhatsAppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WhatsAppContent />
    </Suspense>
  );
}

function WhatsAppContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [gymId, setGymId] = useState<string | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [members, setMembers] = useState<UserType[]>([]);
  
  // Settings & Logs
  const [settings, setSettings] = useState<WhatsAppSetting | null>(null);
  const [waLogs, setWaLogs] = useState<WhatsAppLog[]>([]);

  // Local connection UI state
  const [connectionState, setConnectionState] = useState<'Connected' | 'Disconnected' | 'Syncing'>('Disconnected');
  const [pairingNumber, setPairingNumber] = useState('+94 77 123 4567');

  // OCR Simulator Form
  const [ocrMemberId, setOcrMemberId] = useState('');
  const [ocrBank, setOcrBank] = useState('Commercial Bank');
  const [ocrAmount, setOcrAmount] = useState('4500');
  const [ocrFileName, setOcrFileName] = useState('');
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const loadData = (id: string) => {
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
    
    const gymMembers = getMembers(id);
    setMembers(gymMembers);
    if (gymMembers.length > 0) {
      setOcrMemberId(gymMembers[0].id);
    }

    const currentSettings = getWhatsAppSettings(id);
    setSettings(currentSettings);
    setConnectionState(currentSettings.botConnected ? 'Connected' : 'Disconnected');
    setWaLogs(getWhatsAppLogs(id));
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
    loadData(activeId);
  }, [searchParams, router, toast]);

  // Sync logs periodically
  useEffect(() => {
    if (!gymId) return;
    const interval = setInterval(() => {
      setWaLogs(getWhatsAppLogs(gymId));
    }, 2000);
    return () => clearInterval(interval);
  }, [gymId]);

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId || !settings) return;

    setConnectionState('Syncing');
    
    setTimeout(() => {
      const updatedSettings = {
        ...settings,
        botConnected: true,
      };
      saveWhatsAppSettings(updatedSettings);
      setSettings(updatedSettings);
      setConnectionState('Connected');
      
      toast({
        title: 'WhatsApp Bot Linked!',
        description: `Successfully linked your business number ${pairingNumber}.`,
        type: 'success',
      });
    }, 2000);
  };

  const handleDisconnect = () => {
    if (!gymId || !settings) return;

    const updatedSettings = {
      ...settings,
      botConnected: false,
    };
    saveWhatsAppSettings(updatedSettings);
    setSettings(updatedSettings);
    setConnectionState('Disconnected');

    toast({
      title: 'WhatsApp Disconnected',
      description: 'Your business phone number connection has been closed.',
      type: 'info',
    });
  };

  const handleToggle = (key: 'autoBirthdays' | 'autoSchedules') => {
    if (!gymId || !settings) return;

    const updatedSettings = {
      ...settings,
      [key]: !settings[key],
    };
    saveWhatsAppSettings(updatedSettings);
    setSettings(updatedSettings);

    toast({
      title: 'WhatsApp Settings Saved',
      description: 'Automations updated successfully.',
      type: 'success',
    });
  };

  // Birthday wish scanner trigger
  const handleBirthdayScan = () => {
    if (!gymId || !gym || !settings) return;

    if (!settings.botConnected) {
      toast({
        title: 'Bot Offline',
        description: 'Please link your WhatsApp number before running campaigns.',
        type: 'error',
      });
      return;
    }

    // Get today's MM-DD representation
    const todayObj = new Date();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    const todayStr = `${mm}-${dd}`;

    const birthdayMembers = members.filter(m => m.birthday === todayStr);

    if (birthdayMembers.length === 0) {
      toast({
        title: 'No Birthdays Today',
        description: 'No gym members are celebrating birthdays today.',
        type: 'info',
      });
      return;
    }

    let sentCount = 0;
    birthdayMembers.forEach((member) => {
      const wishText = `Happy Birthday ${member.name}! 🎉 Wish you a strong and healthy year ahead from ${gym.gymName}! Here is a 15% discount on your next month membership renewal! 🏋️‍♂️`;
      const result = sendWhatsAppMsg(gymId, member.phone || '', wishText, 'Birthday Wishes');
      if (result.success) {
        sentCount++;
      }
    });

    if (sentCount > 0) {
      setWaLogs(getWhatsAppLogs(gymId));
      toast({
        title: 'Wishes Broadcaster Done!',
        description: `Dispatched automated birthday greetings to ${sentCount} members.`,
        type: 'success',
      });
    }
  };

  // Slip OCR webhook simulator trigger
  const handleOcrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId || !settings) return;

    if (!settings.botConnected) {
      toast({
        title: 'Bot Offline',
        description: 'WhatsApp bot must be online to receive incoming slip receipts.',
        type: 'error',
      });
      return;
    }

    if (!ocrFileName) {
      toast({
        title: 'File Required',
        description: 'Input simulated receipt file name.',
        type: 'error',
      });
      return;
    }

    setOcrProcessing(true);

    const result = await simulateSlipOcr(
      gymId,
      ocrMemberId,
      ocrBank,
      parseFloat(ocrAmount) || 4500,
      ocrFileName
    );

    setOcrProcessing(false);

    if (result.success) {
      setOcrFileName('');
      setWaLogs(getWhatsAppLogs(gymId));
      toast({
        title: 'AI OCR Success!',
        description: 'Parsed document verified and submitted to Gym Owner queue.',
        type: 'success',
      });
    } else {
      toast({
        title: 'AI OCR Process Error',
        description: result.error || 'Parsing failed.',
        type: 'error',
      });
    }
  };

  const handleLogout = () => {
    toast({ title: 'Logged Out', description: 'Session ended.', type: 'info' });
    router.push('/login');
  };

  if (!gym || !settings) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent('fitpulse_wa_pair_token_' + gym.id)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative">
      
      {/* Background neon blur */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900/40 border-b lg:border-b-0 lg:border-r border-slate-900 p-6 flex flex-col shrink-0">
        <div className="flex items-center justify-between lg:justify-start gap-2.5 mb-10 px-2">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Dumbbell className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              FitPulse<span className="text-emerald-400">.AI</span>
            </span>
          </div>
          <button onClick={handleLogout} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => router.push(`/dashboard?gym_id=${gym.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
          >
            <LayoutDashboard className="h-4.5 w-4.5" /> Overview
          </button>

          <button
            onClick={() => router.push(`/dashboard?gym_id=${gym.id}&tab=trainers`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
          >
            <UserCheck className="h-4.5 w-4.5" /> Trainers
          </button>

          <button
            onClick={() => router.push(`/dashboard?gym_id=${gym.id}&tab=qr`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
          >
            <QrCode className="h-4.5 w-4.5" /> Counter QR Poster
          </button>

          <button
            onClick={() => router.push(`/dashboard?gym_id=${gym.id}&tab=slips`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
          >
            <FileText className="h-4.5 w-4.5" /> Member Slips
          </button>

          <button
            onClick={() => router.push(`/dashboard?gym_id=${gym.id}&tab=billing`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
          >
            <CreditCard className="h-4.5 w-4.5" /> Billing & Licensing
          </button>

          <div className="h-[1px] bg-slate-900 my-4" />

          <button
            onClick={() => router.push(`/dashboard/pos?gym_id=${gym.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
          >
            <ShoppingBag className="h-4.5 w-4.5" /> Supplement POS
          </button>

          <button
            onClick={() => router.push(`/dashboard/retention?gym_id=${gym.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
          >
            <Users className="h-4.5 w-4.5" /> Retention Engine
          </button>

          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-sm cursor-pointer"
          >
            <MessageSquare className="h-4.5 w-4.5 animate-pulse text-emerald-400" /> WhatsApp Bot
            <ChevronRight className="ml-auto h-4 w-4" />
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-emerald-400 text-sm border border-slate-700">
              {gym.ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{gym.ownerName}</p>
              <p className="text-[10px] text-slate-505 truncate">Gym Owner</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-6 lg:p-10 flex flex-col overflow-y-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{gym.id}</span>
              <span>•</span>
              <span>WhatsApp Automation Business Bot</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">{gym.gymName}</h1>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBirthdayScan}
              disabled={connectionState !== 'Connected'}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              <Sparkles className="h-4 w-4" /> Scan Birthday Wishes
            </button>
          </div>
        </header>

        {/* Workspace: 2 columns */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: QR scanner pairing & settings (5 columns) */}
          <div className="xl:col-span-5 space-y-6">
            
            {/* Pairing QR Card */}
            <Card glow={connectionState === 'Connected'}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">WhatsApp Pairing Web Bot</CardTitle>
                  
                  {connectionState === 'Connected' && (
                    <span className="px-2.5 py-0.5 bg-[#25D366]/10 text-[#25D366] text-[9px] font-black uppercase tracking-wider rounded-md border border-[#25D366]/20">
                      Bot Connected
                    </span>
                  )}
                  {connectionState === 'Disconnected' && (
                    <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-wider rounded-md border border-rose-500/20">
                      Disconnected
                    </span>
                  )}
                  {connectionState === 'Syncing' && (
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-wider rounded-md border border-amber-500/20 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Connecting
                    </span>
                  )}
                </div>
                <CardDescription>Pair with your WhatsApp Business number to run local notifications.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {connectionState === 'Disconnected' && (
                  <div className="flex flex-col items-center py-4 text-center space-y-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xl flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mockQrCode} alt="WhatsApp Pair Code" className="w-40 h-40 border border-slate-100 rounded-xl" />
                    </div>
                    
                    <form onSubmit={handlePairSubmit} className="w-full space-y-3 max-w-[240px]">
                      <input
                        type="text"
                        required
                        value={pairingNumber}
                        onChange={(e) => setPairingNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-center text-xs text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Pair Business Number
                      </button>
                    </form>
                  </div>
                )}

                {connectionState === 'Syncing' && (
                  <div className="h-52 flex flex-col justify-center items-center text-slate-500 text-xs gap-3">
                    <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
                    <span>Synchronizing with WhatsApp Business Webhook...</span>
                  </div>
                )}

                {connectionState === 'Connected' && (
                  <div className="w-full space-y-4 text-center py-6">
                    <div className="h-16 w-16 mx-auto bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center border border-[#25D366]/20">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{pairingNumber}</p>
                      <p className="text-[10px] text-slate-550 mt-0.5">WhatsApp Bot Service Online</p>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Disconnect Bot
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Automation toggles settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1.5">
                  <Zap className="h-4.5 w-4.5 text-emerald-400" /> Automation Triggers Settings
                </CardTitle>
                <CardDescription>Configure automated bot dispatchers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-900">
                  <div>
                    <p className="text-xs font-bold text-white">Auto Birthday Greetings</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Dispatches personalized wishes & 15% discount.</p>
                  </div>
                  <button onClick={() => handleToggle('autoBirthdays')} className="cursor-pointer">
                    {settings.autoBirthdays ? (
                      <ToggleRight className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <div>
                    <p className="text-xs font-bold text-white">Trainer WhatsApp Sharing</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Allows coaches to send schedules directly to members.</p>
                  </div>
                  <button onClick={() => handleToggle('autoSchedules')} className="cursor-pointer">
                    {settings.autoSchedules ? (
                      <ToggleRight className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-600" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Inbound AI Payment Slip OCR Simulator & Outbound activity logs (7 columns) */}
          <div className="xl:col-span-7 space-y-6">
            
            {/* Inbound OCR Simulation */}
            <Card glow={ocrProcessing}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1.5">
                  <RefreshCw className="h-4.5 w-4.5 text-emerald-400" /> AI Payment Slip OCR Bot Simulator
                </CardTitle>
                <CardDescription>
                  Simulate a gym member sending a bank transfer slip receipt to the WhatsApp Bot. AI OCR parses data and submits it as `AI Verified`.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOcrSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Select Member Account</label>
                      <select
                        value={ocrMemberId}
                        onChange={(e) => setOcrMemberId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                      >
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Simulated Bank Name</label>
                      <select
                        value={ocrBank}
                        onChange={(e) => setOcrBank(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                      >
                        <option value="Commercial Bank">Commercial Bank</option>
                        <option value="Sampath Bank">Sampath Bank</option>
                        <option value="HNB Bank">HNB Bank</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Amount LKR</label>
                      <input
                        type="text"
                        required
                        value={ocrAmount}
                        onChange={(e) => setOcrAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Receipt Receipt Slip Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. member_sampath_receipt.jpg"
                          value={ocrFileName}
                          onChange={(e) => setOcrFileName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none"
                        />
                        <Upload className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={ocrProcessing || connectionState !== 'Connected'}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30"
                  >
                    {ocrProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> AI Bot Parsing Slip Receipt...
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-4 w-4" /> Process Inbound Slip via AI Bot
                      </>
                    )}
                  </button>
                </form>
              </CardContent>
            </Card>

            {/* Outbound Activity Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1.5">
                  <Clock className="h-4.5 w-4.5 text-emerald-400" /> Outbound WhatsApp Message Activity Log
                </CardTitle>
                <CardDescription>Activity details showing real-time automation delivery logs.</CardDescription>
              </CardHeader>
              <CardContent>
                {waLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No WhatsApp logs generated.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider pb-2">
                          <th className="py-2 px-2">Recipient</th>
                          <th className="py-2 px-2">Type</th>
                          <th className="py-2 px-2">Message Body</th>
                          <th className="py-2 px-2">Status</th>
                          <th className="py-2 px-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {waLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="py-3 px-2 font-mono text-slate-400">{log.receiverPhone}</td>
                            <td className="py-3 px-2">
                              <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-bold text-slate-450 uppercase">
                                {log.type}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-slate-300 max-w-[200px] truncate leading-normal" title={log.message}>
                              "{log.message}"
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-[#25D366] font-bold uppercase tracking-wider text-[9px] flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3 stroke-[2.5]" /> {log.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right text-slate-500 font-mono">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      </main>
    </div>
  );
}

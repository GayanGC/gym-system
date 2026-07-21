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
  Send,
  Zap,
  TrendingUp,
  AlertTriangle,
  History,
  CheckCircle2,
  Calendar,
  LogOut,
  ChevronRight,
  Sparkles,
  Building2,
  BellRing,
  LayoutDashboard
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { 
  getGym, 
  getMembers, 
  getMemberAttendance, 
  addReengagementLog, 
  getReengagementLogs, 
  getActiveGymId,
  Gym, 
  User as UserType, 
  ReengagementAttempt 
} from '@/lib/db';
import { sendLocalSms } from '@/lib/sms';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function RetentionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RetentionContent />
    </Suspense>
  );
}

interface InactiveMember {
  member: UserType;
  inactiveDays: number;
  lastCheckinStr: string;
}

function RetentionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [gymId, setGymId] = useState<string | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  
  const [atRiskMembers, setAtRiskMembers] = useState<InactiveMember[]>([]);
  const [reengageLogs, setReengageLogs] = useState<ReengagementAttempt[]>([]);
  
  // Template settings
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const templates = [
    { id: 1, text: "Hi [Name], we missed you at [Gym]! Your custom workout routine is waiting. Come train today! 🔥" },
    { id: 2, text: "Hey [Name]! Consistency is key. You've been away from [Gym] for [Days] days. Drop in today for a quick session! 🏋️" },
    { id: 3, text: "Special Offer for [Name]! Come back to [Gym] this week and get a free protein shake on us! 🥤 Let's crush those goals." }
  ];

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

    // Retention Engine Inactivity Check
    const allMembers = getMembers(id);
    const calculated: InactiveMember[] = [];

    allMembers.forEach((member) => {
      const attendance = getMemberAttendance(id, member.id);
      
      let inactiveDays = 0;
      let lastCheckinStr = 'Never Checked In';

      if (attendance.length > 0) {
        // Sort logs desc
        const sorted = [...attendance].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const latestLog = sorted[0];
        const diffMs = Date.now() - new Date(latestLog.timestamp).getTime();
        inactiveDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        lastCheckinStr = new Date(latestLog.timestamp).toLocaleDateString();
      } else {
        // No attendance recorded, calculate from member created date (or treat as 15 days for demo)
        const createdMs = Date.now() - new Date(member.createdAt).getTime();
        inactiveDays = Math.floor(createdMs / (1000 * 60 * 60 * 24));
        if (inactiveDays <= 0) {
          inactiveDays = 15; // Seed demo value for member without logs
        }
      }

      if (inactiveDays >= 5) {
        calculated.push({
          member,
          inactiveDays,
          lastCheckinStr
        });
      }
    });

    // Sort by inactive days desc
    calculated.sort((a, b) => b.inactiveDays - a.inactiveDays);
    setAtRiskMembers(calculated);

    // Get logs history
    setReengageLogs(getReengagementLogs(id));
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

  const compileTemplate = (templateText: string, memberName: string, days: number): string => {
    if (!gym) return templateText;
    return templateText
      .replace(/\[Name\]/g, memberName)
      .replace(/\[Gym\]/g, gym.gymName)
      .replace(/\[Days\]/g, days.toString());
  };

  const handleSendSingleSms = (inactive: InactiveMember) => {
    if (!gymId || !gym) return;

    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    const compiledMessage = compileTemplate(template.text, inactive.member.name, inactive.inactiveDays);

    // Send SMS
    const result = sendLocalSms(gymId, inactive.member.phone || '', compiledMessage, 'Re-engagement');

    if (result.success) {
      // Log re-engagement
      addReengagementLog(gymId, inactive.member.id, compiledMessage);
      
      // Reload logs
      setReengageLogs(getReengagementLogs(gymId));

      toast({
        title: 'SMS Sent Successfully!',
        description: `Re-engagement notification dispatched to ${inactive.member.name}.`,
        type: 'success',
      });
    } else {
      toast({
        title: 'SMS Failed',
        description: result.error || 'Gateway network error.',
        type: 'error',
      });
    }
  };

  const handleBulkReengage = () => {
    if (!gymId || !gym || atRiskMembers.length === 0) return;

    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    let successCount = 0;

    atRiskMembers.forEach((inactive) => {
      const compiledMessage = compileTemplate(template.text, inactive.member.name, inactive.inactiveDays);
      const result = sendLocalSms(gymId, inactive.member.phone || '', compiledMessage, 'Re-engagement');
      if (result.success) {
        addReengagementLog(gymId, inactive.member.id, compiledMessage);
        successCount++;
      }
    });

    if (successCount > 0) {
      setReengageLogs(getReengagementLogs(gymId));
      toast({
        title: 'Bulk SMS Sent!',
        description: `Successfully broadcasted to ${successCount} inactive members.`,
        type: 'success',
      });
    } else {
      toast({
        title: 'SMS Broadcasting Skipped',
        description: 'Auto-SMS triggers are currently disabled in settings.',
        type: 'error',
      });
    }
  };

  const handleLogout = () => {
    toast({ title: 'Logged Out', description: 'Session ended.', type: 'info' });
    router.push('/login');
  };

  if (!gym) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative">
      
      {/* Background glow */}
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
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-sm cursor-pointer"
          >
            <Users className="h-4.5 w-4.5" /> Retention Engine
            <ChevronRight className="ml-auto h-4 w-4" />
          </button>

          <button
            onClick={() => router.push(`/dashboard/whatsapp?gym_id=${gym.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-205 hover:bg-slate-900/50 text-sm cursor-pointer"
          >
            <MessageSquare className="h-4.5 w-4.5" /> WhatsApp Bot
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
              <span>At-Risk Retention System</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">{gym.gymName}</h1>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBulkReengage}
              disabled={atRiskMembers.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
            >
              <BellRing className="h-4 w-4" /> Bulk Re-engage All
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: At-Risk Members table (8 columns) */}
          <div className="xl:col-span-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">At-Risk Member Inactivity Detection</CardTitle>
                <CardDescription>
                  Members who have not checked in for 5+ days. Send re-engagement templates to increase retention.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {atRiskMembers.length === 0 ? (
                  <div className="h-64 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
                    <p className="text-sm text-slate-400 font-semibold">Excellent Member Retention!</p>
                    <p className="text-xs text-slate-550 mt-1">All members have checked in within the last 5 days.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Member</th>
                          <th className="py-3 px-4">Phone Number</th>
                          <th className="py-3 px-4">Last Check-in</th>
                          <th className="py-3 px-4">Inactivity State</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {atRiskMembers.map((mObj) => (
                          <tr key={mObj.member.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-white">{mObj.member.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{mObj.member.id}</p>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{mObj.member.phone}</td>
                            <td className="py-3.5 px-4 text-xs font-medium text-slate-300">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" /> {mObj.lastCheckinStr}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {mObj.inactiveDays >= 10 ? (
                                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-rose-500/20 inline-flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Critical ({mObj.inactiveDays} Days)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-500/20 inline-flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> At-Risk ({mObj.inactiveDays} Days)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleSendSingleSms(mObj)}
                                className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center justify-end gap-1 cursor-pointer ml-auto"
                              >
                                <Send className="h-3 w-3" /> Send SMS
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

          {/* Right Column: Templates & Logs history (4 columns) */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Template Selector Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1.5">
                  <Zap className="h-4.5 w-4.5 text-emerald-400" /> Message Templates
                </CardTitle>
                <CardDescription>Select re-engagement template.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs leading-normal transition-all cursor-pointer ${
                      selectedTemplate === tpl.id
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-850'
                    }`}
                  >
                    <p className="font-bold text-[10px] text-emerald-450 uppercase mb-1.5">Template Option {tpl.id}</p>
                    <p className="font-sans leading-relaxed">"{tpl.text}"</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Retention History Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1.5">
                  <History className="h-4.5 w-4.5 text-emerald-400" /> Re-engagement History
                </CardTitle>
                <CardDescription>Recently sent re-engagement triggers.</CardDescription>
              </CardHeader>
              <CardContent>
                {reengageLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4 italic">No re-engagement actions logged yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {reengageLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-[11px] space-y-1">
                        <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                          <span>{log.memberName}</span>
                          <span className="font-mono text-slate-600">{new Date(log.sentAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-350 leading-relaxed font-sans">"{log.message}"</p>
                      </div>
                    ))}
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

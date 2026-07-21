'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Dumbbell, 
  Flame, 
  Calendar, 
  MapPin, 
  Ruler, 
  Scale, 
  Target,
  Sparkles,
  Award,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Heart,
  TrendingDown,
  Activity,
  CalendarDays,
  Utensils,
  LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/toast';
import { 
  getGym, 
  getMember, 
  getMemberWorkoutPlan, 
  getMemberAttendance, 
  logAttendance,
  Gym,
  User,
  WorkoutPlan,
  Attendance
} from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function MemberPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MemberContent />
    </Suspense>
  );
}

function MemberContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [gymId, setGymId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [member, setMember] = useState<User | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  
  // Navigation / Tabs (Mobile bottom bar simulation)
  const [activeTab, setActiveTab] = useState<'home' | 'workout' | 'diet'>('home');
  const [checkingIn, setCheckingIn] = useState(false);

  // Load details
  useEffect(() => {
    const activeGymId = searchParams.get('gym_id');
    const activeMemberId = searchParams.get('member_id');

    if (!activeGymId || !activeMemberId) {
      router.push('/login');
      return;
    }

    const currentGym = getGym(activeGymId);
    const currentMember = getMember(activeGymId, activeMemberId);

    if (!currentGym || !currentMember) {
      toast({
        title: 'Authentication Error',
        description: 'Invalid membership session keys.',
        type: 'error',
      });
      router.push('/login');
      return;
    }

    setGymId(activeGymId);
    setMemberId(activeMemberId);
    setGym(currentGym);
    setMember(currentMember);
    setWorkoutPlan(getMemberWorkoutPlan(activeGymId, activeMemberId));
    setAttendance(getMemberAttendance(activeGymId, activeMemberId));
  }, [searchParams, router, toast]);

  const handleCheckIn = () => {
    if (!gymId || !memberId) return;

    setCheckingIn(true);
    setTimeout(() => {
      const newLog = logAttendance(gymId, memberId);
      
      // Update local states
      setAttendance((prev) => [...prev, newLog]);
      const updatedMember = getMember(gymId, memberId);
      if (updatedMember) {
        setMember(updatedMember);
      }

      setCheckingIn(false);

      toast({
        title: 'Check-in Logged!',
        description: 'Your counter attendance check has been registered successfully.',
        type: 'success',
      });

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.8 }
      });
    }, 1000);
  };

  const handleLogout = () => {
    toast({ title: 'Logged Out', description: 'Session ended.', type: 'info' });
    router.push('/login');
  };

  if (!gym || !member) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Pre-configured mock diet plans based on member goals
  const mockDiets: Record<string, string[]> = {
    'weight-loss': [
      'Meal 1: Oats with Almond milk, protein powder and blueberries.',
      'Meal 2: Grilled Chicken Breast with Broccoli and Steamed Quinoa.',
      'Meal 3: Whey protein shake with almonds.',
      'Meal 4: Baked Salmon with Asparagus and Mixed Green salad.'
    ],
    'muscle-building': [
      'Meal 1: 4 scrambled eggs, 3 slices of whole wheat toast, and 1 banana.',
      'Meal 2: Lean beef steak with sweet potatoes and green beans.',
      'Meal 3: Peanut butter oatmeal bowl with greek yogurt.',
      'Meal 4: Grilled Tuna steak with brown rice and mixed vegetables.'
    ],
    'athletic-fitness': [
      'Meal 1: Smoothie bowl (spinach, banana, chia seeds, oat milk, whey).',
      'Meal 2: Turkey wrap with avocado, spinach, and hummus.',
      'Meal 3: Cottage cheese cup with sliced pineapple.',
      'Meal 4: Grilled Cod fish with sweet potato mash and asparagus.'
    ],
    'general-health': [
      'Meal 1: Greek yogurt topped with honey, walnuts, and strawberries.',
      'Meal 2: Chicken quinoa salad bowl with olive oil dressing.',
      'Meal 3: Apple slices with organic peanut butter.',
      'Meal 4: Baked sea bass with stir-fry vegetables.'
    ]
  };

  const activeGoal = member.goal || 'general-health';
  const dietPlanList = mockDiets[activeGoal] || mockDiets['general-health'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center relative overflow-x-hidden pb-24">
      {/* Background neon blur */}
      <div className="absolute top-0 w-full h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Simulated Mobile Device Wrapper (centering style) */}
      <div className="w-full max-w-md flex flex-col flex-1 px-4 pt-6">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Dumbbell className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-tight">FitPulse App</h1>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold uppercase tracking-wider">
                <MapPin className="h-3 w-3 text-emerald-400 shrink-0" /> {gym.gymName}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 bg-slate-900 border border-slate-805 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </header>

        {/* TAB 1: HOME PANEL */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-300 z-10">
            
            {/* User welcome & streak stats */}
            <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-xl">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Logged Member</p>
                <h3 className="text-xl font-black text-white mt-0.5">{member.name}</h3>
                <p className="text-xs text-emerald-400 font-mono mt-1 uppercase tracking-wider">{gym.id}</p>
              </div>

              {/* Flame streak */}
              <div className="flex flex-col items-center p-2.5 bg-slate-950 border border-slate-850 rounded-2xl shadow-inner shrink-0">
                <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
                <span className="text-base font-black text-white font-mono mt-0.5">{member.streak || 0}</span>
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Streak</span>
              </div>
            </div>

            {/* Check-in Trigger Counter */}
            <Card className="border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] bg-slate-900/20" glow>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Log Today's Workout Streak</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
                    Simulate scanning the QR counter poster at the reception desk to register check-in.
                  </p>
                </div>
                
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {checkingIn ? (
                    <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Register Daily Check-in <Sparkles className="h-4 w-4" />
                    </>
                  )}
                </button>
              </CardContent>
            </Card>

            {/* Body Metrics Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Personal Body Stats</CardTitle>
                <CardDescription className="text-xs">Your registered scale logs.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center">
                  <Ruler className="h-4 w-4 text-emerald-500 mb-1" />
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Height</span>
                  <span className="text-xs font-bold text-white mt-0.5 font-mono">{member.height || 175} cm</span>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center">
                  <Scale className="h-4 w-4 text-emerald-500 mb-1" />
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Weight</span>
                  <span className="text-xs font-bold text-white mt-0.5 font-mono">{member.weight || 75} kg</span>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center">
                  <Target className="h-4 w-4 text-emerald-500 mb-1" />
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Target</span>
                  <span className="text-xs font-bold text-white mt-0.5 font-mono">{member.targetWeight || 70} kg</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Goals Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-bold">Primary Target Goal</CardTitle>
                <div className="p-1.5 bg-slate-950 border border-slate-850 rounded-lg text-emerald-400">
                  {activeGoal === 'weight-loss' && <TrendingDown className="h-4 w-4" />}
                  {activeGoal === 'muscle-building' && <Flame className="h-4 w-4" />}
                  {activeGoal === 'athletic-fitness' && <Activity className="h-4 w-4" />}
                  {activeGoal === 'general-health' && <Heart className="h-4 w-4" />}
                </div>
              </CardHeader>
              <CardContent className="text-xs text-slate-400 leading-relaxed flex items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <div>
                  <p className="font-bold text-white uppercase tracking-wider text-[10px]">
                    {activeGoal.replace('-', ' ')}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Your trainer is tailoring workouts to match this objective.
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-650" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: WORKOUT PLAN */}
        {activeTab === 'workout' && (
          <div className="space-y-6 animate-in fade-in duration-300 z-10">
            <h2 className="text-base font-black text-white flex items-center gap-1.5 px-1">
              <ClipboardList className="h-4.5 w-4.5 text-emerald-400" /> Assigned Routine
            </h2>

            {!workoutPlan ? (
              <div className="p-8 border border-dashed border-slate-850 rounded-3xl text-center bg-slate-900/10">
                <Dumbbell className="h-10 w-10 text-slate-700 mb-3 mx-auto animate-pulse" />
                <h3 className="text-sm font-bold text-slate-400">No Workout Assigned</h3>
                <p className="text-xs text-slate-505 mt-1 max-w-[200px] mx-auto">
                  Your assigned personal coach hasn't constructed a workout routine for your goals yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Card glow>
                  <CardHeader className="pb-3 border-b border-slate-950">
                    <CardTitle className="text-sm">Today's Exercises</CardTitle>
                    <CardDescription className="text-xs">Assigned by coach on {new Date(workoutPlan.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 divide-y divide-slate-950">
                    {workoutPlan.exercises.map((ex, idx) => (
                      <div key={idx} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{ex.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Assigned sets target</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-white font-mono">{ex.sets} Sets</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{ex.reps} Reps</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Logged checkins list */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <CalendarDays className="h-4.5 w-4.5 text-emerald-400" /> Attendance Ledger
                    </CardTitle>
                    <CardDescription className="text-xs">Your counter log history.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {attendance.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No attendance checks logged.</p>
                    ) : (
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {attendance.map((log) => (
                          <div key={log.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-900 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Check-in Registered</span>
                            <span className="font-mono text-slate-500">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DIET WORKOUT */}
        {activeTab === 'diet' && (
          <div className="space-y-6 animate-in fade-in duration-300 z-10">
            <h2 className="text-base font-black text-white flex items-center gap-1.5 px-1">
              <Utensils className="h-4.5 w-4.5 text-emerald-400" /> Nutritional Guide
            </h2>

            <Card glow>
              <CardHeader className="pb-3 border-b border-slate-950">
                <CardTitle className="text-sm">Goal-Based Diet Schedule</CardTitle>
                <CardDescription className="text-xs">Meal schedules matching target goal: <span className="text-emerald-400 font-bold uppercase">{activeGoal.replace('-', ' ')}</span></CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {dietPlanList.map((meal, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl text-xs">
                    <p className="font-bold text-white mb-1">Meal Option {idx + 1}</p>
                    <p className="text-slate-400 leading-relaxed">{meal}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dynamic bottom bar simulation */}
        <nav className="fixed bottom-0 inset-x-0 bg-slate-950/80 border-t border-slate-900 py-3 px-6 flex justify-around items-center backdrop-blur-md z-30">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wide transition-colors cursor-pointer ${
              activeTab === 'home' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity className="h-5 w-5" />
            Home
          </button>
          
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wide transition-colors cursor-pointer ${
              activeTab === 'workout' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Dumbbell className="h-5 w-5" />
            Workout Plan
          </button>

          <button
            onClick={() => setActiveTab('diet')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wide transition-colors cursor-pointer ${
              activeTab === 'diet' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Utensils className="h-5 w-5" />
            Diet Plan
          </button>
        </nav>

      </div>
    </div>
  );
}

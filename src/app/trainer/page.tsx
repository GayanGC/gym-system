'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Dumbbell, 
  Users, 
  Flame, 
  TrendingDown, 
  Activity, 
  Heart, 
  Plus, 
  Trash2, 
  Sparkles,
  ClipboardList,
  Calendar,
  LogOut,
  User,
  ActivitySquare,
  MessageSquare
} from 'lucide-react';
import { sendWhatsAppMsg } from '@/lib/whatsapp';
import { useToast } from '@/components/ui/toast';
import { 
  getGym, 
  getUser, 
  getMembers, 
  getMemberWorkoutPlan, 
  saveWorkoutPlan, 
  getMemberAttendance,
  Gym,
  User as UserType,
  WorkoutPlan,
  Attendance,
  Exercise
} from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function TrainerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TrainerContent />
    </Suspense>
  );
}

function TrainerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [gymId, setGymId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [trainer, setTrainer] = useState<UserType | null>(null);
  const [members, setMembers] = useState<UserType[]>([]);
  
  // Selected Member context
  const [selectedMember, setSelectedMember] = useState<UserType | null>(null);
  const [memberPlan, setMemberPlan] = useState<WorkoutPlan | null>(null);
  const [memberAttendance, setMemberAttendance] = useState<Attendance[]>([]);

  // Exercise builder form
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState({
    name: '',
    sets: 3,
    reps: 10
  });

  // Verify parameters
  useEffect(() => {
    const activeGymId = searchParams.get('gym_id');
    const activeTrainerId = searchParams.get('trainer_id');

    if (!activeGymId || !activeTrainerId) {
      router.push('/login');
      return;
    }

    const currentGym = getGym(activeGymId);
    const currentTrainer = getUser(activeTrainerId);

    if (!currentGym || !currentTrainer || currentTrainer.role !== 'TRAINER') {
      toast({
        title: 'Authentication Error',
        description: 'Invalid trainer session parameters.',
        type: 'error',
      });
      router.push('/login');
      return;
    }

    setGymId(activeGymId);
    setTrainerId(activeTrainerId);
    setGym(currentGym);
    setTrainer(currentTrainer);
    setMembers(getMembers(activeGymId));
  }, [searchParams, router, toast]);

  // Load member specific data
  useEffect(() => {
    if (!gymId || !selectedMember) {
      setMemberPlan(null);
      setMemberAttendance([]);
      setExercises([]);
      return;
    }

    const plan = getMemberWorkoutPlan(gymId, selectedMember.id);
    setMemberPlan(plan);
    setMemberAttendance(getMemberAttendance(gymId, selectedMember.id));
    
    if (plan) {
      setExercises(plan.exercises);
    } else {
      setExercises([]);
    }
  }, [gymId, selectedMember]);

  const handleSendWhatsApp = () => {
    if (!gymId || !selectedMember || !trainerId || !gym || !trainer || exercises.length === 0) return;

    const exerciseText = exercises.map((ex) => `- ${ex.name}: ${ex.sets} sets × ${ex.reps} reps`).join('\n');
    const message = `Hi ${selectedMember.name}, here is your workout routine from Coach ${trainer.name} at ${gym.gymName}:\n\n${exerciseText}\n\nLet's get to work! 🏋️‍♂️`;

    const result = sendWhatsAppMsg(gymId, selectedMember.phone || '', message, 'Workout Schedule');

    if (result.success) {
      toast({
        title: 'WhatsApp Dispatched!',
        description: `Workout routine shared with ${selectedMember.name} successfully.`,
        type: 'success',
      });
    } else {
      toast({
        title: 'WhatsApp Failed',
        description: result.error || 'Bot is disconnected.',
        type: 'error',
      });
    }
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExercise.name) return;

    setExercises((prev) => [...prev, {
      name: currentExercise.name,
      sets: currentExercise.sets,
      reps: currentExercise.reps
    }]);

    setCurrentExercise({ name: '', sets: 3, reps: 10 });
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAssignPlan = () => {
    if (!gymId || !selectedMember || !trainerId) return;

    if (exercises.length === 0) {
      toast({
        title: 'Empty Plan',
        description: 'Please add at least one exercise to assign.',
        type: 'error',
      });
      return;
    }

    const saved = saveWorkoutPlan({
      gymId,
      memberId: selectedMember.id,
      assignedBy: trainerId,
      exercises
    });

    setMemberPlan(saved);

    toast({
      title: 'Workout Plan Saved',
      description: `Assigned successfully to ${selectedMember.name}.`,
      type: 'success',
    });
  };

  const handleLogout = () => {
    toast({ title: 'Logged Out', description: 'Trainer session ended.', type: 'info' });
    router.push('/login');
  };

  if (!gym || !trainer) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative pb-12">
      {/* Background glow */}
      <div className="absolute top-0 left-1/3 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <header className="bg-slate-900/40 border-b border-slate-900 px-6 py-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Dumbbell className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-sm font-black text-white tracking-tight block">
              FitPulse<span className="text-emerald-400">.TRAINER</span>
            </span>
            <span className="text-[10px] text-slate-500 block -mt-0.5">{gym.gymName}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right text-xs">
            <span className="text-white font-bold">{trainer.name}</span>
            <span className="text-[10px] text-slate-500">{trainer.specialization}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>

      {/* Dashboard container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 flex-1">
        
        {/* Left Column: Member List */}
        <section className="lg:col-span-4 space-y-4">
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" /> Active Members
          </h2>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {members.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                No members registered in this gym.
              </div>
            ) : (
              members.map((m) => {
                const isSelected = selectedMember?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white' 
                        : 'bg-slate-900/30 border-slate-900 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{m.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-wider">
                        {m.goal?.replace('-', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400">
                        Streak: {m.streak || 0}d
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Member Workspace */}
        <section className="lg:col-span-8 space-y-6">
          {!selectedMember ? (
            <div className="h-96 border border-dashed border-slate-850 rounded-3xl flex flex-col justify-center items-center text-center p-6 bg-slate-900/10">
              <ClipboardList className="h-12 w-12 text-slate-700 mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-slate-400">No Member Selected</h3>
              <p className="text-xs text-slate-500 max-w-[240px] mt-1">
                Select an active member from the roster panel to construct workout schedules.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Member profile header card */}
              <Card glow>
                <CardHeader className="flex flex-row items-start justify-between pb-4 border-b border-slate-900">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">{selectedMember.id}</span>
                    <CardTitle className="text-2xl mt-0.5">{selectedMember.name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                      <span>Age: {selectedMember.age}</span>
                      <span>Gender: {selectedMember.gender}</span>
                      <span>Streak: {selectedMember.streak || 0} Days</span>
                    </CardDescription>
                  </div>
                  
                  {/* Goal Indicator Badge */}
                  <div className="p-2.5 bg-slate-950 border border-slate-850 text-emerald-400 rounded-xl flex items-center gap-1.5">
                    {selectedMember.goal === 'weight-loss' && <TrendingDown className="h-4 w-4" />}
                    {selectedMember.goal === 'muscle-building' && <Flame className="h-4 w-4" />}
                    {selectedMember.goal === 'athletic-fitness' && <Activity className="h-4 w-4" />}
                    {selectedMember.goal === 'general-health' && <Heart className="h-4 w-4" />}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {selectedMember.goal?.replace('-', ' ')}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="grid grid-cols-3 gap-4 pt-6 text-center">
                  <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Height</span>
                    <p className="text-sm font-bold text-white mt-0.5 font-mono">{selectedMember.height} cm</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Current Weight</span>
                    <p className="text-sm font-bold text-white mt-0.5 font-mono">{selectedMember.weight} kg</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Goal Weight</span>
                    <p className="text-sm font-bold text-white mt-0.5 font-mono">{selectedMember.targetWeight} kg</p>
                  </div>
                </CardContent>
              </Card>

              {/* Workout Routine Builder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Exercise Adder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <ActivitySquare className="h-4.5 w-4.5 text-emerald-400" /> Build Workout Plan
                    </CardTitle>
                    <CardDescription>Configure individual exercises, set loads, and target reps.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddExercise} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Exercise Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Incline Bench Press"
                          value={currentExercise.name}
                          onChange={(e) => setCurrentExercise(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-750 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Sets</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={currentExercise.sets}
                            onChange={(e) => setCurrentExercise(prev => ({ ...prev, sets: parseInt(e.target.value) || 1 }))}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reps</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={currentExercise.reps}
                            onChange={(e) => setCurrentExercise(prev => ({ ...prev, reps: parseInt(e.target.value) || 1 }))}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="h-4 w-4 text-emerald-400" /> Add to List
                      </button>
                    </form>
                  </CardContent>
                </Card>

                {/* Workout List Preview */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base">Exercises List</CardTitle>
                      <CardDescription>Added exercises for this plan.</CardDescription>
                    </div>
                    <span className="text-[10px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400 font-mono">
                      {exercises.length} items
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {exercises.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs italic">
                          No exercises added.
                        </div>
                      ) : (
                        exercises.map((ex, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-900 text-xs">
                            <div>
                              <p className="font-bold text-white">{ex.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{ex.sets} Sets × {ex.reps} Reps</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(idx)}
                              className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleAssignPlan}
                        disabled={exercises.length === 0}
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="h-4 w-4 animate-pulse" /> Save Plan
                      </button>

                      <button
                        type="button"
                        onClick={handleSendWhatsApp}
                        disabled={exercises.length === 0}
                        className="flex-1 py-3 border border-[#25D366]/20 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] disabled:opacity-30 disabled:pointer-events-none font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="h-4 w-4 text-[#25D366]" /> Share WA
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <Calendar className="h-4.5 w-4.5 text-emerald-400" /> Member Attendance Log
                  </CardTitle>
                  <CardDescription>Track member check-in history logged via QR counter poster.</CardDescription>
                </CardHeader>
                <CardContent>
                  {memberAttendance.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs italic">
                      No attendance checks recorded yet.
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-900 ml-3 pl-6 space-y-4 max-h-[150px] overflow-y-auto">
                      {memberAttendance.map((log) => (
                        <div key={log.id} className="relative text-xs">
                          {/* Dot accent */}
                          <div className="absolute -left-[29px] top-1 h-2 w-2 rounded-full bg-emerald-500 border-2 border-slate-950" />
                          <p className="font-bold text-white">Checked in at gym counter</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          )}
        </section>

      </main>
    </div>
  );
}

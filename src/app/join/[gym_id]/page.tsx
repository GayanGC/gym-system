'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dumbbell, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Phone, 
  Users, 
  Ruler, 
  Scale, 
  Target, 
  CheckCircle,
  TrendingDown,
  Activity,
  Flame,
  PlusCircle,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/toast';
import { getGym, addMember, Gym } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';

interface JoinPageProps {
  params: Promise<{ gym_id: string }>;
}

export default function JoinPage({ params }: JoinPageProps) {
  const resolvedParams = use(params);
  const gymId = resolvedParams.gym_id;
  
  const router = useRouter();
  const { toast } = useToast();
  
  const [gym, setGym] = useState<Gym | null>(null);
  const [loadingGym, setLoadingGym] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    targetWeight: '',
    goal: '',
  });

  useEffect(() => {
    if (!gymId) return;
    const currentGym = getGym(gymId);
    if (!currentGym) {
      toast({
        title: 'Invalid Onboarding Link',
        description: 'No registered gym corresponds to this ID. Redirecting to registration.',
        type: 'error',
      });
      router.push('/register');
      return;
    }
    setGym(currentGym);
    setLoadingGym(false);
  }, [gymId, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoalSelect = (goal: string) => {
    setFormData((prev) => ({ ...prev, goal }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone || !formData.age) {
        toast({
          title: 'Required Fields',
          description: 'Please enter your name, phone, and age.',
          type: 'error',
        });
        return;
      }
    } else if (step === 2) {
      if (!formData.height || !formData.weight || !formData.targetWeight) {
        toast({
          title: 'Required Stats',
          description: 'Please specify height, current weight, and target weight.',
          type: 'error',
        });
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.goal) {
      toast({
        title: 'Goal Required',
        description: 'Please select your primary fitness goal.',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      if (!gymId) return;

      addMember(gymId, {
        name: formData.fullName,
        phone: formData.phone,
        age: parseInt(formData.age) || 25,
        gender: formData.gender,
        height: parseFloat(formData.height) || 175,
        weight: parseFloat(formData.weight) || 75,
        targetWeight: parseFloat(formData.targetWeight) || 70,
        goal: formData.goal,
      });

      setSubmitting(false);
      setCompleted(true);

      // Trigger Celebration confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      
      // Secondary burst
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 }
        });
      }, 300);
      
    }, 1500);
  };

  if (loadingGym) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (completed && gym) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-sm text-center z-10 space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-2">
            <CheckCircle className="h-10 w-10 animate-bounce" />
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">Onboarding Complete!</h1>
          
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-300 space-y-4">
            <p className="text-sm font-semibold">
              Congratulations! Your member profile has been registered at <span className="text-white font-bold">{gym.gymName}</span>.
            </p>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs text-slate-400 font-mono">
              Member ID: MBR-{(Math.random() * 100000).toFixed(0)}
            </div>
            <p className="text-xs text-slate-400">
              Show this screen to the gym receptionist to activate your credentials.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button 
              onClick={() => {
                toast({
                  title: 'Added to Home Screen',
                  description: 'FitPulse PWA configuration initialized.',
                  type: 'success'
                });
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg cursor-pointer"
            >
              Add App to Home Screen
            </button>
            <p className="text-[10px] text-slate-500">
              Powered by FitPulse.AI • Cloud Fitness Onboarding
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-sm text-center pt-6 z-10 shrink-0">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 mb-2">
          <Dumbbell className="h-5 w-5 text-slate-950 stroke-[2.5]" />
        </div>
        <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">Welcome to</p>
        <h2 className="text-xl font-black text-white">{gym?.gymName}</h2>
      </header>

      {/* Progress Steps */}
      <div className="w-full max-w-sm mt-6 z-10 shrink-0">
        <div className="flex justify-between items-center px-2 mb-2 text-slate-400 text-xs">
          <span>Step {step} of 3</span>
          <span className="font-bold text-emerald-400">
            {step === 1 && 'Personal Info'}
            {step === 2 && 'Body Stats'}
            {step === 3 && 'Fitness Goals'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Multi-step Form Content */}
      <main className="w-full max-w-sm flex-1 flex flex-col justify-center my-6 z-10 relative">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <CardContent className="pt-6">
            
            {/* STEP 1: PERSONAL INFO */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-emerald-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-emerald-400" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. +94 77 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-emerald-400" /> Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      required
                      placeholder="e.g. 24"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: BODY STATS */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5 text-emerald-400" /> Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    required
                    placeholder="e.g. 175"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Scale className="h-3.5 w-3.5 text-emerald-400" /> Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      required
                      placeholder="e.g. 80"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 text-emerald-400" /> Target Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="targetWeight"
                      required
                      placeholder="e.g. 70"
                      value={formData.targetWeight}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: GOALS SELECTION */}
            {step === 3 && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Select Your Primary Goal
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'weight-loss', title: 'Weight Loss', desc: 'Burn calories & shed body fat', icon: TrendingDown },
                    { id: 'muscle-building', title: 'Muscle Building', desc: 'Gain mass & hyper strength', icon: Flame },
                    { id: 'athletic-fitness', title: 'Athletic Fitness', desc: 'Improve agility & performance', icon: Activity },
                    { id: 'general-health', title: 'General Health', desc: 'Balanced lifestyle & wellness', icon: Heart },
                  ].map((goal) => {
                    const Icon = goal.icon;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => handleGoalSelect(goal.id)}
                        className={`w-full flex items-center gap-4 p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                          formData.goal === goal.id
                            ? 'bg-emerald-500/10 border-emerald-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          formData.goal === goal.id ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{goal.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{goal.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </main>

      {/* Navigation Footer */}
      <footer className="w-full max-w-sm pb-6 z-10 shrink-0 flex gap-4">
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            disabled={submitting}
            className="flex-1 border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-200 font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        
        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Complete Profile <Sparkles className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}

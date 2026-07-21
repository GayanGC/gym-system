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
  LogOut,
  CreditCard,
  Building2,
  FileCheck,
  Upload,
  Globe,
  Settings,
  User,
  Image as ImageIcon,
  Camera,
  Lock,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/toast';
import { 
  getGym, 
  getMember, 
  getMemberWorkoutPlan, 
  getMemberAttendance, 
  logAttendance,
  getPaymentSlips,
  addPaymentSlip,
  getMembers,
  updateUserProfile,
  Gym,
  User as UserType,
  WorkoutPlan,
  Attendance,
  PaymentSlip
} from '@/lib/db';
import { sendLocalSms } from '@/lib/sms';
import { getTranslation, Language } from '@/lib/i18n';
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
  const [member, setMember] = useState<UserType | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  
  // Navigation / Tabs (Mobile bottom bar simulation)
  const [activeTab, setActiveTab] = useState<'home' | 'workout' | 'diet' | 'payment' | 'settings'>('home');
  const [checkingIn, setCheckingIn] = useState(false);

  // Localization
  const [lang, setLang] = useState<Language>('en');

  // Payments state
  const [paymentMethod, setPaymentMethod] = useState<'payhere' | 'bank'>('payhere');
  const [selectedBank, setSelectedBank] = useState('Commercial Bank');
  const [slipFileName, setSlipFileName] = useState('');
  const [memberSlips, setMemberSlips] = useState<PaymentSlip[]>([]);
  const [processingPayHere, setProcessingPayHere] = useState(false);

  // Social & Privacy states
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [showRegistrationId, setShowRegistrationId] = useState(false);
  const [isProfilePrivate, setIsProfilePrivate] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  // Load details
  const loadMemberData = (gId: string, mId: string) => {
    const currentGym = getGym(gId);
    const currentMember = getMember(gId, mId);

    if (!currentGym || !currentMember) {
      toast({
        title: 'Authentication Error',
        description: 'Invalid membership session keys.',
        type: 'error',
      });
      router.push('/login');
      return;
    }

    setGym(currentGym);
    setMember(currentMember);
    setWorkoutPlan(getMemberWorkoutPlan(gId, mId));
    setAttendance(getMemberAttendance(gId, mId));
    setMemberSlips(getPaymentSlips('MEMBER', mId));
    
    setBio(currentMember.bio || '');
    setAvatarUrl(currentMember.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentMember.name)}`);
    setShowPhoneNumber(!!currentMember.showPhoneNumber);
    setShowRegistrationId(!!currentMember.showRegistrationId);
    setIsProfilePrivate(!!currentMember.isProfilePrivate);
  };

  useEffect(() => {
    const activeGymId = searchParams.get('gym_id');
    const activeMemberId = searchParams.get('member_id');

    if (!activeGymId || !activeMemberId) {
      router.push('/login');
      return;
    }

    setGymId(activeGymId);
    setMemberId(activeMemberId);
    loadMemberData(activeGymId, activeMemberId);
  }, [searchParams, router, toast]);

  const handleCheckIn = () => {
    if (!gymId || !memberId || !gym || !member) return;

    setCheckingIn(true);
    setTimeout(() => {
      const newLog = logAttendance(gymId, memberId);
      
      // Trigger SMS alerts
      const checkinTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const smsMessage = `Welcome to ${gym.gymName}! Your workout session started at ${checkinTime}. Work hard! 🔥`;
      
      sendLocalSms(gymId, member.phone || '', smsMessage, 'Check-in');

      // Update local states
      setAttendance((prev) => [...prev, newLog]);
      const updatedMember = getMember(gymId, memberId);
      if (updatedMember) {
        setMember(updatedMember);
      }

      setCheckingIn(false);

      toast({
        title: getTranslation(lang, 'checkinLogged'),
        description: 'Daily check-in completed. SMS alert generated.',
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

  // PayHere instant checkout simulator
  const handlePayHereCheckout = () => {
    if (!gymId || !memberId) return;

    setProcessingPayHere(true);
    setTimeout(() => {
      // Create approved slip automatically for instant checkout
      const mockSlip = addPaymentSlip({
        tenantType: 'MEMBER',
        referenceId: memberId,
        amount: 4500,
        bankName: 'PayHere Gateway',
        slipImage: 'Instant PayHere Checkout Token',
      });

      // Approve immediately
      mockSlip.status = 'Approved';
      // Save updated back to storage slips list manually or update slip status helper
      const slipsList = localStorage.getItem('fitpulse_slips');
      if (slipsList) {
        const parsed = JSON.parse(slipsList) as PaymentSlip[];
        // find index and approve
        const idx = parsed.findIndex(s => s.referenceId === memberId && s.bankName === 'PayHere Gateway');
        if (idx > -1) {
          parsed[idx].status = 'Approved';
          localStorage.setItem('fitpulse_slips', JSON.stringify(parsed));
        }
      }

      setProcessingPayHere(false);
      loadMemberData(gymId, memberId);

      toast({
        title: 'PayHere Payment Completed!',
        description: 'Growth membership fee LKR 4,500.00 processed successfully.',
        type: 'success',
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 1500);
  };

  // Slip receipt upload
  const handleSlipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId || !memberId) return;

    if (!slipFileName) {
      toast({
        title: 'File Name Required',
        description: 'Please input the receipt image name.',
        type: 'error',
      });
      return;
    }

    addPaymentSlip({
      tenantType: 'MEMBER',
      referenceId: memberId,
      amount: 4500,
      bankName: selectedBank,
      slipImage: slipFileName,
    });

    setSlipFileName('');
    loadMemberData(gymId, memberId);

    toast({
      title: getTranslation(lang, 'uploadSuccess'),
      description: 'Your trainer will review and verify your receipt slip.',
      type: 'success',
    });
  };

  const handleLogout = () => {
    toast({ title: 'Logged Out', description: 'Session ended.', type: 'info' });
    router.push('/login');
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'si' : 'en'));
  };

  const handleUpdatePrivacySettings = (key: 'showPhoneNumber' | 'showRegistrationId' | 'isProfilePrivate', val: boolean) => {
    if (!memberId) return;
    updateUserProfile(memberId, { [key]: val });
    if (key === 'showPhoneNumber') setShowPhoneNumber(val);
    if (key === 'showRegistrationId') setShowRegistrationId(val);
    if (key === 'isProfilePrivate') setIsProfilePrivate(val);
    toast({
      title: 'Settings Saved',
      description: 'Privacy switch updated successfully.',
      type: 'success',
    });
  };

  const handleSaveBioAndAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;
    updateUserProfile(memberId, { bio, avatarUrl });
    toast({
      title: 'Profile Updated',
      description: 'Your bio and avatar have been saved.',
      type: 'success',
    });
  };

  const handleUploadPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !member) return;
    if (!photoUrlInput.trim()) {
      toast({ title: 'Input Required', description: 'Please enter a valid photo URL.', type: 'error' });
      return;
    }
    const currentPhotos = member.photos || [];
    const updatedPhotos = [...currentPhotos, photoUrlInput.trim()];
    updateUserProfile(memberId, { photos: updatedPhotos });
    setPhotoUrlInput('');
    loadMemberData(gymId || '', memberId);
    toast({
      title: 'Photo Uploaded!',
      description: 'Added to your transformation gallery.',
      type: 'success',
    });
  };

  if (!gym || !member) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Diet options based on goal
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

  // Sri Lankan banks details
  const localBanks = [
    { bank: 'Commercial Bank', acc: '1002003004', branch: 'Colombo 07' },
    { bank: 'Sampath Bank', acc: '9008007006', branch: 'Kandy Main' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center relative overflow-x-hidden pb-24">
      {/* Background blur */}
      <div className="absolute top-0 w-full h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Mobile view wrap */}
      <div className="w-full max-w-md flex flex-col flex-1 px-4 pt-6">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Dumbbell className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-tight">
                {getTranslation(lang, 'appName')}
              </h1>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold uppercase tracking-wider">
                <MapPin className="h-3 w-3 text-emerald-400 shrink-0" /> {gym.gymName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* EN | සිං language switcher button */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-300 hover:text-emerald-400 font-black text-[10px] rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{lang === 'en' ? 'සිං' : 'EN'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-300 z-10">
            {/* Welcome */}
            <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-xl">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                  {getTranslation(lang, 'welcome')}
                </p>
                <h3 className="text-xl font-black text-white mt-0.5">{member.name}</h3>
                <p className="text-xs text-emerald-400 font-mono mt-1 uppercase tracking-wider">{gym.id}</p>
              </div>

              {/* Flame streak */}
              <div className="flex flex-col items-center p-2.5 bg-slate-950 border border-slate-850 rounded-2xl shadow-inner shrink-0">
                <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
                <span className="text-base font-black text-white font-mono mt-0.5">{member.streak || 0}</span>
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider">
                  {getTranslation(lang, 'streak')}
                </span>
              </div>
            </div>

            {/* Check-in Trigger */}
            <Card className="border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] bg-slate-900/20" glow>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {getTranslation(lang, 'logCheckin')}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
                    {getTranslation(lang, 'dailyCheckinDesc')}
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
                      {getTranslation(lang, 'logCheckin')} <Sparkles className="h-4 w-4" />
                    </>
                  )}
                </button>
              </CardContent>
            </Card>

            {/* Body Metrics Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">
                  {getTranslation(lang, 'personalStats')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center">
                  <Ruler className="h-4 w-4 text-emerald-500 mb-1" />
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">
                    {getTranslation(lang, 'height')}
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 font-mono">{member.height || 175} cm</span>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center">
                  <Scale className="h-4 w-4 text-emerald-500 mb-1" />
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">
                    {getTranslation(lang, 'weight')}
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 font-mono">{member.weight || 75} kg</span>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center">
                  <Target className="h-4 w-4 text-emerald-500 mb-1" />
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">
                    {getTranslation(lang, 'targetWeight')}
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 font-mono">{member.targetWeight || 70} kg</span>
                </div>
              </CardContent>
            </Card>

            {/* Primary Target Goal */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-bold">
                  {getTranslation(lang, 'primaryGoal')}
                </CardTitle>
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
                    {lang === 'en' 
                      ? getTranslation(lang, activeGoal === 'weight-loss' ? 'weightLoss' : activeGoal === 'muscle-building' ? 'muscleBuilding' : activeGoal === 'athletic-fitness' ? 'athleticFitness' : 'generalHealth')
                      : getTranslation(lang, activeGoal === 'weight-loss' ? 'weightLoss' : activeGoal === 'muscle-building' ? 'muscleBuilding' : activeGoal === 'athletic-fitness' ? 'athleticFitness' : 'generalHealth')
                    }
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Your trainer is tailoring workouts to match this objective.
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-650" />
              </CardContent>
            </Card>

            {/* Top Gym Champions Widget */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Award className="h-4.5 w-4.5 text-emerald-400" />
                  <span>Top Gym Champions</span>
                </CardTitle>
                <CardDescription className="text-[10px]">Top members ranked by current streaks & lifter volume.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {(gymId ? getMembers(gymId) : [])
                  .sort((a, b) => {
                    if ((b.streak || 0) !== (a.streak || 0)) {
                      return (b.streak || 0) - (a.streak || 0);
                    }
                    return (b.totalVolumeLifted || 0) - (a.totalVolumeLifted || 0);
                  })
                  .slice(0, 3)
                  .map((champ, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                    const borderHighlight = index === 0 ? 'border-amber-500/30' : index === 1 ? 'border-slate-500/20' : 'border-amber-700/20';
                    return (
                      <div 
                        key={champ.id} 
                        className={`p-3 bg-slate-950/60 border rounded-xl flex justify-between items-center gap-2 ${borderHighlight}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{medal}</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={champ.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(champ.name)}`} 
                            alt="avatar" 
                            className="h-8.5 w-8.5 rounded-full border border-slate-800"
                          />
                          <div>
                            <p className="font-bold text-xs text-white leading-tight">{champ.name}</p>
                            <p className="text-[9px] text-slate-550 mt-0.5 font-mono">
                              🔥 {champ.streak || 0} Days • 🏋️‍♂️ {(champ.totalVolumeLifted || 0).toLocaleString()} kg
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => router.push(`/profile/${champ.id}?gym_id=${gym.id}`)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[9px] font-bold uppercase rounded-lg text-slate-350 hover:text-white transition-all cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: WORKOUT PLAN */}
        {activeTab === 'workout' && (
          <div className="space-y-6 animate-in fade-in duration-300 z-10">
            <h2 className="text-base font-black text-white flex items-center gap-1.5 px-1">
              <ClipboardList className="h-4.5 w-4.5 text-emerald-400" /> {getTranslation(lang, 'todaysWorkout')}
            </h2>

            {!workoutPlan ? (
              <div className="p-8 border border-dashed border-slate-850 rounded-3xl text-center bg-slate-900/10">
                <Dumbbell className="h-10 w-10 text-slate-700 mb-3 mx-auto animate-pulse" />
                <h3 className="text-sm font-bold text-slate-400">{getTranslation(lang, 'noWorkout')}</h3>
                <p className="text-xs text-slate-505 mt-1 max-w-[200px] mx-auto">
                  {getTranslation(lang, 'noWorkoutDesc')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Card glow>
                  <CardHeader className="pb-3 border-b border-slate-950">
                    <CardTitle className="text-sm">{getTranslation(lang, 'todaysWorkout')}</CardTitle>
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
                      <CalendarDays className="h-4.5 w-4.5 text-emerald-400" /> {getTranslation(lang, 'attLedger')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendance.length === 0 ? (
                      <p className="text-xs text-slate-505 text-center py-4">{getTranslation(lang, 'noAtt')}</p>
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

        {/* TAB 3: DIET */}
        {activeTab === 'diet' && (
          <div className="space-y-6 animate-in fade-in duration-300 z-10">
            <h2 className="text-base font-black text-white flex items-center gap-1.5 px-1">
              <Utensils className="h-4.5 w-4.5 text-emerald-400" /> {getTranslation(lang, 'nutritionGuide')}
            </h2>

            <Card glow>
              <CardHeader className="pb-3 border-b border-slate-950">
                <CardTitle className="text-sm">{getTranslation(lang, 'goalDietSchedule')}</CardTitle>
                <CardDescription className="text-xs">
                  Meal schedules matching target goal: <span className="text-emerald-400 font-bold uppercase">{activeGoal.replace('-', ' ')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {dietPlanList.map((meal, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl text-xs">
                    <p className="font-bold text-white mb-1">{getTranslation(lang, 'mealsOption')} {idx + 1}</p>
                    <p className="text-slate-400 leading-relaxed">{meal}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: PAYMENTS AND BANK RECEIPTS */}
        {activeTab === 'payment' && (
          <div className="space-y-6 animate-in fade-in duration-300 z-10 pb-6">
            <h2 className="text-base font-black text-white flex items-center gap-1.5 px-1">
              <CreditCard className="h-4.5 w-4.5 text-emerald-400" /> {getTranslation(lang, 'payment')}
            </h2>

            <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-900">
              <button
                onClick={() => setPaymentMethod('payhere')}
                className={`flex-1 py-2 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  paymentMethod === 'payhere'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                PayHere Gateway
              </button>
              <button
                onClick={() => setPaymentMethod('bank')}
                className={`flex-1 py-2 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  paymentMethod === 'bank'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-500 hover:text-slate-355'
                }`}
              >
                Bank Transfer
              </button>
            </div>

            {/* PayHere Checkout Option */}
            {paymentMethod === 'payhere' && (
              <Card glow>
                <CardHeader>
                  <CardTitle className="text-sm">{getTranslation(lang, 'payhereCheckout')}</CardTitle>
                  <CardDescription className="text-xs">
                    {getTranslation(lang, 'payhereDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fee Amount</span>
                    <p className="text-2xl font-mono font-black text-emerald-450 mt-1">LKR 4,500.00</p>
                    <p className="text-[9px] text-slate-550 mt-0.5">SaaS Growth Tier Member License</p>
                  </div>

                  <button
                    onClick={handlePayHereCheckout}
                    disabled={processingPayHere}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {processingPayHere ? (
                      <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Proceed to PayHere <Sparkles className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Bank Transfer Receipt upload */}
            {paymentMethod === 'bank' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{getTranslation(lang, 'bankDetails')}</CardTitle>
                  <CardDescription className="text-xs">
                    Transfer fees manually to the gym bank account and upload your slip receipt.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bank info list */}
                  <div className="space-y-2.5 font-mono text-[11px] text-slate-400">
                    {localBanks.map((b, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-900">
                        <p className="font-bold text-white">{b.bank}</p>
                        <p className="text-slate-350 mt-0.5">Acc: {b.acc}</p>
                        <p className="text-[9px] text-slate-550">Branch: {b.branch}</p>
                      </div>
                    ))}
                  </div>

                  {/* Slip upload Form */}
                  <form onSubmit={handleSlipSubmit} className="space-y-4 pt-2 border-t border-slate-900">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        {getTranslation(lang, 'selectBank')}
                      </label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                      >
                        <option value="Commercial Bank">Commercial Bank</option>
                        <option value="Sampath Bank">Sampath Bank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        {getTranslation(lang, 'slipUpload')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. transfer_receipt_jul.jpg"
                          value={slipFileName}
                          onChange={(e) => setSlipFileName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none"
                        />
                        <Upload className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="h-4 w-4" /> {getTranslation(lang, 'submitReceipt')}
                    </button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Payment history list */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{getTranslation(lang, 'payingStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                {memberSlips.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No slip logs or checkouts processed yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {memberSlips.map((slip) => (
                      <div key={slip.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{slip.bankName}</p>
                          <p className="text-[9px] text-slate-550 font-mono mt-0.5">{slip.slipImage} • LKR {slip.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          {slip.status === 'Approved' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-md">
                              {getTranslation(lang, 'approved')}
                            </span>
                          )}
                          {slip.status === 'Pending' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-450 rounded-md">
                              {getTranslation(lang, 'pendingVerification')}
                            </span>
                          )}
                          {slip.status === 'Rejected' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-md">
                              {getTranslation(lang, 'rejected')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 5: PROFILE & PRIVACY SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-300 z-10 w-full">
            {/* Bio & Avatar Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <User className="h-4.5 w-4.5 text-emerald-400" /> Bio & Profile Avatar
                </CardTitle>
                <CardDescription className="text-[10px]">Customize how other members see your profile.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveBioAndAvatar} className="space-y-4">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Short Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. FitPulse lifter, focusing on consistency and powerlifting."
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Avatar seed parameter (Dicebear seed)
                    </label>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Save Biography
                  </button>
                </form>
              </CardContent>
            </Card>

            {/* Privacy Toggles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Lock className="h-4.5 w-4.5 text-emerald-400" /> Member Privacy Controls
                </CardTitle>
                <CardDescription className="text-[10px]">Manage who can see your telephone and registration ID.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-900">
                  <div>
                    <p className="text-xs font-bold text-white">Private Profile Mode</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Hides transformation photos & stats from other gym members.</p>
                  </div>
                  <button onClick={() => handleUpdatePrivacySettings('isProfilePrivate', !isProfilePrivate)} className="cursor-pointer">
                    {isProfilePrivate ? (
                      <ToggleRight className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-650" />
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-900">
                  <div>
                    <p className="text-xs font-bold text-white">Display Phone Number</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Toggles phone visibility on your public profile page.</p>
                  </div>
                  <button onClick={() => handleUpdatePrivacySettings('showPhoneNumber', !showPhoneNumber)} className="cursor-pointer">
                    {showPhoneNumber ? (
                      <ToggleRight className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-650" />
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-xs font-bold text-white">Display Registration ID</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Toggles membership number (e.g. MBR-101) visibility.</p>
                  </div>
                  <button onClick={() => handleUpdatePrivacySettings('showRegistrationId', !showRegistrationId)} className="cursor-pointer">
                    {showRegistrationId ? (
                      <ToggleRight className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-650" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Transformation photo gallery uploader */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Camera className="h-4.5 w-4.5 text-emerald-400" /> Add Transformation Photo
                </CardTitle>
                <CardDescription className="text-[10px]">Add workout progress selfies to your transformation grid.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUploadPhoto} className="space-y-4">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Photo Image URL
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. https://images.unsplash.com/photo-1517838277536-f5f99be501cd"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="h-4 w-4" /> Upload Transformation Selfie
                  </button>
                </form>

                {/* Preconfigured helper links for testing */}
                <div className="mt-4 pt-3 border-t border-slate-900 text-left">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Quick Sample Photos (Tap to select)</span>
                  <div className="flex flex-col gap-1.5 text-[9px]">
                    <button 
                      onClick={() => setPhotoUrlInput('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop')}
                      className="text-emerald-400 hover:underline text-left"
                      type="button"
                    >
                      🔗 Squat/Strength Training progress photo
                    </button>
                    <button 
                      onClick={() => setPhotoUrlInput('https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=300&auto=format&fit=crop')}
                      className="text-emerald-400 hover:underline text-left"
                      type="button"
                    >
                      🔗 Cardio/HIIT progress photo
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dynamic bottom bar */}
        <nav className="fixed bottom-0 inset-x-0 bg-slate-950/80 border-t border-slate-900 py-3 px-4 flex justify-between items-center backdrop-blur-md z-30">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wide transition-colors cursor-pointer ${
              activeTab === 'home' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity className="h-5 w-5" />
            {getTranslation(lang, 'home')}
          </button>
          
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wide transition-colors cursor-pointer ${
              activeTab === 'workout' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Dumbbell className="h-5 w-5" />
            {getTranslation(lang, 'workout')}
          </button>

          <button
            onClick={() => setActiveTab('diet')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wide transition-colors cursor-pointer ${
              activeTab === 'diet' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Utensils className="h-5 w-5" />
            {getTranslation(lang, 'diet')}
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wide transition-colors cursor-pointer ${
              activeTab === 'payment' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <CreditCard className="h-5 w-5" />
            {getTranslation(lang, 'payment')}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wide transition-colors cursor-pointer ${
              activeTab === 'settings' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Settings className="h-5 w-5" />
            Settings
          </button>
        </nav>

      </div>
    </div>
  );
}

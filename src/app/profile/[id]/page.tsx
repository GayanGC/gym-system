'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  Dumbbell, 
  Flame, 
  Award, 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Phone, 
  User, 
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  ImageIcon,
  Grid
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { 
  getGym, 
  getUser, 
  getMemberAttendance,
  getWhatsAppSettings,
  Gym, 
  User as UserType 
} from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const userId = params.id as string;
  const gymIdQuery = searchParams.get('gym_id');

  const [gym, setGym] = useState<Gym | null>(null);
  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const user = getUser(userId);
    if (!user) {
      toast({
        title: 'Profile Not Found',
        description: 'No registered member found under this ID.',
        type: 'error',
      });
      router.push('/login');
      return;
    }

    setProfileUser(user);
    
    // Load gym details if possible
    if (user.gymId) {
      setGym(getGym(user.gymId));
      setAttendanceCount(getMemberAttendance(user.gymId, user.id).length);
    } else if (gymIdQuery) {
      setGym(getGym(gymIdQuery));
    }
  }, [userId, gymIdQuery, router, toast]);

  const handleBack = () => {
    if (gymIdQuery) {
      // Check if we came from member app or owner dashboard
      // We can inspect active path or route query parameters
      // If we have a gymIdQuery we can route back to dashboard or member based on search params
      const isMember = searchParams.get('viewer') === 'member' || searchParams.get('member_id');
      const viewerId = searchParams.get('member_id');
      if (isMember && viewerId) {
        router.push(`/member?gym_id=${gymIdQuery}&member_id=${viewerId}`);
      } else {
        router.push(`/dashboard?gym_id=${gymIdQuery}`);
      }
    } else {
      router.back();
    }
  };

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPrivate = !!profileUser.isProfilePrivate;
  
  // Mask helper
  const maskPhone = (phoneStr: string) => {
    if (!phoneStr) return 'Private';
    if (phoneStr.length <= 4) return 'Private';
    return `${phoneStr.slice(0, 4)}* *** ****`;
  };

  const maskRegId = (regId: string) => {
    return `${regId.slice(0, 4)}***`;
  };

  // Generate badges based on activity
  const badges: { name: string; icon: React.ReactNode; color: string; desc: string }[] = [];
  if ((profileUser.streak || 0) >= 10) {
    badges.push({ name: 'Streak Master', icon: <Flame className="h-4 w-4" />, color: 'from-orange-500 to-amber-500', desc: '10+ Days Streak' });
  }
  if ((profileUser.totalVolumeLifted || 0) >= 15000) {
    badges.push({ name: 'Iron Warrior', icon: <Dumbbell className="h-4 w-4" />, color: 'from-emerald-500 to-teal-500', desc: '15,000+ kg Lifted' });
  }
  if (attendanceCount >= 5) {
    badges.push({ name: 'Gym Regular', icon: <Award className="h-4 w-4" />, color: 'from-indigo-500 to-violet-500', desc: '5+ Attendances' });
  }
  if (badges.length === 0) {
    badges.push({ name: 'Fitness Novice', icon: <Sparkles className="h-4 w-4" />, color: 'from-slate-650 to-slate-500', desc: 'Welcome on board!' });
  }

  const coverUrl = profileUser.coverUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop';
  const avatarUrl = profileUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profileUser.name)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16 relative overflow-x-hidden font-sans">
      
      {/* Background neon blurs */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Cover Photo */}
      <div 
        className="h-48 md:h-64 w-full bg-cover bg-center relative border-b border-slate-900"
        style={{ backgroundImage: `url('${coverUrl}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
        
        {/* Floating Back Button */}
        <button 
          onClick={handleBack}
          className="absolute left-6 top-6 h-10 w-10 rounded-full bg-slate-950/80 border border-slate-850 flex items-center justify-center text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer hover:scale-105"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Profile Header Wrapper */}
      <div className="max-w-4xl w-full mx-auto px-6 -mt-16 relative z-10 flex flex-col gap-6">
        
        {/* Basic Header Details Card */}
        <div className="p-6 bg-slate-900/60 border border-slate-900 rounded-3xl backdrop-blur-2xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 shadow-xl">
          
          {/* Avatar Container */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={avatarUrl} 
            alt={profileUser.name} 
            className="h-28 w-28 rounded-full border-4 border-slate-950 bg-slate-900 shadow-xl"
          />

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">{profileUser.name}</h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {gym ? gym.gymName : 'FitPulse AI Member'}
                </p>
              </div>

              {/* Flame streak */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3.5 py-1.5 rounded-2xl w-fit mx-auto sm:mx-0 shadow-inner">
                <Flame className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
                <span className="text-xs font-black text-white font-mono">{profileUser.streak || 0} Day Streak</span>
              </div>
            </div>

            <p className="text-xs text-slate-350 max-w-lg leading-relaxed pt-1.5 border-t border-slate-950/40">
              {profileUser.bio || "No biography provided by the member."}
            </p>
          </div>
        </div>

        {/* Two Column details layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Stats overview (7 columns) */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Stats Overview Panel */}
            <Card glow={!isPrivate}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Fitness Stats & Volume</span>
                  {isPrivate && <Lock className="h-4 w-4 text-rose-455" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPrivate ? (
                  <div className="p-8 text-center bg-slate-950/40 border border-slate-900 rounded-2xl space-y-3">
                    <div className="h-10 w-10 mx-auto rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Profile is Private</p>
                      <p className="text-[10px] text-slate-550 mt-1 max-w-xs mx-auto">
                        This member has toggled Private Profile mode. Fitness logs and statistics are hidden.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center">
                      <Calendar className="h-4 w-4 text-emerald-400 mb-1.5" />
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Attendances</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5">{attendanceCount} logs</span>
                    </div>

                    <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center">
                      <Layers className="h-4 w-4 text-emerald-400 mb-1.5" />
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Total Volume</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5">{(profileUser.totalVolumeLifted || 0).toLocaleString()} kg</span>
                    </div>

                    <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center">
                      <Award className="h-4 w-4 text-emerald-400 mb-1.5" />
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Badges</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5">{badges.length} unlocked</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Photo / Transformation Gallery Grid */}
            <Card glow={!isPrivate && (profileUser.photos || []).length > 0}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Transformation Progress Gallery</span>
                  {isPrivate && <Lock className="h-4 w-4 text-rose-455" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPrivate ? (
                  <div className="p-8 text-center bg-slate-950/40 border border-slate-900 rounded-2xl space-y-3">
                    <div className="h-10 w-10 mx-auto rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Gallery Restricted</p>
                      <p className="text-[10px] text-slate-550 mt-1 max-w-xs mx-auto">
                        Progress photos and selfies are locked by the member's privacy choices.
                      </p>
                    </div>
                  </div>
                ) : !profileUser.photos || profileUser.photos.length === 0 ? (
                  <div className="h-32 flex flex-col justify-center items-center text-center p-4 border border-dashed border-slate-900 rounded-2xl text-slate-500 text-xs">
                    <ImageIcon className="h-6 w-6 text-slate-800 mb-2" />
                    <span>No transformation progress photos uploaded yet.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {profileUser.photos.map((photoUrl, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-900 bg-slate-950 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={photoUrl} 
                          alt={`Transformation Progress ${idx + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/20 hover:bg-slate-950/0 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Badges & Profile settings (5 columns) */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Contact details & Privacy Check Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Registry Verification Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                
                {/* Registration ID */}
                <div className="flex justify-between items-center py-2.5 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-400" />
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Registration ID</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {profileUser.showRegistrationId ? (
                      profileUser.id
                    ) : (
                      <span className="text-slate-500 italic flex items-center gap-1">
                        <EyeOff className="h-3 w-3" /> {maskRegId(profileUser.id)}
                      </span>
                    )}
                  </span>
                </div>

                {/* Telephone */}
                <div className="flex justify-between items-center py-2.5">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Phone Number</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {profileUser.showPhoneNumber ? (
                      profileUser.phone || 'N/A'
                    ) : (
                      <span className="text-slate-500 italic flex items-center gap-1">
                        <EyeOff className="h-3 w-3" /> {maskPhone(profileUser.phone || '')}
                      </span>
                    )}
                  </span>
                </div>

              </CardContent>
            </Card>

            {/* Badges card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Award className="h-4.5 w-4.5 text-emerald-400" /> Unlocked Badges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {badges.map((badge, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-2xl flex items-center gap-3.5 shadow-inner"
                  >
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-slate-950 shadow-md`}>
                      {badge.icon}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white leading-tight">{badge.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>

        </div>

      </div>

    </div>
  );
}

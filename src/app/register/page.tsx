'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { saveGym, Gym } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    gymName: '',
    ownerName: '',
    email: '',
    phone: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gymName || !formData.ownerName || !formData.email || !formData.phone || !formData.location) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all the fields.',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    // Simulate database create delay
    setTimeout(() => {
      const generatedId = `GYM-${Math.floor(1000 + Math.random() * 9000)}`;
      const newGym: Gym = {
        id: generatedId,
        gymName: formData.gymName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        subscriptionStatus: 'Trial',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      saveGym(newGym);

      toast({
        title: 'Registration Successful!',
        description: `Welcome to FitPulse AI, ${formData.gymName}! Free trial activated.`,
        type: 'success',
      });

      router.push(`/dashboard?gym_id=${generatedId}`);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Logo */}
        <div className="flex justify-center items-center gap-2.5 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
            <Dumbbell className="h-6 w-6 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-tight">
            FitPulse<span className="text-emerald-400">.AI</span>
          </span>
        </div>
        
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          SaaS Management Platform
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          Scale your fitness business, manage trainers, and onboarding members with ease.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative" glow>
          {/* Visual Free Trial Badge */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/20">
            <Sparkles className="h-3.5 w-3.5 animate-spin duration-1000" />
            1-Month Free Trial Auto-Activated
          </div>

          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-center text-xl text-white">Create Gym Owner Account</CardTitle>
            <CardDescription className="text-center text-slate-400">
              No credit card required. Free trial starts instantly.
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="gymName" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Gym / Fitness Center Name
                </label>
                <input
                  id="gymName"
                  name="gymName"
                  type="text"
                  required
                  placeholder="e.g. Iron Paradise Gym"
                  value={formData.gymName}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ownerName" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Owner Full Name
                  </label>
                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.ownerName}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    City / Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    placeholder="e.g. Colombo, LK"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Business Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="owner@yourgym.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Contact Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="e.g. +94 77 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300"
                />
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-xs py-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Your data is protected. By signing up, you agree to our terms.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.4)] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Activate Free Trial & Launch Dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 duration-300" />
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Trust elements / features footer */}
      <div className="mt-8 text-center text-xs text-slate-500 flex justify-center items-center gap-6">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> No Card Required</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant Setup</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% Secure</span>
      </div>
    </div>
  );
}

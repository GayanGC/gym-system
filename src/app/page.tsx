'use client';

import React from 'react';
import Link from 'next/link';
import { Dumbbell, ArrowRight, ShieldCheck, Zap, Users, BarChart3, QrCode } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Dumbbell className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">
            FitPulse<span className="text-emerald-400">.AI</span>
          </span>
        </div>

        <Link
          href="/register"
          className="px-5 py-2 border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300"
        >
          Start Free Trial
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col justify-center py-16 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Next-Gen Fitness Cloud Ecosystem
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight">
              SaaS Gym Platform <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                Driven by AI.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0">
              Automate your fitness enterprise. Onboard members instantly via counter QR codes, manage trainers, and view analytics in a high-fidelity dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_4px_25px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_35px_rgba(16,185,129,0.4)] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
              >
                Register Your Gym
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1 duration-300" />
              </Link>
              
              <Link
                href="/login"
                className="px-8 py-4 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 text-slate-200 font-bold text-sm uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer"
              >
                Sign In Portal
              </Link>
            </div>
          </div>

          {/* Hero Right / Feature Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            <Card className="hover:border-emerald-500/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 text-emerald-400 shrink-0">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Counter Onboarding Poster</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    Print custom QR posters for your check-in counter to let members onboard instantly on mobile.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:border-emerald-500/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 text-emerald-400 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Trainer Allocation Module</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    Assign gym trainers, specify specializations, and keep track of employee phone directories.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:border-emerald-500/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 text-emerald-400 shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Automatic Registration Tracking</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    Synchronize member profiles and body goals in localStorage to simulate database records.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 z-10 shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            FitPulse AI SaaS Platform • Built with Next.js 15 & Tailwind CSS
          </span>
          <div className="flex gap-4">
            <span>Security</span>
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

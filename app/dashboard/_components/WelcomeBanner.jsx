"use client";

import React from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/clerk-react';

function WelcomeBanner() {
  const { user } = useUser();

  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'Learner';

  return (
    <div className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 w-full text-white rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="text-center sm:text-left z-10 max-w-xl">
        <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full mb-3 backdrop-blur-xs">
          Welcome back
        </span>
        <h2 className="font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-tight leading-snug">
          Hello, {firstName}! 👋
        </h2>
        <p className="text-blue-100 text-sm sm:text-base mt-2 leading-relaxed">
          Ready to supercharge your study session? Review your generated courses, practice flashcards, or take a quiz.
        </p>
      </div>

      <div className="shrink-0 z-10 hidden sm:block">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md">
          <Image src="/laptop.png" alt="Study session" width={112} height={112} className="object-contain" priority />
        </div>
      </div>
    </div>
  );
}

export default WelcomeBanner;

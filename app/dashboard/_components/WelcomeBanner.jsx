"use client";

import React from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/clerk-react';

function WelcomeBanner() {
  const { user } = useUser();

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-blue-500 w-full text-white rounded-lg flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
      <div className="flex-shrink-0">
        <Image src="/laptop.png" alt="laptop" width={100} height={100} />
      </div>

      <div className="text-center sm:text-left">
        <h2 className="font-bold text-2xl sm:text-3xl">
          Hello, {user?.fullName}
        </h2>
        <p className="text-sm sm:text-base">
          Welcome, it's time to get back and start learning!
        </p>
      </div>
    </div>
  );
}

export default WelcomeBanner;

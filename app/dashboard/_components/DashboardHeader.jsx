"use client";

import React, { useEffect, useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import { cn } from "../../../lib/utils";
import Image from "next/image";
import { Bell, Search, ArrowLeft, User } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

function DashboardHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const isOnCoursePage = pathname?.startsWith('/courses/') && pathname !== '/courses';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <header
      className={cn(
        "w-full top-0 z-40 sticky transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-sm border-b py-3"
          : "bg-transparent py-4"
      )}
    >
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between max-w-[1600px] mx-auto">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          {/* Back to Dashboard button when on course page */}
          {isOnCoursePage && (
            <Button 
              onClick={handleBackToDashboard}
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2 hover:bg-gray-100 mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          )}
          
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-lg"></div>
              <div className="absolute inset-[2px] bg-white rounded-md flex items-center justify-center">
                <div className=" font-bold text-xl">
                  <Image src={'/logo.svg'} alt="logo" height={40} width={40} className="lg:hidden"/>
                </div>
              </div>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:inline lg:hidden">
              IntelliPrep
            </span>
          </Link>
        </div>

        {/* Search Bar - Hidden on Mobile */}
        

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Profile Link */}
          <Link href="/profile">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2 hover:bg-gray-100"
            >
              <User className="w-4 h-4" />
              Profile
            </Button>
          </Link>
          
          <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>
          
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
            userProfileMode="navigation"
            userProfileUrl="/profile"
          />
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
"use client";

import React, { useEffect, useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import { cn } from "../../../lib/utils";
import Image from "next/image";
import { Bell, Search, ArrowLeft, User, Menu } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

function DashboardHeader({ onOpenMobileMenu }) {
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
        "w-full top-0 z-30 sticky transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b shadow-xs py-3"
          : "bg-white/70 backdrop-blur-xs border-b border-gray-100 py-3.5"
      )}
    >
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between max-w-[1600px] mx-auto">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger button */}
          {onOpenMobileMenu && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMobileMenu}
              className="md:hidden h-9 w-9 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Back to Dashboard button when on course page */}
          {isOnCoursePage && (
            <Button 
              onClick={handleBackToDashboard}
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2 hover:bg-gray-100 mr-1 text-xs sm:text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          )}
          
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 transition-opacity hover:opacity-90",
              onOpenMobileMenu ? "md:hidden" : "flex"
            )}
          >
            <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
              <Image src={'/logo.svg'} alt="IntelliPrep logo" height={36} width={36} priority />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
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
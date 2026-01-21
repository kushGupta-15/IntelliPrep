"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "../../lib/utils";


const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-blue-600 rounded-lg"></div>
            <div className="absolute inset-[2px] bg-white rounded-md flex items-center justify-center">
              <div className="text-blue-600 font-bold text-xl">I</div>
            </div>
          </div>
          <span className="text-xl font-bold text-primary">IntelliPrep</span>
        </Link>

        <Link
          href="/dashboard"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors font-medium"
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
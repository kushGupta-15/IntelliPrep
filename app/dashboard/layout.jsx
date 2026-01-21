"use client";

import React, { useState } from 'react';
import { CourseCountContext } from "../_context/CourseCountContext";
import DashboardHeader from './_components/DashboardHeader';
import Sidebar from './_components/Sidebar';
import { Menu } from 'lucide-react';

function DashboardLayout({ children }) {
  const [totalCourses, setTotalCourses] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <CourseCountContext.Provider value={{ totalCourses, setTotalCourses }}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar
          isMobileMenuOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
        />

        <div className="flex-1 w-full">
          {/* Header for small and medium devices */}
          <div className="md:flex p-4 border-b items-center justify-between lg:hidden">
            <button onClick={() => setShowSidebar(true)}>
              <Menu />
            </button>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block">
            <DashboardHeader />
          </div>

          {/* Page Content */}
          <div className="p-4 md:p-10">{children}</div>
        </div>
      </div>
    </CourseCountContext.Provider>
  );
}

export default DashboardLayout;

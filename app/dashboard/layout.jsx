"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { CourseCountContext } from "../_context/CourseCountContext";
import DashboardHeader from './_components/DashboardHeader';
import Sidebar from './_components/Sidebar';

function DashboardLayout({ children }) {
    const { user } = useUser();
    const [totalCourses, setTotalCourses] = useState(0);
    const [credits, setCredits] = useState(5);
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress) {
            fetchCredits();
        }
    }, [user]);

    const fetchCredits = async () => {
        try {
            const res = await axios.get(
                `/api/user/credits?email=${user.primaryEmailAddress.emailAddress}`
            );
            setCredits(res.data.credits ?? 5);
        } catch (e) {
            console.error("Failed to fetch credits:", e);
        }
    };

    return (
        <CourseCountContext.Provider value={{ totalCourses, setTotalCourses, credits, setCredits }}>
            <div className="flex min-h-screen bg-slate-50/60">
                <Sidebar
                    isMobileMenuOpen={showSidebar}
                    onClose={() => setShowSidebar(false)}
                />

                <div className="flex-1 flex flex-col min-w-0 w-full">
                    {/* Unified responsive header */}
                    <DashboardHeader onOpenMobileMenu={() => setShowSidebar(true)} />

                    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
                        {children}
                    </main>
                </div>
            </div>
        </CourseCountContext.Provider>
    );
}

export default DashboardLayout;

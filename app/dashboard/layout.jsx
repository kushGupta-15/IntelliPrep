"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { CourseCountContext } from "../_context/CourseCountContext";
import DashboardHeader from './_components/DashboardHeader';
import Sidebar from './_components/Sidebar';
import { Menu } from 'lucide-react';

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
            <div className="flex min-h-screen">
                <Sidebar
                    isMobileMenuOpen={showSidebar}
                    onClose={() => setShowSidebar(false)}
                />

                <div className="flex-1 w-full">
                    {/* Mobile header */}
                    <div className="md:flex p-4 border-b items-center justify-between lg:hidden">
                        <button onClick={() => setShowSidebar(true)}>
                            <Menu />
                        </button>
                        <h1 className="text-lg font-semibold">Dashboard</h1>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden lg:block">
                        <DashboardHeader />
                    </div>

                    <div className="p-4 md:p-10">{children}</div>
                </div>
            </div>
        </CourseCountContext.Provider>
    );
}

export default DashboardLayout;

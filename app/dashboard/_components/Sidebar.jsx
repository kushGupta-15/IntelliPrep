"use client";

import { LayoutDashboard, UserCircle, Zap, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { CourseCountContext } from "../../_context/CourseCountContext";

function Sidebar({ isMobileMenuOpen, onClose }) {
    const { totalCourses, credits } = useContext(CourseCountContext);
    const path = usePathname();

    const menuList = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Profile',   icon: UserCircle,      path: '/profile'   },
    ];

    // credits used = courses created (each course costs 1 credit)
    const creditsUsed = totalCourses;
    const creditsRemaining = Math.max(0, credits - creditsUsed);
    const usagePercent = credits > 0 ? Math.min(100, (creditsUsed / credits) * 100) : 100;

    return (
        <>
            <aside
                aria-label="Application sidebar"
                className={`
                    fixed z-50 md:z-20 md:static
                    top-0 bottom-0 left-0
                    h-screen w-64 bg-white border-r shadow-xs transition-transform duration-300 ease-in-out shrink-0
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0
                `}
            >
                <div className="flex flex-col justify-between h-full p-5 overflow-y-auto">
                    {/* Top */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2.5">
                                <Image src="/logo.svg" alt="IntelliPrep Logo" width={36} height={36} priority />
                                <h2 className="font-extrabold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    IntelliPrep
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                aria-label="Close sidebar menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <Button className="w-full mb-5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs" asChild>
                            <Link href="/create" onClick={onClose}>
                                + Create New Course
                            </Link>
                        </Button>

                        <nav className="space-y-1.5" aria-label="Main Navigation">
                            {menuList.map((menu, index) => {
                                const isActive = path === menu.path;
                                const Icon = menu.icon;
                                return (
                                    <Link
                                        key={index}
                                        href={menu.path}
                                        onClick={onClose}
                                        className={`
                                            flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium
                                            transition-all duration-150 min-h-[44px]
                                            ${isActive
                                                ? 'bg-blue-50 text-blue-700 shadow-2xs font-semibold'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                                        <span>{menu.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Credits panel */}
                    <div className="border p-3 bg-slate-100 rounded-lg mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold text-gray-700">Credits</h2>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                creditsRemaining === 0
                                    ? 'bg-red-100 text-red-600'
                                    : creditsRemaining <= 2
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-green-100 text-green-600'
                            }`}>
                                {creditsRemaining} left
                            </span>
                        </div>

                        <Progress value={usagePercent} className="h-2" />

                        <p className="text-xs text-gray-500 mt-1">
                            {creditsUsed} of {credits} credits used
                        </p>

                        <Link href="/dashboard/upgrade" onClick={onClose}>
                            <Button
                                size="sm"
                                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                            >
                                <Zap className="w-3 h-3" />
                                Buy More Credits
                            </Button>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}
        </>
    );
}

export default Sidebar;

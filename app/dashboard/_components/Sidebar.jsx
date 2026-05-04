"use client";

import { LayoutDashboard, UserCircle, Zap } from 'lucide-react';
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
            <div
                className={`
                    fixed z-50 md:z-auto md:static
                    inset-0 md:inset-auto
                    h-full w-64 bg-white shadow-md transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0
                `}
            >
                <div className="grid grid-rows-[1fr_auto] h-full p-5">
                    {/* Top */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <Image src="/logo.svg" alt="logo" width={40} height={40} />
                            <h2 className="font-bold text-2xl">IntelliPrep</h2>
                        </div>

                        <Button className="w-full mb-4" asChild>
                            <Link href="/create" onClick={onClose}>
                                + Create New
                            </Link>
                        </Button>

                        <div>
                            {menuList.map((menu, index) => (
                                <Link
                                    key={index}
                                    href={menu.path}
                                    onClick={onClose}
                                    className={`
                                        flex items-center gap-5 p-3 mt-3 rounded-lg
                                        hover:bg-slate-200
                                        ${path === menu.path ? 'bg-slate-200' : ''}
                                    `}
                                >
                                    <menu.icon />
                                    <h2>{menu.name}</h2>
                                </Link>
                            ))}
                        </div>
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
            </div>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}
        </>
    );
}

export default Sidebar;

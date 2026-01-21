"use client";

import { LayoutDashboard, UserCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { CourseCountContext } from "../../_context/CourseCountContext";

function Sidebar({ isMobileMenuOpen, onClose }) {
  const { totalCourses } = useContext(CourseCountContext);
  const path = usePathname();

  const menuList = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      name: 'Profile',
      icon:UserCircle,
      path: '/profile'
    }
  ];

  return (
    <>
      {/* Sidebar container */}
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
          {/* Top section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Image src="/logo.svg" alt="logo" width={40} height={40} />
              <h2 className="font-bold text-2xl">IntelliPrep</h2>
            </div>

            <Button className="w-full mb-4">
              <Link href="/create" className="w-full" onClick={onClose}>
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

          {/* Bottom section – only visible on small/medium */}
          <div className="border p-3 bg-slate-100 rounded-lg mt-6 md:block lg:hidden">
            <h2 className="text-lg mb-2">Available Credits: {5 - totalCourses}</h2>
            <Progress value={(totalCourses / 5) * 100} />
            <h2 className="text-sm mt-1">{totalCourses} out of 5 credits used</h2>
            <Link
              href="/dashboard/upgrade"
              className="text-primary text-xs mt-3 block"
              onClick={onClose}
            >
              Upgrade to create more
            </Link>
          </div>
        </div>
      </div>

      {/* Overlay for mobile and medium screens */}
      {(isMobileMenuOpen) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}

export default Sidebar;

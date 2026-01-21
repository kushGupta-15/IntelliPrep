"use client";

import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { RefreshCcw } from "lucide-react";
import { useContext, useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { CourseCountContext } from "../../_context/CourseCountContext";
import { useCoursePolling } from "../../_hooks/useCoursePolling";
import CourseCard from "./CourseCard";

function CourseList() {
    const { user } = useUser();
    const [courseList,setCourseList] = useState([]);
    const [loading,setLoading] = useState(false);
    const {totalCourses,setTotalCourses} = useContext(CourseCountContext);
    const previousCourseList = useRef([]);

    const getCourseList = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            if (!user?.primaryEmailAddress?.emailAddress) {
                console.warn("User email not available yet");
                return;
            }

            const result = await axios.post("/api/courses", {
                createdBy: user.primaryEmailAddress.emailAddress,
            });

            console.log("Course List:", result.data,result);
            
            const newCourseList = result.data.result;
            if (previousCourseList.current.length > 0) {
                newCourseList.forEach(newCourse => {
                    const oldCourse = previousCourseList.current.find(c => c.courseId === newCourse.courseId);
                    if (oldCourse && oldCourse.status === "Generating" && newCourse.status === "Ready") {
                        toast.success(`Course "${newCourse.courseLayout?.course_title || newCourse.topic}" is ready!`);
                    }
                });
            }
            
            previousCourseList.current = newCourseList;
            setCourseList(newCourseList);
            setTotalCourses(newCourseList?.length);
        } catch (error) {
            console.error("Error fetching courses:", error.response?.data || error.message);
        }
        if (showLoading) setLoading(false);
    }, [user, setTotalCourses]);

    useEffect(() => {
        if (user) {
            getCourseList();
        }
    }, [user, getCourseList]);

    useEffect(() => {
        const handleFocus = () => {
            console.log("Window focused - refreshing courses...");
            getCourseList(false); 
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [getCourseList]);

    const handleCourseDeleted = (deletedCourseId) => {
        setCourseList(prevCourses => 
            prevCourses.filter(course => course.courseId !== deletedCourseId)
        );
        
        setTotalCourses(prevCount => Math.max(0, prevCount - 1));
        
        console.log("🗑️ Course removed from list:", deletedCourseId);
    };

    const isPolling = useCoursePolling(() => getCourseList(false), courseList);

    return (
        <>
        <div className="mt-10 flex justify-between">
            <h2 className="font-bold text-2xl">Your Study Material</h2>
            <div className="flex gap-2 items-center">
                {isPolling && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        Auto-refreshing...
                    </span>
                )}
                <Button onClick={() => getCourseList(true)} className="border-primary hover:bg-blue-400">
                    <RefreshCcw className={`${loading && 'animate-spin'}`}/> Refresh
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mt-5">
            { !loading ? courseList.map((course,index) => (
                    <CourseCard 
                        course={course} 
                        key={course.id || course.courseId} 
                        onCourseDeleted={handleCourseDeleted}
                    />
            )) : 
            [1,2,3,4,5,6].map((_,index)=>(
                <>
                <div className="h-56 w-full bg-slate-200 rounded-lg animate-pulse" key={index + 4}>
                </div>
                </>
            ))
            }
        </div>
        </>
    )
}

export default CourseList;

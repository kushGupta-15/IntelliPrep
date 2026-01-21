"use client";

import { useEffect, useRef } from 'react';

/**
 * Custom hook to poll for course status updates with adaptive intervals
 * @param {Function} refreshFunction - Function to call for refreshing data
 * @param {Array} courseList - Array of courses to check for generating status
 */
export function useCoursePolling(refreshFunction, courseList) {
    const intervalRef = useRef(null);

    useEffect(() => {
        const generatingCourses = courseList.filter(course => course.status === "Generating");
        
        if (generatingCourses.length > 0) {
            const now = new Date();
            const recentCourses = generatingCourses.filter(course => {
                return true;
            });

            const interval = recentCourses.length > 0 ? 5000 : 15000; 
            
            console.log(`Starting course status polling with ${interval/1000}s interval...`);
            
            intervalRef.current = setInterval(() => {
                console.log("Polling for course status updates...");
                refreshFunction();
            }, interval);
        } else {
            if (intervalRef.current) {
                console.log("Stopping course status polling - no generating courses");
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [courseList, refreshFunction]);

    return courseList.some(course => course.status === "Generating");
}
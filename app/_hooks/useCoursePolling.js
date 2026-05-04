"use client";

import { useEffect, useRef } from 'react';

/**
 * Polls for course status updates while any course is still generating.
 * Uses a stable ref for the refresh function to avoid recreating the interval
 * on every render, which would cause multiple overlapping intervals.
 */
export function useCoursePolling(refreshFunction, courseList) {
    const intervalRef = useRef(null);
    // Keep a stable ref to the latest refreshFunction so the interval
    // always calls the current version without needing to be recreated.
    const refreshRef = useRef(refreshFunction);
    refreshRef.current = refreshFunction;

    const isGenerating = courseList.some(course => course.status === "Generating");

    useEffect(() => {
        if (isGenerating) {
            // Only create a new interval if one isn't already running
            if (!intervalRef.current) {
                console.log("▶️  [Polling] Starting course status polling (5s interval)");
                intervalRef.current = setInterval(() => {
                    console.log("🔄 [Polling] Checking for course status updates...");
                    refreshRef.current();
                }, 5000);
            }
        } else {
            if (intervalRef.current) {
                console.log("⏹️  [Polling] No generating courses — stopping poll");
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
    }, [isGenerating]); // only re-run when generating state changes, not on every list update

    return isGenerating;
}

"use client";
import { createContext } from "react";

export const CourseCountContext = createContext({
    totalCourses: 0,
    setTotalCourses: () => {},
    credits: 5,
    setCredits: () => {},
});

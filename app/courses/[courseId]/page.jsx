"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios';
import CourseIntroCard from './_components/CourseIntroCard';
import StudyMaterialSection from './_components/StudyMaterialSection';
import ChapterList from './_components/ChapterList';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function Courses() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const GetCourse = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get('/api/courses?courseId=' + courseId);
            setCourse(res.data.result);
        } catch (err) {
            console.error("Error fetching course:", err);
            setError(err?.response?.data?.error || "This course does not exist or has been deleted.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            GetCourse();
        }
    }, [courseId]);

    if (error) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4'>
                <div className='p-3 bg-red-100 dark:bg-red-950/40 rounded-full text-red-600 dark:text-red-400'>
                    <AlertCircle className='h-8 w-8' />
                </div>
                <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-100'>Course Unavailable</h2>
                <p className='text-gray-600 dark:text-gray-400 max-w-md'>{error}</p>
                <Link href='/dashboard'>
                    <Button variant='outline' className='flex items-center gap-2 mt-2'>
                        <ArrowLeft className='h-4 w-4' /> Back to Dashboard
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div>
            <CourseIntroCard course={course} />
            <StudyMaterialSection courseId={courseId} course={course} />
            <ChapterList course={course} />
        </div>
    );
}

export default Courses;

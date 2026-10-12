"use client";
import React, { useEffect, useRef, useState } from 'react';
import SelectOption from './_components/SelectOption';
import { Button } from '../../components/ui/button';
import TopicInput from './_components/TopicInput';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { Loader, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

function Create() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({});
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [credits, setCredits] = useState(null);
    const [courseCreated, setCourseCreated] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);
    const [createdCourseId, setCreatedCourseId] = useState(null);
    const generateRef = useRef(false);
    const pollingIntervalRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress) {
            fetchCredits();
        }
    }, [user]);

    // Clean up polling interval on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

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

    const handleUserInput = (fieldName, fieldValue) => {
        setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));
    };

    const startStatusPolling = (courseId) => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`/api/courses/status?courseId=${courseId}`);
                const data = res.data;

                if (data.progressPercentage) {
                    setProgressPercent(data.progressPercentage);
                }

                if (data.totalChapters > 0) {
                    setStatusMessage(
                        data.completedChapters > 0
                            ? `Generating chapter ${data.completedChapters} of ${data.totalChapters}...`
                            : `Structuring syllabus outline for ${data.totalChapters} chapters...`
                    );
                }

                if (data.status === "Ready") {
                    clearInterval(pollingIntervalRef.current);
                    setProgressPercent(100);
                    setStatusMessage("Course ready! All chapters and study notes have been created.");
                    setCourseCreated(true);
                    setLoading(false);
                }
            } catch (err) {
                console.warn("Status polling notice:", err.message);
            }
        }, 2000);
    };

    const GenerateCourseOutline = async () => {
        if (generateRef.current) {
            return;
        }

        // Credit check
        if (credits !== null && credits <= 0) {
            toast.error("You have no credits left. Please buy more to create a course.");
            return;
        }

        generateRef.current = true;
        setLoading(true);
        setProgressPercent(15);
        setStatusMessage('Initializing Gemini AI and drafting course syllabus...');
        const courseId = uuidv4();
        setCreatedCourseId(courseId);

        try {
            // Kick off live status polling in background
            startStatusPolling(courseId);

            await axios.post('/api/generate-course-outline', {
                courseId,
                ...formData,
            });

            // Update local credit count after server deduction
            setCredits(prev => (prev !== null ? Math.max(0, prev - 1) : null));
            toast.success("Course outline created! Generating chapters in background...");
            setProgressPercent(40);
            setStatusMessage('Outline accepted! Writing chapter notes and quiz questions...');

        } catch (err) {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            const status = err?.response?.status;
            if (status === 429) {
                toast.error("Rate limit reached. Please wait a moment before trying again.");
                setStatusMessage('Rate limit reached. Please try again in 1 minute.');
            } else if (status === 402) {
                toast.error("No credits remaining. Please buy more credits.");
                setStatusMessage('No credits remaining. Please buy more credits.');
                router.push('/dashboard/upgrade');
            } else {
                const msg = err?.response?.data?.details || err?.message || "Failed to generate course outline";
                toast.error(msg);
                setStatusMessage(msg);
            }
            setLoading(false);
        } finally {
            generateRef.current = false;
        }
    };

    const noCredits = credits !== null && credits <= 0;

    return (
        <div className='flex flex-col items-center p-5 md:px-24 lg:px-36 mt-16'>
            <h2 className='font-bold text-4xl text-primary text-center'>
                Start Building Your Personal Study Material
            </h2>
            <p className='text-gray-500 text-lg text-center mt-2'>
                Fill all details in order to generate comprehensive study material
            </p>

            {/* Credit Status Badge */}
            <div className="mt-4 flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Available Credits: {credits !== null ? credits : '...'}</span>
            </div>

            {noCredits && (
                <div className="mt-6 w-full max-w-md bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <p className="text-red-700 font-medium mb-3">
                        You've used all your credits. Buy more to continue creating courses.
                    </p>
                    <Link href="/dashboard/upgrade">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Zap className="w-4 h-4 mr-2" />
                            Buy Credits
                        </Button>
                    </Link>
                </div>
            )}

            {!noCredits && (
                <>
                    <div className='mt-8'>
                        {step === 0
                            ? <SelectOption selectedStudyType={(v) => handleUserInput('studyType', v)} />
                            : <TopicInput
                                setTopic={(v) => handleUserInput('topic', v)}
                                setDifficultyLevel={(v) => handleUserInput('difficultyLevel', v)}
                              />
                        }
                    </div>

                    <div className={`flex flex-col items-center w-full mt-28 ${step === 0 ? 'justify-center' : ''}`}>
                        <div className={`flex justify-between w-full mb-6 ${step === 0 ? 'justify-center' : ''}`}>
                            {step !== 0
                                ? <Button onClick={() => setStep(s => s - 1)} variant="outline" disabled={loading}>Previous</Button>
                                : <span />
                            }
                            {step === 0
                                ? <Button onClick={() => setStep(1)}>Next</Button>
                                : <Button onClick={GenerateCourseOutline} disabled={loading || courseCreated} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {loading ? <Loader className="animate-spin mr-2" /> : null}
                                    {loading ? 'Generating...' : 'Generate Course'}
                                  </Button>
                            }
                        </div>

                        {/* Real-time Progress Bar & Status */}
                        {(loading || courseCreated || statusMessage) && (
                            <div className={`w-full max-w-md rounded-2xl p-6 text-center shadow-sm transition-all duration-300 ${courseCreated ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    {courseCreated ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                                    )}
                                    <h3 className={`text-lg font-semibold ${courseCreated ? 'text-green-900' : 'text-blue-900'}`}>
                                        {courseCreated ? 'Your course is ready!' : 'Generating Study Material...'}
                                    </h3>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-white/70 rounded-full h-2.5 overflow-hidden my-3 border border-black/5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-500 ${
                                            courseCreated ? 'bg-green-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                        }`}
                                        style={{ width: `${Math.max(5, progressPercent)}%` }}
                                    />
                                </div>

                                <p className={`mt-2 text-xs font-medium ${courseCreated ? 'text-green-700' : 'text-blue-700'}`}>
                                    {statusMessage}
                                </p>

                                <div className="mt-5 flex gap-2 justify-center">
                                    {courseCreated && createdCourseId && (
                                        <Button
                                            onClick={() => router.push(`/courses/${createdCourseId}`)}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            View Course
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push('/dashboard')}
                                    >
                                        Go to Dashboard
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default Create;

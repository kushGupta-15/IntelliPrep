"use client";
import React, { useEffect, useRef, useState } from 'react';
import SelectOption from './_components/SelectOption';
import { Button } from '../../components/ui/button';
import TopicInput from './_components/TopicInput';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { Loader, Zap } from 'lucide-react';
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
    const generateRef = useRef(false);
    const router = useRouter();

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

    const handleUserInput = (fieldName, fieldValue) => {
        setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));
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
        setStatusMessage('Generating your course. Please wait...');
        const courseId = uuidv4();
        try {
            await axios.post('/api/generate-course-outline', {
                courseId,
                ...formData,
                createdBy: user?.primaryEmailAddress?.emailAddress,
            });
            // Deduct 1 credit
            await axios.post('/api/user/deduct-credit', {
                email: user?.primaryEmailAddress?.emailAddress,
            });
            toast.success("Course created! It will appear on your dashboard shortly.");
            setCourseCreated(true);
            setStatusMessage('Your course has been generated successfully.');
        } catch (err) {
            const status = err?.response?.status;
            if (status === 429) {
                toast.error("AI quota exceeded. Please try again in a moment.");
                setStatusMessage('AI quota exceeded. Please try again shortly.');
            } else if (status === 402) {
                toast.error("No credits remaining. Please buy more credits.");
                setStatusMessage('No credits remaining. Please buy more credits.');
                router.push('/dashboard/upgrade');
            } else {
                const msg = err?.response?.data?.details || err?.message || "Failed to generate course outline";
                toast.error(msg);
                setStatusMessage(msg);
            }
        } finally {
            setLoading(false);
            generateRef.current = false;
        }
    };

    const noCredits = credits !== null && credits <= 0;

    return (
        <div className='flex flex-col items-center p-5 md:px-24 lg:px-36 mt-20'>
            <h2 className='font-bold text-4xl text-primary text-center'>
                Start Building Your Personal Study Material
            </h2>
            <p className='text-gray-500 text-lg text-center mt-2'>
                Fill all details in order to generate study material for your next project
            </p>

            {/* Credits indicator */}
            {credits !== null && (
                <div className={`flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-medium ${
                    noCredits
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : credits <= 2
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'bg-green-50 text-green-600 border border-green-200'
                }`}>
                    <Zap className="w-4 h-4" />
                    {noCredits
                        ? 'No credits remaining'
                        : `${credits} credit${credits !== 1 ? 's' : ''} remaining`
                    }
                </div>
            )}

            {/* No credits banner */}
            {noCredits && (
                <div className="mt-6 w-full max-w-md bg-red-50 border border-red-200 rounded-xl p-5 text-center">
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
                    <div className='mt-10'>
                        {step === 0
                            ? <SelectOption selectedStudyType={(v) => handleUserInput('studyType', v)} />
                            : <TopicInput
                                setTopic={(v) => handleUserInput('topic', v)}
                                setDifficultyLevel={(v) => handleUserInput('difficultyLevel', v)}
                              />
                        }
                    </div>

                    <div className={`flex flex-col items-center w-full mt-36 ${step === 0 ? 'justify-center' : ''}`}>
                        <div className={`flex justify-between w-full mb-4 ${step === 0 ? 'justify-center' : ''}`}>
                            {step !== 0
                                ? <Button onClick={() => setStep(s => s - 1)} variant="outline">Previous</Button>
                                : <span />
                            }
                            {step === 0
                                ? <Button onClick={() => setStep(1)}>Next</Button>
                                : <Button onClick={GenerateCourseOutline} disabled={loading || courseCreated}>
                                    {loading ? <Loader className="animate-spin" /> : 'Generate'}
                                  </Button>
                            }
                        </div>
                        {statusMessage && (
                            <div className={`w-full max-w-md rounded-2xl p-6 text-center ${courseCreated ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                                <h3 className={`text-xl font-semibold ${courseCreated ? 'text-green-900' : 'text-blue-900'}`}>
                                    {courseCreated ? 'Your course has been generated!' : 'Generating your course...'}
                                </h3>
                                <p className={`mt-2 text-sm ${courseCreated ? 'text-green-700' : 'text-blue-700'}`}>
                                    {statusMessage}
                                </p>
                                {courseCreated && (
                                    <div className="mt-5 flex justify-center">
                                        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                                            Return to Dashboard
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default Create;

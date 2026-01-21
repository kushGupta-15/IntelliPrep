"use client";

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

function ViewNotes() {
  const { courseId } = useParams();
  const [notes, setNotes] = useState([]);
  const [stepCount, setStepCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const GetNotes = async () => {
    try {
      setIsLoading(true);
      const result = await axios.post("/api/study-type", {
        courseId: courseId,
        studyType: 'notes',
      });
      setNotes(result.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    GetNotes();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-pulse space-y-4 w-full max-w-5xl">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return notes && (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="whitespace-nowrap">Back to Course</span>
          </Button>
          <div className="text-sm text-gray-500">
            Note {stepCount + 1} of {notes.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
            <Button
              variant="outline"
              onClick={() => setStepCount(stepCount - 1)}
              disabled={stepCount === 0}
              className="flex items-center text-sm sm:text-base px-2 sm:px-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            <div className="flex-1 flex gap-1 items-center min-w-0">
              {notes.map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                    index === stepCount
                      ? "bg-blue-600"
                      : index < stepCount
                      ? "bg-blue-200"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setStepCount(stepCount + 1)}
              disabled={stepCount === notes.length - 1}
              className="flex items-center text-sm sm:text-base px-2 sm:px-4"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-sm mb-4 sm:mb-6">
          <div 
            className="h-[calc(100vh-20rem)] sm:h-[calc(100vh-22rem)] md:h-[calc(100vh-24rem)] 
              overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
              prose prose-sm sm:prose lg:prose-lg max-w-none break-words
              prose-headings:text-gray-900 prose-headings:break-words
              prose-p:text-gray-600 prose-p:break-words
              prose-a:text-blue-600 prose-a:break-words
              prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto
              prose-pre:overflow-x-auto prose-pre:whitespace-pre-wrap
              prose-code:break-words"
            dangerouslySetInnerHTML={{ __html: notes[stepCount]?.notes }} 
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#D1D5DB #F3F4F6'
            }}
          />
        </div>

        {/* End Message */}
        {notes.length === stepCount + 1 && (
          <div className="bg-blue-50 rounded-xl p-4 sm:p-6 md:p-8 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-900 mb-2 sm:mb-3">
              Congratulations! You've completed all notes
            </h2>
            <p className="text-blue-700 mb-4 sm:mb-6 text-sm sm:text-base">
              Great job making it through all the material. Would you like to review again or return to the course?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setStepCount(0)}
                className="w-full sm:w-auto sm:min-w-[120px]"
              >
                Review Again
              </Button>
              <Button
                onClick={() => router.back()}
                className="w-full sm:w-auto sm:min-w-[120px] bg-blue-600 hover:bg-blue-700"
              >
                Back to Course
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewNotes;
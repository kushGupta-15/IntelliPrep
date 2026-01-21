"use client";
import React from 'react';
import Image from 'next/image';

function CourseIntroCard({ course }) {
  let courseLayout = course?.courseLayout;
  if (typeof courseLayout === 'string') {
    try {
      courseLayout = JSON.parse(courseLayout);
    } catch (error) {
      console.error("Error parsing courseLayout in CourseIntroCard:", error);
      courseLayout = {};
    }
  }

  const courseTitle = courseLayout?.course_title || course?.topic || 'Untitled Course';
  const courseSummary = courseLayout?.course_summary || 'No description available';
  const chaptersCount = courseLayout?.chapters?.length || 0;

  return (
    <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-center sm:items-start p-5 sm:p-8 md:p-10 border shadow-md rounded-lg w-full">
      <div className="flex-shrink-0">
        <Image 
          src="/knowledge.png" 
          width={70} 
          height={70} 
          alt="Knowledge icon"
          className="w-16 h-16 sm:w-[70px] sm:h-[70px]"
        />
      </div>

      <div className="text-center sm:text-left w-full">
        <h2 className="font-bold text-xl sm:text-2xl">
          {courseTitle}
        </h2>

        <p className="mt-2 text-sm sm:text-base text-gray-700">
          {courseSummary}
        </p>

        <h2 className="mt-3 text-sm sm:text-lg text-blue-700 font-medium">
          Total Chapters: {chaptersCount}
        </h2>
      </div>
    </div>
  );
}

export default CourseIntroCard;

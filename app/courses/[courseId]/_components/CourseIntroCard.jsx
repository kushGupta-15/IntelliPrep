"use client";
import React from 'react';
import { BookOpen, Layers, BarChart2 } from 'lucide-react';

const DIFFICULTY_COLOR = {
  Easy:     'bg-green-100 text-green-700',
  Moderate: 'bg-yellow-100 text-yellow-700',
  Hard:     'bg-red-100 text-red-700',
};

const TYPE_EMOJI = {
  Exam:           '📝',
  'Job Interview':'💼',
  Practice:       '🏋️',
  'Coding Prep':  '💻',
  Other:          '📚',
};

function CourseIntroCard({ course }) {
  let courseLayout = course?.courseLayout;
  if (typeof courseLayout === 'string') {
    try { courseLayout = JSON.parse(courseLayout); } catch { courseLayout = {}; }
  }

  const title      = courseLayout?.course_title  || course?.topic || 'Untitled Course';
  const summary    = courseLayout?.course_summary || '';
  const chapters   = courseLayout?.chapters?.length ?? 0;
  const difficulty = course?.difficulty || 'Easy';
  const courseType = course?.courseType || 'Other';
  const emoji      = courseLayout?.emoji || TYPE_EMOJI[courseType] || '📚';

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Gradient banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-xl sm:text-2xl leading-snug">{title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-blue-100 text-sm">{courseType}</span>
              <span className="text-blue-300">·</span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${DIFFICULTY_COLOR[difficulty] || 'bg-blue-100 text-blue-700'}`}>
                {difficulty}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 sm:px-8">
        {summary && (
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{summary}</p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mt-5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span><strong className="text-gray-800">{chapters}</strong> chapters</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <span>Notes · Flashcards · Quiz</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
              <BarChart2 className="w-3.5 h-3.5 text-green-500" />
            </div>
            <span>{difficulty} difficulty</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseIntroCard;

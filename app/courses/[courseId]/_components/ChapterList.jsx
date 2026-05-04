"use client";

import React from "react";
import { BookOpen } from "lucide-react";

function ChapterList({ course }) {
  let courseLayout = course?.courseLayout;
  if (typeof courseLayout === 'string') {
    try { courseLayout = JSON.parse(courseLayout); } catch { courseLayout = {}; }
  }

  const chapters = courseLayout?.chapters || [];

  if (chapters.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="font-bold text-xl text-gray-900 mb-4">Chapters</h2>
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Chapters will appear once the course finishes generating.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="font-bold text-xl text-gray-900 mb-4">
        Chapters <span className="text-gray-400 font-normal text-base ml-1">({chapters.length})</span>
      </h2>

      <div className="space-y-3">
        {chapters.map((chapter, index) => {
          const title   = chapter?.chapter_title   || chapter?.chapterTitle   || `Chapter ${index + 1}`;
          const summary = chapter?.chapter_summary || chapter?.chapterSummary || '';
          const emoji   = chapter?.emoji || '📖';
          const topics  = chapter?.topics ? Object.values(chapter.topics) : [];

          return (
            <div
              key={index}
              className="flex gap-4 items-start bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Number + emoji */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {index + 1}
                </div>
                <span className="text-xl">{emoji}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-base leading-snug">{title}</h3>
                {summary && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-relaxed">{summary}</p>
                )}

                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {topics.slice(0, 4).map((topic, i) => (
                      <span
                        key={i}
                        className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                    {topics.length > 4 && (
                      <span className="text-xs text-gray-400 px-2 py-1">
                        +{topics.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ChapterList;

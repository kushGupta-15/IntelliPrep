"use client";

import React from "react";

function ChapterList({ course }) {
  let courseLayout = course?.courseLayout;
  if (typeof courseLayout === 'string') {
    try {
      courseLayout = JSON.parse(courseLayout);
    } catch (error) {
      console.error("Error parsing courseLayout in ChapterList:", error);
      courseLayout = {};
    }
  }

  const CHAPTERS = courseLayout?.chapters || [];

  console.log("ChapterList - Course Layout:", courseLayout);
  console.log("ChapterList - Chapters:", CHAPTERS);

  return (
    <div className="mt-5">
      <h2 className="font-medium text-xl">Chapters</h2>
      <div className="mt-3">
        {CHAPTERS.length > 0 ? (
          CHAPTERS.map((chapter, index) => {
            const chapterTitle = chapter?.chapter_title || 
                                chapter?.chapterTitle || 
                                chapter?.title ||
                                `Chapter ${index + 1}`;
            
            const chapterSummary = chapter?.chapter_summary || 
                                  chapter?.chapterSummary || 
                                  chapter?.summary ||
                                  "This chapter covers important concepts and topics related to the course material.";
            
            const chapterEmoji = chapter?.emoji || "📚";

            return (
              <div key={index} className="flex gap-5 items-center p-4 border shadow-md rounded-lg mb-2 cursor-pointer hover:shadow-lg transition-shadow">
                <h2 className="text-2xl">{chapterEmoji}</h2>
                <div className="flex-1">
                  <h2 className="font-medium text-lg">{chapterTitle}</h2>
                  <p className="line-clamp-2 text-gray-600 text-sm mt-1">{chapterSummary}</p>
                  

                  {chapter?.topics && Object.keys(chapter.topics).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Topics covered:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.values(chapter.topics).slice(0, 3).map((topic, topicIndex) => (
                          <span key={topicIndex} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {topic}
                          </span>
                        ))}
                        {Object.keys(chapter.topics).length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{Object.keys(chapter.topics).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No chapters available</p>
            <p className="text-sm text-gray-400">Chapters will appear here once the course is fully generated.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChapterList;

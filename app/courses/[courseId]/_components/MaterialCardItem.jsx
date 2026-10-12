"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '../../../../components/ui/button';
import { RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Maps item.name → the key used in studyTypeContent.result
const CONTENT_KEY_MAP = {
  'Notes/Chapters': 'notes',
  'Flashcard': 'flashCard',
  'Quiz': 'quiz',
};

// Maps item.name → the type string the API expects
const API_TYPE_MAP = {
  'Flashcard': 'Flashcard',
  'Quiz': 'Quiz',
};

function MaterialCardItem({ item, studyTypeContent, course, refreshData, onGenerateStart, onContentReady }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pollRef = useRef(null);
  const pollCountRef = useRef(0);

  const contentKey = CONTENT_KEY_MAP[item.name] ?? item.type;
  const apiType = API_TYPE_MAP[item.name];

  const isContentReady = (data) => {
    const content = data?.result?.[contentKey];
    if (!content) return false;
    if (Array.isArray(content)) return content.length > 0;
    if (content?.questions) return content.questions.length > 0;
    return Object.keys(content).length > 0;
  };

  const ready = isContentReady(studyTypeContent);

  // Stop polling once content becomes ready
  useEffect(() => {
    if (ready && pollRef.current) {
      console.log(`✅ [${item.name}] Content ready — stopping poll`);
      clearInterval(pollRef.current);
      pollRef.current = null;
      pollCountRef.current = 0;
      if (onContentReady) onContentReady();
      setLoading(false);
    }
  }, [ready]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const GenerateContent = async () => {
    if (!apiType) {
      // Notes are generated with the course — just navigate
      router.push(`/courses/${course?.courseId}${item.path}`);
      return;
    }

    setLoading(true);

    let courseLayout = course?.courseLayout;
    if (typeof courseLayout === 'string') {
      try { courseLayout = JSON.parse(courseLayout); } catch (_) { courseLayout = {}; }
    }

    const chapters = (courseLayout?.chapters || []).map(ch => ({
      chapter_title: ch?.chapter_title || ch?.chapterTitle || 'Untitled Chapter',
      chapter_summary: ch?.chapter_summary || ch?.chapterSummary || '',
      topics: ch?.topics || {},
    }));

    console.log(`🚀 [${item.name}] Generating content for courseId: ${course?.courseId}, type: ${apiType}`);

    try {
      await axios.post('/api/study-type-content', {
        courseId: course?.courseId,
        type: apiType,
        chapters,
      });

      console.log(`📡 [${item.name}] Generation triggered — starting poll`);
      if (onGenerateStart) onGenerateStart();

      // Poll every 4s, max 60 attempts (4 minutes)
      pollCountRef.current = 0;
      pollRef.current = setInterval(() => {
        pollCountRef.current += 1;
        console.log(`🔄 [${item.name}] Poll #${pollCountRef.current}`);
        refreshData();

        if (pollCountRef.current >= 60) {
          console.warn(`⚠️  [${item.name}] Poll timeout after 4 minutes`);
          clearInterval(pollRef.current);
          pollRef.current = null;
          setLoading(false);
        }
      }, 4000);

    } catch (err) {
      console.error(`❌ [${item.name}] Error generating content:`, err?.response?.data || err.message);
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white border rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 p-6 flex flex-col items-center justify-between text-center relative ${
      !ready && !loading ? 'border-dashed border-gray-300' : 'border-gray-200'
    }`}>
      {/* Badge */}
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${
        loading ? 'bg-blue-100 text-blue-700' :
        ready ? 'bg-emerald-100 text-emerald-700' :
        'bg-gray-100 text-gray-500'
      }`}>
        {loading ? 'Generating...' : ready ? '✓ Ready' : 'Available'}
      </span>

      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center p-3 mb-3">
        <Image src={item.icon} alt={item.name} height={48} width={48} className="object-contain" />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
        <p className="text-gray-500 text-xs sm:text-sm mt-1 leading-relaxed max-w-xs">{item.desc}</p>
      </div>

      <Button
        className={`mt-5 w-full min-h-[40px] font-medium text-xs sm:text-sm rounded-xl transition-all ${
          ready
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
            : 'border-blue-600 text-blue-600 hover:bg-blue-50'
        }`}
        variant={ready ? "default" : "outline"}
        onClick={ready
          ? () => router.push(`/courses/${course?.courseId}${item.path}`)
          : GenerateContent
        }
        disabled={loading}
      >
        {loading && <RefreshCcw className="animate-spin mr-2 w-4 h-4" />}
        {loading ? 'Generating Content...' : ready ? `Open ${item.name}` : `Generate ${item.name}`}
      </Button>
    </div>
  );
}

export default MaterialCardItem;

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
    <div className={`border shadow-md rounded-lg p-5 flex flex-col items-center ${!ready ? 'grayscale' : ''}`}>
      <h2 className={`p-1 px-2 rounded-full text-[10px] mb-2 text-white ${ready ? 'bg-green-500' : 'bg-gray-500'}`}>
        {loading ? 'Generating...' : ready ? 'Ready' : 'Generate'}
      </h2>

      <Image src={item.icon} alt={item.name} height={50} width={50} />
      <h2 className="font-medium mt-1">{item.name}</h2>
      <p className="text-gray-500 text-sm text-center">{item.desc}</p>

      <Button
        className="mt-3 w-full"
        variant="outline"
        onClick={ready
          ? () => router.push(`/courses/${course?.courseId}${item.path}`)
          : GenerateContent
        }
        disabled={loading}
      >
        {loading && <RefreshCcw className="animate-spin mr-2 w-4 h-4" />}
        {loading ? 'Generating...' : ready ? 'View' : 'Generate'}
      </Button>
    </div>
  );
}

export default MaterialCardItem;

"use client";

import React, { useEffect, useRef, useState } from 'react';
import MaterialCardItem from './MaterialCardItem';
import axios from 'axios';
import { Button } from '../../../../components/ui/button';
import { RefreshCcw } from 'lucide-react';

function StudyMaterialSection({ courseId, course }) {
  const [studyTypeContent, setStudyTypeContent] = useState();
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);
  const refreshRef = useRef(null);

  const getStudyMaterial = async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    try {
      const result = await axios.post('/api/study-type', {
        courseId: courseId,
        studyType: 'ALL',
      });
      setStudyTypeContent(result.data);
    } catch (error) {
      console.error("Error fetching study material:", error);
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  // Keep a stable ref so the interval always calls the latest version
  refreshRef.current = getStudyMaterial;

  // Check whether any content is still pending (status !== Ready)
  const hasPendingContent = (data) => {
    if (!data?.result) return false;
    const { flashCard, quiz } = data.result;
    // If either exists but has no content yet, it's still generating
    // (notes are generated with the course itself, not on-demand)
    return false; // polling for study-type content is handled per-card after Generate is clicked
  };

  useEffect(() => {
    // Initial fetch
    getStudyMaterial();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [courseId]);

  // Start/stop polling based on whether content is pending
  const startPolling = () => {
    if (intervalRef.current) return; // already polling
    console.log("▶️  [StudyMaterial] Starting content status polling");
    intervalRef.current = setInterval(() => {
      console.log("🔄 [StudyMaterial] Polling for content updates...");
      refreshRef.current();
    }, 4000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      console.log("⏹️  [StudyMaterial] Stopping content status polling");
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const materialList = [
    {
      name: 'Notes/Chapters',
      desc: 'Read notes to prepare it',
      icon: '/notes.png',
      path: '/notes',
      type: 'notes',
    },
    {
      name: 'Flashcard',
      desc: 'Flashcards help to remember the concepts',
      icon: '/flashcard.png',
      path: '/flashcards',
      type: 'flashCard',
    },
    {
      name: 'Quiz',
      desc: 'Great way to test your knowledge',
      icon: '/quiz.png',
      path: '/quiz',
      type: 'quiz',
    },
  ];

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
          📚 Study Material
        </h2>
        <Button
          onClick={() => getStudyMaterial(true)}
          variant="outline"
          size="sm"
          disabled={refreshing}
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {materialList.map((item, index) => (
          <MaterialCardItem
            key={index}
            item={item}
            studyTypeContent={studyTypeContent}
            course={course}
            refreshData={() => getStudyMaterial()}
            onGenerateStart={startPolling}
            onContentReady={stopPolling}
          />
        ))}
      </div>
    </section>
  );
}

export default StudyMaterialSection;

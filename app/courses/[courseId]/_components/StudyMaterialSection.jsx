"use client";

import React, { useEffect, useState } from 'react';
import MaterialCardItem from './MaterialCardItem';
import axios from 'axios';
import { Button } from '../../../../components/ui/button';
import { RefreshCcw } from 'lucide-react';

function StudyMaterialSection({ courseId, course }) {
  const [studyTypeContent, setStudyTypeContent] = useState();
  const [refreshing, setRefreshing] = useState(false);

  const getStudyMaterial = async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    try {
      const result = await axios.post('/api/study-type', {
        courseId: courseId,
        studyType: 'ALL',
      });
      setStudyTypeContent(result.data);
      console.log("📊 Study material refreshed:", result.data);
    } catch (error) {
      console.error("Error fetching study material:", error);
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  useEffect(() => {
    getStudyMaterial();
    
    const interval = setInterval(() => {
      getStudyMaterial();
    }, 10000); 

    return () => clearInterval(interval);
  }, [courseId]);

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
      icon: '/flashCard.png',
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

  const handleManualRefresh = () => {
    getStudyMaterial(true);
  };

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
          📚 Study Material
        </h2>
        <Button 
          onClick={handleManualRefresh} 
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
          />
        ))}
      </div>
    </section>
  );
}

export default StudyMaterialSection;

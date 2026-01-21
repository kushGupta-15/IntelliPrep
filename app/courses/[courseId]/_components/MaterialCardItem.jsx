"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '../../../../components/ui/button';
import { RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

function MaterialCardItem({ item, studyTypeContent, course, refreshData }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const GenerateContent = async () => {
    setLoading(true);
    
    console.log("Starting content generation...");
    console.log("Full course object:", course);
    console.log("Course layout:", course?.courseLayout);
    console.log("Course layout type:", typeof course?.courseLayout);
    
    let courseLayout = course?.courseLayout;
    
    if (typeof courseLayout === 'string') {
      try {
        courseLayout = JSON.parse(courseLayout);
        console.log("Parsed course layout:", courseLayout);
      } catch (error) {
        console.error("Error parsing courseLayout:", error);
        courseLayout = {};
      }
    }
    
    const chapters = courseLayout?.chapters || [];
    console.log("Extracted chapters:", chapters);
    
    const formattedChapters = chapters.map(chapter => ({
      chapter_title: chapter?.chapter_title || chapter?.chapterTitle || 'Untitled Chapter',
      chapter_summary: chapter?.chapter_summary || chapter?.chapterSummary || '',
      topics: chapter?.topics || {}
    }));

    console.log("Formatted chapters:", formattedChapters);

    try {
      const result = await axios.post('/api/study-type-content', {
        courseId: course?.courseId,
        type: item.name,
        chapters: formattedChapters,
      });

      console.log("Content generation API call successful:", result);
      
      refreshData();
      
      let pollCount = 0;
      const maxPolls = 36; 
      
      const pollForCompletion = setInterval(async () => {
        pollCount++;
        console.log(`🔄 Polling for content completion... (${pollCount}/${maxPolls})`);
        refreshData();
        
        setTimeout(() => {
          if (isContentReady()) {
            console.log("✅ Content is ready, stopping polling");
            clearInterval(pollForCompletion);
          }
        }, 1000); 
        
        if (pollCount >= maxPolls) {
          console.log("Polling timeout reached");
          clearInterval(pollForCompletion);
        }
      }, 5000); 
      

      setTimeout(() => {
        console.log("Quick status check...");
        refreshData();
      }, 2000);
      
    } catch (err) {
      console.error("Error generating content:", err);
    }

    setLoading(false);
  };

  const isContentReady = () => {
    if (!studyTypeContent?.result) {
      return false;
    }
    
    let contentKey;
    switch (item.name) {
      case 'Notes/Chapters':
        contentKey = 'notes';
        break;
      case 'Flashcard':
        contentKey = 'flashCard';
        break;
      case 'Quiz':
        contentKey = 'quiz';
        break;
      default:
        contentKey = item.type;
    }
    
    const content = studyTypeContent.result[contentKey];

    if (!content) {
      return false;
    }

    if (Array.isArray(content)) {
      return content.length > 0;
    }

    if (typeof content === 'object' && content !== null) {
      if (content.questions && Array.isArray(content.questions)) {
        return content.questions.length > 0;
      }
      return Object.keys(content).length > 0;
    }

    return false;
  };

  const ready = isContentReady();

  const handleViewClick = () => {
    if (ready) {
      router.push(`/courses/${course?.courseId}${item.path}`);
    }
  };

  return (
    <div
      className={`border shadow-md rounded-lg p-5 flex flex-col items-center ${
        !ready && 'grayscale'
      }`}
    >
      <h2
        className={`p-1 px-2 rounded-full text-[10px] mb-2 text-white ${
          ready ? 'bg-green-500' : 'bg-gray-500'
        }`}
      >
        {ready ? 'Ready' : 'Generate'}
      </h2>

      <Image src={item.icon} alt={item.name} height={50} width={50} />
      <h2 className="font-medium">{item.name}</h2>
      <p className="text-gray-500 text-sm text-center">{item.desc}</p>

      <Button
        className="mt-3 w-full"
        variant="outline"
        onClick={!ready ? GenerateContent : handleViewClick}
        disabled={loading}
      >
        {loading && <RefreshCcw className="animate-spin mr-2" />}
        {!ready ? 'Generate' : 'View'}
      </Button>
    </div>
  );
}

export default MaterialCardItem;

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft } from 'lucide-react';
import { Button } from "../../../../components/ui/button";
import FlashcardItem from "./_components/FlashcardItem";
import { 
  Carousel, 
  CarouselItem, 
  CarouselContent, 
  CarouselNext, 
  CarouselPrevious 
} from "../../../../components/ui/carousel";

function Flashcard() {
  const { courseId } = useParams();
  const router = useRouter();
  const [flashCards, setFlashCards] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [api,setApi] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleBackToCourse = () => {
    router.push(`/courses/${courseId}`);
  };

  useEffect(()=>{
    if(!api){
        return ;
    }

    api.on('select',()=>{
        setIsFlipped(false);
    })
  },[api])

  const GetFlashCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await axios.post('/api/study-type', {
        courseId: courseId,
        studyType: 'Flashcard'
      });
      
      console.log("Full flashcard API response:", result.data);
      
      let flashcardData = [];
      
      if (result.data.content) {
        if (typeof result.data.content === 'string') {
          flashcardData = JSON.parse(result.data.content);
        } else {
          flashcardData = result.data.content;
        }
      } else if (result.data.result && result.data.result.flashCard) {
        flashcardData = result.data.result.flashCard;
      } else if (Array.isArray(result.data)) {
        flashcardData = result.data;
      }
      
      console.log("Processed flashcard data:", flashcardData);
      
      if (Array.isArray(flashcardData)) {
        setFlashCards(flashcardData);
      } else {
        console.error("Flashcard data is not an array:", flashcardData);
        setFlashCards([]);
        setError("No flashcards available. Please generate flashcards first.");
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      setError("Failed to load flashcards. Please try again.");
      setFlashCards([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    GetFlashCards();
  }, []);

  useEffect(() => {
    console.log("flashcardshelooo", flashCards);
  }, [flashCards]);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="p-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-4">
        <Button 
          onClick={handleBackToCourse}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Button>
        <div>
          <h2 className="font-bold text-2xl">Flashcards</h2>
          <p className="text-gray-600">
            Flashcards: The Ultimate Tool to Lock in Concepts!
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center mt-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading flashcards...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center mt-10">
          <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={GetFlashCards}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && flashCards.length === 0 && (
        <div className="flex items-center justify-center mt-10">
          <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">No flashcards available.</p>
            <p className="text-sm text-gray-500 mt-2">Please generate flashcards first from the course page.</p>
          </div>
        </div>
      )}

      {!loading && !error && flashCards.length > 0 && (
        <div className="flex items-center justify-center mt-10">
          <div className="relative w-full max-w-2xl">
            <Carousel setApi={setApi}>
              <CarouselContent>
                {flashCards.map((item, index) => (
                  <CarouselItem
                    key={index}
                    className="flex items-center justify-center"
                  >
                    <FlashcardItem
                      isFlipped={isFlipped}
                      handleClick={handleClick}
                      front={item.front}
                      back={item.back}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      )}
    </div>
  );
}

export default Flashcard;

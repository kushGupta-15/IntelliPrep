"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Layers } from 'lucide-react';
import { Button } from "../../../../components/ui/button";
import FlashcardItem from "./_components/FlashcardItem";
import {
  Carousel,
  CarouselItem,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "../../../../components/ui/carousel";

function Flashcard() {
  const { courseId } = useParams();
  const router = useRouter();
  const [flashCards, setFlashCards] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [api, setApi] = useState();
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reset flip on card change
  useEffect(() => {
    if (!api) return;
    api.on('select', () => {
      setIsFlipped(false);
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await axios.post('/api/study-type', { courseId, studyType: 'Flashcard' });

        let data = [];
        if (result.data?.content) {
          data = typeof result.data.content === 'string'
            ? JSON.parse(result.data.content)
            : result.data.content;
        } else if (result.data?.result?.flashCard) {
          data = result.data.result.flashCard;
        } else if (Array.isArray(result.data)) {
          data = result.data;
        }

        if (Array.isArray(data) && data.length > 0) {
          setFlashCards(data);
        } else {
          setError("No flashcards available. Please generate flashcards first from the course page.");
        }
      } catch (e) {
        setError("Failed to load flashcards. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [courseId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/courses/${courseId}`)} className="text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">Flashcards</h1>
              <p className="text-xs text-gray-400 mt-0.5">Tap a card to reveal the answer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Loading flashcards...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-16 bg-white rounded-2xl border shadow-sm p-8">
            <Layers className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">{error}</p>
            <Button onClick={() => router.push(`/courses/${courseId}`)} variant="outline" className="mt-4">
              Back to Course
            </Button>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && flashCards.length > 0 && (
          <>
            {/* Counter */}
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 bg-white border rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 shadow-sm">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                {current} of {flashCards.length}
              </span>
            </div>

            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {flashCards.map((item, index) => (
                  <CarouselItem key={index} className="flex items-center justify-center py-4">
                    <FlashcardItem
                      isFlipped={isFlipped}
                      handleClick={() => setIsFlipped(f => !f)}
                      front={item.front}
                      back={item.back}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4" />
              <CarouselNext className="hidden sm:flex -right-4" />
            </Carousel>

            {/* Mobile nav */}
            <div className="flex sm:hidden justify-center gap-4 mt-6">
              <Button variant="outline" size="sm" onClick={() => api?.scrollPrev()} disabled={current === 1}>
                ← Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => api?.scrollNext()} disabled={current === flashCards.length}>
                Next →
              </Button>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mt-8 flex-wrap">
              {flashCards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { api?.scrollTo(i); setIsFlipped(false); }}
                  className={`rounded-full transition-all duration-200 ${
                    i === current - 1 ? 'w-5 h-2 bg-blue-600' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Flashcard;

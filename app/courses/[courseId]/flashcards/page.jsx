"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Layers, Sparkles, RotateCcw, CheckCircle2, BookmarkCheck } from 'lucide-react';
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
  const [allCards, setAllCards] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [api, setApi] = useState();
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Spaced Repetition Ratings: { [cardIndex]: 'again' | 'hard' | 'good' | 'easy' }
  const [ratings, setRatings] = useState({});
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'learning' | 'mastered'

  // Load ratings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && courseId) {
      try {
        const saved = localStorage.getItem(`intelliprep_srs_${courseId}`);
        if (saved) {
          setRatings(JSON.parse(saved));
        }
      } catch (e) {
        console.warn("Could not load flashcard SRS ratings:", e);
      }
    }
  }, [courseId]);

  // Persist ratings to localStorage
  const saveRating = (cardIndex, rating) => {
    setRatings(prev => {
      const updated = { ...prev, [cardIndex]: rating };
      if (typeof window !== "undefined" && courseId) {
        try {
          localStorage.setItem(`intelliprep_srs_${courseId}`, JSON.stringify(updated));
        } catch (_) {}
      }
      return updated;
    });

    // Auto flip back and advance to next card after small delay
    setIsFlipped(false);
    setTimeout(() => {
      if (api) {
        api.scrollNext();
      }
    }, 250);
  };

  const handleResetSRS = () => {
    if (confirm("Reset mastery progress for this deck?")) {
      setRatings({});
      if (typeof window !== "undefined" && courseId) {
        localStorage.removeItem(`intelliprep_srs_${courseId}`);
      }
      if (api) api.scrollTo(0);
      setIsFlipped(false);
    }
  };

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
          setAllCards(data);
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

  // Calculate deck mastery stats
  const masteryStats = useMemo(() => {
    const total = allCards.length;
    if (total === 0) return { masteredCount: 0, learningCount: 0, percentage: 0 };

    let mastered = 0;
    let learning = 0;

    allCards.forEach((_, idx) => {
      const r = ratings[idx];
      if (r === "easy" || r === "good") {
        mastered += 1;
      } else if (r === "again" || r === "hard") {
        learning += 1;
      }
    });

    const percentage = Math.round((mastered / total) * 100);
    return { masteredCount: mastered, learningCount: learning, percentage };
  }, [allCards, ratings]);

  // Filter cards based on SRS filter
  const displayedCards = useMemo(() => {
    return allCards.map((card, originalIndex) => ({ ...card, originalIndex })).filter((item) => {
      const r = ratings[item.originalIndex];
      if (activeFilter === "mastered") {
        return r === "easy" || r === "good";
      }
      if (activeFilter === "learning") {
        return !r || r === "again" || r === "hard";
      }
      return true;
    });
  }, [allCards, ratings, activeFilter]);

  const currentOriginalIndex = displayedCards[current - 1]?.originalIndex ?? 0;
  const currentRating = ratings[currentOriginalIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/courses/${courseId}`)} className="text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">Spaced Repetition Flashcards</h1>
              <p className="text-xs text-gray-400 mt-0.5">Flip and rate recall for optimal memory retention</p>
            </div>
          </div>
          {allCards.length > 0 && (
            <button
              onClick={handleResetSRS}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
              title="Reset deck progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
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

        {/* Cards Flow */}
        {!loading && !error && allCards.length > 0 && (
          <>
            {/* SRS Mastery Progress Banner */}
            <div className="bg-white border rounded-2xl p-4 shadow-sm mb-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Deck Mastery: {masteryStats.percentage}%
                </span>
                <span className="text-gray-500">
                  {masteryStats.masteredCount} Mastered / {allCards.length - masteryStats.masteredCount} In Learning
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${masteryStats.percentage}%` }}
                />
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => { setActiveFilter("all"); if (api) api.scrollTo(0); }}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    activeFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All Cards ({allCards.length})
                </button>
                <button
                  onClick={() => { setActiveFilter("learning"); if (api) api.scrollTo(0); }}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    activeFilter === "learning" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  To Review ({allCards.length - masteryStats.masteredCount})
                </button>
                <button
                  onClick={() => { setActiveFilter("mastered"); if (api) api.scrollTo(0); }}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    activeFilter === "mastered" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Mastered ({masteryStats.masteredCount})
                </button>
              </div>
            </div>

            {displayedCards.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border p-8">
                <BookmarkCheck className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-800">No cards in this filter.</p>
                <Button variant="outline" size="sm" onClick={() => setActiveFilter("all")} className="mt-4">
                  Show All Cards
                </Button>
              </div>
            ) : (
              <>
                {/* Counter & Current Card Rating status */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-semibold text-gray-500 bg-white border px-3 py-1 rounded-full shadow-sm">
                    Card {current} of {displayedCards.length}
                  </span>
                  {currentRating && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                      currentRating === 'easy' ? 'bg-blue-100 text-blue-700' :
                      currentRating === 'good' ? 'bg-green-100 text-green-700' :
                      currentRating === 'hard' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Current: {currentRating}
                    </span>
                  )}
                </div>

                {/* Carousel Card */}
                <Carousel setApi={setApi} className="w-full">
                  <CarouselContent>
                    {displayedCards.map((item, index) => (
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

                {/* Spaced Repetition Grading Controls */}
                <div className="mt-6 bg-white border rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-xs text-gray-500 font-medium mb-3">
                    {isFlipped ? "How easily did you recall this answer?" : "Flip the card to grade your recall:"}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => saveRating(currentOriginalIndex, 'again')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      🔴 Again (Reset)
                    </button>
                    <button
                      onClick={() => saveRating(currentOriginalIndex, 'hard')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      🟠 Hard
                    </button>
                    <button
                      onClick={() => saveRating(currentOriginalIndex, 'good')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      🟢 Good
                    </button>
                    <button
                      onClick={() => saveRating(currentOriginalIndex, 'easy')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      🔵 Easy (Mastered)
                    </button>
                  </div>
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center gap-1.5 mt-6 flex-wrap">
                  {displayedCards.map((item, i) => {
                    const r = ratings[item.originalIndex];
                    let dotColor = 'bg-gray-300';
                    if (r === 'easy' || r === 'good') dotColor = 'bg-green-500';
                    else if (r === 'again' || r === 'hard') dotColor = 'bg-amber-500';

                    return (
                      <button
                        key={i}
                        onClick={() => { api?.scrollTo(i); setIsFlipped(false); }}
                        className={`rounded-full transition-all duration-200 ${
                          i === current - 1 ? 'w-5 h-2 bg-blue-600' : `w-2 h-2 ${dotColor} hover:opacity-80`
                        }`}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Flashcard;

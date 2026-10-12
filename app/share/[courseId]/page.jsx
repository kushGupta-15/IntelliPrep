"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { BookOpen, Layers, HelpCircle, Share2, Sparkles, AlertCircle, ArrowLeft, Check, X, RotateCcw } from "lucide-react";
import { Button } from "../../../components/ui/button";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import toast from "react-hot-toast";

export default function PublicSharedCourse() {
  const { courseId } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active tab: 'notes' | 'flashcards' | 'quiz'
  const [activeTab, setActiveTab] = useState("notes");

  // Notes state
  const [currentChapter, setCurrentChapter] = useState(0);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});

  useEffect(() => {
    const fetchPublicCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/courses/public?courseId=${courseId}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load shared course:", err);
        setError(err?.response?.data?.error || "This course does not exist or has been removed.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchPublicCourse();
    }
  }, [courseId]);

  const course = data?.course;
  const layout = course?.courseLayout || {};
  const notes = data?.notes || [];
  const flashcards = data?.flashCards || [];
  const quiz = data?.quiz || [];

  const handleShareClick = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Study link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Loading study material...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="p-3 bg-red-100 rounded-full text-red-600 mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Study Course Unavailable</h2>
        <p className="text-gray-500 max-w-sm mt-1 mb-6">{error || "Course not found."}</p>
        <Link href="/">
          <Button>Go to IntelliPrep Home</Button>
        </Link>
      </div>
    );
  }

  const quizScore = Object.entries(quizAnswers).filter(([i, ans]) => ans === quiz[i]?.correctAnswer).length;
  const isQuizDone = quiz.length > 0 && quizIndex === quiz.length - 1 && quizAnswers[quizIndex] !== undefined;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Public Top Navbar */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              IntelliPrep
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Shared Deck
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareClick}
              className="text-xs flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
            <Link href="/create">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Create Your Own
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Course Content */}
      <main className="max-w-5xl mx-auto px-4 pt-8 space-y-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0">
              {layout?.emoji || "📚"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-blue-200 font-medium mb-1">
                <span>{course.courseType || "General Study"}</span>
                <span>•</span>
                <span>{course.difficulty || "Easy"} Level</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                {layout?.course_title || course.topic}
              </h1>
              {layout?.course_summary && (
                <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed max-w-3xl">
                  {layout.course_summary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Study Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-2 overflow-x-auto text-sm font-semibold">
          <button
            onClick={() => setActiveTab("notes")}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "notes"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Chapter Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "flashcards"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            Flashcards ({flashcards.length})
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "quiz"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Practice Quiz ({quiz.length})
          </button>
        </div>

        {/* Tab 1: Chapter Notes */}
        {activeTab === "notes" && (
          <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
            {notes.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No notes available for this course.</div>
            ) : (
              <div>
                {/* Chapter select bar */}
                <div className="bg-gray-50 border-b p-3 flex items-center justify-between text-xs font-medium text-gray-600">
                  <span className="font-bold text-gray-900">
                    Chapter {currentChapter + 1} of {notes.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentChapter(c => Math.max(0, c - 1))}
                      disabled={currentChapter === 0}
                      className="text-xs h-7"
                    >
                      ← Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentChapter(c => Math.min(notes.length - 1, c + 1))}
                      disabled={currentChapter === notes.length - 1}
                      className="text-xs h-7"
                    >
                      Next →
                    </Button>
                  </div>
                </div>

                {/* Rendered HTML Notes */}
                <div className="p-6 sm:p-10">
                  <div
                    className="
                      prose prose-base max-w-none
                      prose-headings:font-bold prose-headings:text-gray-900
                      prose-h2:text-2xl prose-h2:mt-0 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-100
                      prose-h3:text-lg prose-h3:text-blue-700 prose-h3:mt-6 prose-h3:mb-2
                      prose-p:text-gray-600 prose-p:leading-relaxed
                      prose-ul:space-y-1.5
                      prose-li:text-gray-600 prose-li:leading-relaxed
                      prose-strong:text-gray-800 prose-strong:font-semibold
                      prose-code:bg-gray-100 prose-code:text-blue-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:overflow-x-auto
                    "
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(notes[currentChapter]?.notes || ""),
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Flashcards */}
        {activeTab === "flashcards" && (
          <div className="space-y-6">
            {flashcards.length === 0 ? (
              <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
                No flashcards available in this course.
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-500 font-semibold mb-4">
                  Card {cardIndex + 1} of {flashcards.length}
                </div>

                {/* Flip Card Container */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsFlipped(f => !f)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setIsFlipped(f => !f);
                    }
                  }}
                  aria-label={isFlipped ? "Flashcard answer, press Enter or Space to flip back" : "Flashcard question, press Enter or Space to reveal answer"}
                  className="w-full max-w-md min-h-[260px] sm:min-h-[290px] cursor-pointer select-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div
                    className={`relative w-full h-full min-h-[260px] sm:min-h-[290px] rounded-2xl shadow-md border p-6 sm:p-8 flex flex-col items-center justify-between text-center transition-all duration-300 ${
                      isFlipped ? "bg-white border-blue-200" : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                    }`}
                  >
                    <span className={`text-xs uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full ${isFlipped ? "bg-blue-50 text-blue-600" : "bg-white/10 text-blue-200"}`}>
                      {isFlipped ? "Answer" : "Question"}
                    </span>
                    <p className={`text-base sm:text-lg md:text-xl font-semibold leading-relaxed my-4 overflow-y-auto max-h-[160px] w-full ${isFlipped ? "text-gray-800" : "text-white"}`}>
                      {isFlipped ? flashcards[cardIndex]?.back : flashcards[cardIndex]?.front}
                    </p>
                    <span className={`text-xs ${isFlipped ? "text-gray-400" : "text-blue-200/80"}`}>
                      Tap or press Enter to flip
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => { setCardIndex(i => Math.max(0, i - 1)); setIsFlipped(false); }}
                    disabled={cardIndex === 0}
                  >
                    ← Previous
                  </Button>
                  <Button
                    onClick={() => { setCardIndex(i => Math.min(flashcards.length - 1, i + 1)); setIsFlipped(false); }}
                    disabled={cardIndex === flashcards.length - 1}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Practice Quiz */}
        {activeTab === "quiz" && (
          <div className="space-y-6">
            {quiz.length === 0 ? (
              <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
                No quiz questions generated for this course.
              </div>
            ) : !isQuizDone ? (
              <div className="bg-white rounded-2xl border shadow-xs p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
                <div className="flex justify-between items-center text-xs text-gray-500 font-semibold border-b pb-3">
                  <span>Question {quizIndex + 1} of {quiz.length}</span>
                  <span>{Math.round(((quizIndex + (quizAnswers[quizIndex] ? 1 : 0)) / quiz.length) * 100)}%</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                  {quiz[quizIndex]?.question || quiz[quizIndex]?.questionText}
                </h3>

                {/* Options list */}
                <div className="space-y-3">
                  {(quiz[quizIndex]?.options || []).map((option, optIdx) => {
                    const isSelected = quizAnswers[quizIndex] === option;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, [quizIndex]: option }))}
                        className={`w-full text-left p-4 rounded-xl text-sm font-medium border transition-all ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-900 shadow-xs"
                            : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setQuizIndex(i => Math.max(0, i - 1))}
                    disabled={quizIndex === 0}
                  >
                    ← Previous
                  </Button>
                  {quizIndex < quiz.length - 1 ? (
                    <Button
                      onClick={() => setQuizIndex(i => i + 1)}
                      disabled={quizAnswers[quizIndex] === undefined}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Next →
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border shadow-sm p-8 text-center max-w-md mx-auto space-y-4">
                <h3 className="text-2xl font-extrabold text-gray-900">Quiz Completed!</h3>
                <div className="text-4xl font-extrabold text-blue-600 my-3">
                  {quizScore} / {quiz.length}
                </div>
                <p className="text-sm text-gray-600">
                  Accuracy: <span className="font-bold">{Math.round((quizScore / quiz.length) * 100)}%</span>
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { setQuizIndex(0); setQuizAnswers({}); }}
                    className="flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> Try Again
                  </Button>
                  <Link href="/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Create Your Own
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

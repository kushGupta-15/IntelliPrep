"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, HelpCircle, Trophy, RotateCcw, History, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import QuizCardItem from "./_components/QuizCardItem";

function Quiz() {
  const { courseId } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState([]);
  const [stepCount, setStepCount] = useState(0);
  const [answers, setAnswers] = useState({}); // { [index]: userAnswer }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Historical stats
  const [attempts, setAttempts] = useState([]);
  const [bestScore, setBestScore] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const attemptSavedRef = useRef(false);

  const fetchAttempts = async () => {
    try {
      const res = await axios.get(`/api/quiz/attempt?courseId=${courseId}`);
      if (res.data?.attempts) {
        setAttempts(res.data.attempts);
        setBestScore(res.data.bestScore);
      }
    } catch (e) {
      console.warn("Could not fetch quiz attempts:", e);
    }
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.post("/api/study-type", { courseId, studyType: 'Quiz' });

        let questions = [];
        const content = res.data?.content;
        if (content) {
          const parsed = typeof content === 'string' ? JSON.parse(content) : content;
          questions = parsed?.questions ?? (Array.isArray(parsed) ? parsed : []);
        } else if (res.data?.result?.quiz) {
          const q = res.data.result.quiz;
          questions = q?.questions ?? (Array.isArray(q) ? q : []);
        }

        if (questions.length > 0) {
          setQuiz(questions);
          fetchAttempts();
        } else {
          setError("No quiz questions available. Please generate a quiz first from the course page.");
        }
      } catch (e) {
        setError("Failed to load quiz. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [courseId]);

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [stepCount]: answer }));
  };

  const isFinished = quiz.length > 0 && stepCount === quiz.length - 1 && answers[stepCount] !== undefined;
  const currentScore = Object.entries(answers).filter(([i, ans]) => ans === quiz[i]?.correctAnswer).length;

  // Automatically save attempt on completion
  useEffect(() => {
    if (isFinished && !attemptSavedRef.current && quiz.length > 0) {
      attemptSavedRef.current = true;
      const saveAttempt = async () => {
        try {
          await axios.post("/api/quiz/attempt", {
            courseId,
            score: currentScore,
            totalQuestions: quiz.length,
            answers,
          });
          fetchAttempts();
        } catch (saveErr) {
          console.error("Failed to save quiz attempt:", saveErr);
        }
      };
      saveAttempt();
    }
  }, [isFinished, currentScore, quiz.length, courseId, answers]);

  const handleRestart = () => {
    setStepCount(0);
    setAnswers({});
    setShowReview(false);
    attemptSavedRef.current = false;
  };

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
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">Quiz</h1>
              <p className="text-xs text-gray-400 mt-0.5">Test your knowledge & track retention</p>
            </div>
          </div>
          {bestScore !== null && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Best: {bestScore}/{quiz.length}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Loading quiz...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-16 bg-white rounded-2xl border shadow-sm p-8">
            <HelpCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">{error}</p>
            <Button onClick={() => router.push(`/courses/${courseId}`)} variant="outline" className="mt-4">
              Back to Course
            </Button>
          </div>
        )}

        {/* Quiz Flow */}
        {!loading && !error && quiz.length > 0 && !isFinished && (
          <>
            {/* Progress indicators */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-2">
                <span>Question {stepCount + 1} of {quiz.length}</span>
                <span>{Math.round(((stepCount + (answers[stepCount] ? 1 : 0)) / quiz.length) * 100)}% Completed</span>
              </div>
              <div className="flex gap-1">
                {quiz.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                      i < stepCount ? 'bg-purple-400'
                      : i === stepCount ? 'bg-purple-600'
                      : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question card */}
            <QuizCardItem
              key={stepCount}
              quiz={quiz[stepCount]}
              userSelectedOption={handleAnswer}
            />

            {/* Feedback + navigation */}
            {answers[stepCount] !== undefined && (
              <div className="mt-4 space-y-4">
                {/* Feedback banner */}
                {answers[stepCount] === quiz[stepCount]?.correctAnswer ? (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-lg">✓</span>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Correct!</p>
                      <p className="text-green-600 text-sm">Well done, keep it up.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                    <div className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-lg">✗</span>
                    </div>
                    <div>
                      <p className="font-semibold text-red-800">Incorrect</p>
                      <p className="text-red-600 text-sm">
                        Correct answer: <span className="font-semibold">{quiz[stepCount]?.correctAnswer}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Nav buttons */}
                <div className="flex justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStepCount(s => Math.max(0, s - 1))}
                    disabled={stepCount === 0}
                  >
                    ← Previous
                  </Button>
                  {stepCount < quiz.length - 1 ? (
                    <Button
                      onClick={() => setStepCount(s => s + 1)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Next →
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}

        {/* Results & Retention Analytics */}
        {!loading && !error && isFinished && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-purple-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Quiz Complete!</h3>
              <p className="text-gray-500 mb-4">Score saved to your learning history</p>

              <div className="inline-flex items-baseline gap-1 bg-white rounded-2xl px-8 py-4 shadow-sm border mb-4">
                <span className="text-5xl font-extrabold text-purple-600">{currentScore}</span>
                <span className="text-2xl text-gray-400 font-medium">/ {quiz.length}</span>
              </div>

              <div className="text-sm text-gray-600 mb-6">
                Accuracy: <span className="font-bold text-purple-700">{Math.round((currentScore / quiz.length) * 100)}%</span>
                {bestScore !== null && (
                  <span className="ml-4 text-gray-500">
                    (Personal Best: {bestScore}/{quiz.length})
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleRestart} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => setShowReview(r => !r)}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showReview ? "Hide Review" : "Review All Answers"}
                </Button>
                <Button onClick={() => router.push(`/courses/${courseId}`)} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Back to Course
                </Button>
              </div>
            </div>

            {/* Answer Breakdown & Review */}
            {showReview && (
              <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
                <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <span>Question-by-Question Review</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-semibold">
                    {currentScore}/{quiz.length} Correct
                  </span>
                </h4>

                <div className="space-y-4">
                  {quiz.map((q, idx) => {
                    const userAns = answers[idx];
                    const isCorrect = userAns === q.correctAnswer;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          isCorrect ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="font-semibold text-gray-900 text-sm">
                            {idx + 1}. {q.question || q.questionText}
                          </p>
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                              <Check className="w-3 h-3" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full shrink-0">
                              <X className="w-3 h-3" /> Missed
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-3">
                          <div className={`p-2 rounded-lg border ${isCorrect ? 'bg-green-100/60 border-green-300 text-green-900' : 'bg-red-100/60 border-red-300 text-red-900'}`}>
                            <span className="font-semibold">Your choice: </span>
                            {userAns || "No answer selected"}
                          </div>
                          {!isCorrect && (
                            <div className="p-2 rounded-lg border bg-green-100/60 border-green-300 text-green-900">
                              <span className="font-semibold">Correct answer: </span>
                              {q.correctAnswer}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Historical attempts list */}
            {attempts.length > 0 && (
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-500" />
                  Past Attempts History ({attempts.length})
                </h4>
                <div className="divide-y divide-gray-100 text-sm">
                  {attempts.map((att) => (
                    <div key={att.id} className="py-2.5 flex items-center justify-between">
                      <div className="text-gray-600 text-xs">
                        {new Date(att.createdAt || att.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">
                          {att.score} / {att.totalQuestions}
                        </span>
                        <span className="text-xs text-purple-600 font-medium">
                          {Math.round((att.score / att.totalQuestions) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;

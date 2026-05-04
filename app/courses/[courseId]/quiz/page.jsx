"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, HelpCircle, Trophy, RotateCcw } from 'lucide-react';
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

  const isFinished = stepCount === quiz.length - 1 && answers[stepCount] !== undefined;
  const score = Object.entries(answers).filter(([i, ans]) => ans === quiz[i]?.correctAnswer).length;

  const handleRestart = () => {
    setStepCount(0);
    setAnswers({});
  };

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
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">Quiz</h1>
              <p className="text-xs text-gray-400 mt-0.5">Test your knowledge</p>
            </div>
          </div>
          {quiz.length > 0 && (
            <span className="ml-auto text-sm text-gray-400 font-medium">
              {stepCount + 1} / {quiz.length}
            </span>
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

        {/* Quiz */}
        {!loading && !error && quiz.length > 0 && (
          <>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex gap-1">
                {quiz.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
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
              key={stepCount} // remount on question change to reset internal state
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
                    onClick={() => setStepCount(s => s - 1)}
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

            {/* Final score */}
            {isFinished && (
              <div className="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Quiz Complete!</h3>
                <p className="text-gray-500 mb-4">Here's how you did</p>
                <div className="inline-flex items-baseline gap-1 bg-white rounded-2xl px-8 py-4 shadow-sm border mb-6">
                  <span className="text-5xl font-extrabold text-purple-600">{score}</span>
                  <span className="text-2xl text-gray-400 font-medium">/ {quiz.length}</span>
                </div>
                <p className="text-gray-600 mb-6">
                  {score === quiz.length ? '🎉 Perfect score!'
                    : score >= quiz.length * 0.7 ? '👍 Great job!'
                    : score >= quiz.length * 0.4 ? '📚 Keep studying!'
                    : '💪 Don\'t give up, try again!'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleRestart} variant="outline" className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button onClick={() => router.push(`/courses/${courseId}`)} className="bg-purple-600 hover:bg-purple-700 text-white">
                    Back to Course
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Quiz;

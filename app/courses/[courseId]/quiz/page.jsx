"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import StepProgress from "../_components/StepProgress";
import QuizCardItem from "./_components/QuizCardItem";

function Quiz() {
  const { courseId } = useParams();
  const router = useRouter();
  const [quizData, setQuizData] = useState();
  const [quiz, setQuiz] = useState();
  const [stepCount, setStepCount] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleBackToCourse = () => {
    router.push(`/courses/${courseId}`);
  };

  const GetQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post("/api/study-type", {
        courseId: courseId,
        studyType: 'Quiz',
      });

      console.log("Full quiz API response:", res.data);
      
      setQuizData(res.data);
      
      let quizQuestions = [];
      
      if (res.data.content) {
        let content = res.data.content;
        if (typeof content === 'string') {
          content = JSON.parse(content);
        }
        
        if (content.questions && Array.isArray(content.questions)) {
          quizQuestions = content.questions;
        } else if (Array.isArray(content)) {
          quizQuestions = content;
        }
      } else if (res.data.result && res.data.result.quiz) {
        let quizContent = res.data.result.quiz;
        if (quizContent.questions && Array.isArray(quizContent.questions)) {
          quizQuestions = quizContent.questions;
        } else if (Array.isArray(quizContent)) {
          quizQuestions = quizContent;
        }
      }
      
      console.log("Processed quiz questions:", quizQuestions);
      
      if (Array.isArray(quizQuestions) && quizQuestions.length > 0) {
        setQuiz(quizQuestions);
      } else {
        setQuiz([]);
        setError("No quiz questions available. Please generate a quiz first.");
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setError("Failed to load quiz. Please try again.");
      setQuiz([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    GetQuiz();
  }, []);

  useEffect(() => {
    console.log("quiz", quiz);
  }, [quiz]);

  const checkAnswer = (userAnswer, currentQuestion) => {
    setIsCorrectAnswer(currentQuestion.correctAnswer);
    if (userAnswer === currentQuestion?.correctAnswer) {
      setCorrectAnswers(true);
      return;
    }
    setCorrectAnswers(false);
  };

  useEffect(() => {
    setCorrectAnswers(null);
    setIsCorrectAnswer(null);
  }, [stepCount]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          onClick={handleBackToCourse}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Button>
        <h2 className="font-bold text-2xl sm:text-3xl">Quiz</h2>
      </div>

      {loading && (
        <div className="flex items-center justify-center mt-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quiz...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center mt-10">
          <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={GetQuiz}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (!quiz || quiz.length === 0) && (
        <div className="flex items-center justify-center mt-10">
          <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">No quiz questions available.</p>
            <p className="text-sm text-gray-500 mt-2">Please generate a quiz first from the course page.</p>
          </div>
        </div>
      )}

      {!loading && !error && quiz && quiz.length > 0 && (
        <>
          <StepProgress
            data={quiz}
            stepCount={stepCount}
            setStepCount={(v) => setStepCount(v)}
          />

          <div className="mt-6">
            {quiz[stepCount] && (
              <QuizCardItem
                quiz={quiz[stepCount]}
                userSelectedOption={(v) => checkAnswer(v, quiz[stepCount])}
              />
            )}
          </div>

          {correctAnswers === false && (
            <div className="mt-6 border p-4 border-red-700 bg-red-100 rounded-lg text-sm sm:text-base">
              <h2 className="font-bold text-red-600">Incorrect</h2>
              <p>
                Correct answer is:{' '}
                <span className="font-semibold">{isCorrectAnswer}</span>
              </p>
            </div>
          )}

          {correctAnswers === true && (
            <div className="mt-6 border p-4 border-green-700 bg-green-100 rounded-lg text-sm sm:text-base">
              <h2 className="font-bold text-green-600">Correct</h2>
              <p>Your answer is correct!</p>
            </div>
          )}

          {/* Final responsive button section */}
          <div className="mt-10 flex flex-wrap justify-between gap-4">
            {stepCount > 0 && (
              <button
                onClick={() => setStepCount(stepCount - 1)}
                className="w-full sm:w-auto px-6 py-2 text-sm sm:text-base bg-gray-200 hover:bg-gray-300 rounded-lg transition-all"
              >
                ← Previous
              </button>
            )}

            {stepCount < quiz.length - 1 && correctAnswers !== null && (
              <button
                onClick={() => setStepCount(stepCount + 1)}
                className="w-full sm:w-auto px-6 py-2 text-sm sm:text-base bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all"
              >
                Next →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Quiz;

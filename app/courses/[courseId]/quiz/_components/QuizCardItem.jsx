"use client";
import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function QuizCardItem({ quiz, userSelectedOption }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSelect = (option) => {
    if (selectedOption) return; // lock after first pick
    setSelectedOption(option);
    userSelectedOption(option);
  };

  const getOptionStyle = (option) => {
    if (!selectedOption) {
      return 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer';
    }
    if (option === quiz.correctAnswer) {
      return 'border-green-500 bg-green-50 text-green-800';
    }
    if (option === selectedOption && option !== quiz.correctAnswer) {
      return 'border-red-400 bg-red-50 text-red-800';
    }
    return 'border-gray-200 bg-gray-50 text-gray-400 cursor-default';
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Question */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-6 sm:px-8 sm:py-8">
        <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-3">Question</p>
        <h2 className="text-white text-lg sm:text-xl md:text-2xl font-semibold leading-snug">
          {quiz.questionText}
        </h2>
      </div>

      {/* Options */}
      <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quiz.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option)}
            disabled={!!selectedOption}
            className={`
              flex items-center gap-3 w-full text-left
              border-2 rounded-xl px-4 py-3.5
              transition-all duration-150 font-medium text-sm sm:text-base
              ${getOptionStyle(option)}
            `}
          >
            {/* Label badge */}
            <span className={`
              shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${!selectedOption ? 'bg-gray-100 text-gray-500'
                : option === quiz.correctAnswer ? 'bg-green-500 text-white'
                : option === selectedOption ? 'bg-red-400 text-white'
                : 'bg-gray-100 text-gray-400'}
            `}>
              {OPTION_LABELS[index] ?? index + 1}
            </span>
            <span className="flex-1">{option}</span>
            {/* Icon after selection */}
            {selectedOption && option === quiz.correctAnswer && (
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            )}
            {selectedOption && option === selectedOption && option !== quiz.correctAnswer && (
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuizCardItem;

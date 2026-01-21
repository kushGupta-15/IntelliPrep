"use client";
import React, { useState } from 'react';

function QuizCardItem({ quiz, userSelectedOption }) {
  const [selectedOption, setSelectedOption] = useState();

  return (
    <div className="mt-10 p-4 sm:p-6">
      <h2 className="font-medium text-xl sm:text-2xl md:text-3xl text-center break-words">
        {quiz.questionText}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {quiz.options.map((option, index) => (
          <div
            key={index}
            className={`w-full bg-gray-200 rounded-full p-3 text-center text-base sm:text-lg py-4 cursor-pointer transition-colors duration-200 ${
              selectedOption == option && 'bg-primary text-white'
            } hover:bg-gray-300`}
            onClick={() => {
              setSelectedOption(option);
              userSelectedOption(option);
            }}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuizCardItem;

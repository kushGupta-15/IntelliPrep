"use client";

import React from 'react';
import ReactCardFlip from 'react-card-flip';

function FlashcardItem({ isFlipped, handleClick, front, back }) {
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="w-full max-w-[540px] px-2 flex justify-center">
      <div className="w-full">
        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal" flipSpeedBackToFront={0.5} flipSpeedFrontToBack={0.5}>
          {/* Front */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-label="Flashcard question. Press Space or Enter to reveal answer."
            className="
              w-full min-h-[250px] sm:min-h-[290px] md:min-h-[320px]
              bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600
              rounded-2xl shadow-md hover:shadow-xl
              flex flex-col items-center justify-between
              p-6 sm:p-8 text-center cursor-pointer select-none
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
            "
          >
            <span className="text-blue-200 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
              Question
            </span>
            <p className="text-white text-base sm:text-lg md:text-xl font-semibold leading-relaxed my-4 overflow-y-auto max-h-[180px] w-full">
              {front}
            </p>
            <span className="text-blue-200/80 text-xs font-medium">
              Tap or press Enter to reveal answer
            </span>
          </div>

          {/* Back */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-label="Flashcard answer. Press Space or Enter to flip back."
            className="
              w-full min-h-[250px] sm:min-h-[290px] md:min-h-[320px]
              bg-white border-2 border-blue-100
              rounded-2xl shadow-md hover:shadow-xl
              flex flex-col items-center justify-between
              p-6 sm:p-8 text-center cursor-pointer select-none
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
            "
          >
            <span className="text-blue-600 text-xs font-bold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
              Answer
            </span>
            <p className="text-gray-800 text-sm sm:text-base md:text-lg leading-relaxed my-4 overflow-y-auto max-h-[180px] w-full">
              {back}
            </p>
            <span className="text-gray-400 text-xs font-medium">
              Tap or press Enter to flip back
            </span>
          </div>
        </ReactCardFlip>
      </div>
    </div>
  );
}

export default FlashcardItem;

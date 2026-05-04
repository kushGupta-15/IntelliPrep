"use client";

import React from 'react';
import ReactCardFlip from 'react-card-flip';

function FlashcardItem({ isFlipped, handleClick, front, back }) {
  return (
    <div className="w-full flex justify-center px-2">
      <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal" flipSpeedBackToFront={0.5} flipSpeedFrontToBack={0.5}>
        {/* Front */}
        <div
          onClick={handleClick}
          className="
            w-[300px] sm:w-[380px] md:w-[480px]
            h-[220px] sm:h-[260px] md:h-[300px]
            bg-gradient-to-br from-blue-600 to-blue-500
            rounded-2xl shadow-lg cursor-pointer
            flex flex-col items-center justify-center
            p-6 sm:p-8 text-center
            select-none
            hover:shadow-xl transition-shadow duration-200
          "
        >
          <span className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-4">Question</span>
          <p className="text-white text-lg sm:text-xl md:text-2xl font-semibold leading-snug">
            {front}
          </p>
          <span className="text-blue-200 text-xs mt-6">Tap to reveal answer</span>
        </div>

        {/* Back */}
        <div
          onClick={handleClick}
          className="
            w-[300px] sm:w-[380px] md:w-[480px]
            h-[220px] sm:h-[260px] md:h-[300px]
            bg-white border-2 border-blue-100
            rounded-2xl shadow-lg cursor-pointer
            flex flex-col items-center justify-center
            p-6 sm:p-8 text-center
            select-none
            hover:shadow-xl transition-shadow duration-200
          "
        >
          <span className="text-blue-500 text-xs font-semibold uppercase tracking-widest mb-4">Answer</span>
          <p className="text-gray-800 text-base sm:text-lg md:text-xl leading-relaxed">
            {back}
          </p>
          <span className="text-gray-400 text-xs mt-6">Tap to flip back</span>
        </div>
      </ReactCardFlip>
    </div>
  );
}

export default FlashcardItem;

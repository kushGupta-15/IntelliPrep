"use client";

import React from 'react';
import ReactCardFlip from 'react-card-flip';
import { motion } from 'framer-motion';

function FlashcardItem({ isFlipped, handleClick, front, back }) {
  const cardClasses = "relative group w-[280px] sm:w-[320px] md:w-[400px] h-[200px] sm:h-[250px] md:h-[300px] rounded-2xl shadow-lg transition-shadow duration-300 hover:shadow-xl";
  const contentClasses = "absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-2xl transition-all duration-300";

  return (
    <div className="perspective-1000">
      <ReactCardFlip isFlipped={isFlipped} flipDirection="vertical">
        {/* Front of card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`${cardClasses} bg-gradient-to-br from-primary/90 to-primary cursor-pointer`}
          onClick={handleClick}
        >
          <div className={`${contentClasses} text-primary-foreground`}>
            <div className="max-w-full overflow-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold leading-tight">
                {front}
              </h2>
            </div>
            <div className="absolute bottom-4 text-xs text-primary-foreground/70">
              Click to flip
            </div>
          </div>
        </motion.div>

        {/* Back of card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`${cardClasses} bg-card border-2 border-primary/10 cursor-pointer`}
          onClick={handleClick}
        >
          <div className={`${contentClasses} text-foreground`}>
            <div className="max-w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <p className="text-base sm:text-lg md:text-xl">
                {back}
              </p>
            </div>
            <div className="absolute bottom-4 text-xs text-muted-foreground">
              Click to flip back
            </div>
          </div>
        </motion.div>
      </ReactCardFlip>
    </div>
  );
}

export default FlashcardItem;
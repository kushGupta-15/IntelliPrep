"use client"
import React from 'react'
import { Button } from "../../../../components/ui/button";

function StepProgress({ stepCount = 0, setStepCount, data = [] }) {
  return (
    <div className="flex gap-3 sm:gap-5 items-center w-full">
      {stepCount !== 0 && (
        <Button
          variant="outline"
          onClick={() => setStepCount?.(stepCount - 1)}
          size="sm"
          className="shrink-0"
        >
          Previous
        </Button>
      )}

      <div className="flex-1 flex gap-1.5 items-center">
        {data.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-2 rounded-full transition-colors ${
              index < stepCount ? "bg-blue-600" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {stepCount < data.length - 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStepCount?.(stepCount + 1)}
          className="shrink-0"
        >
          Next
        </Button>
      )}
    </div>
  );
}

export default StepProgress;

"use client"

import React from 'react'
import Image from 'next/image'
import { useState } from 'react'

function SelectOption({selectedStudyType}) {
    const [selected,setSelected] = useState('');
    const options = [
        {
            name : 'Exam',
            icon : '/exam_1.png'
        },{
            name : 'Job Interview',
            icon : '/job.png'
        },{
            name : 'Practice',
            icon : '/practice.png'
        },{
            name : 'Coding Prep',
            icon : '/code.png'
        },{
            name : 'Other',
            icon : '/knowledge.png'
        }
    ]
  return (
    <div className="w-full">
      <h3 className="text-center text-sm sm:text-base font-semibold text-gray-700 mb-1">
        What are you preparing for?
      </h3>
      <p className="text-center text-xs text-gray-400 mb-6">
        Select a category to tailor your course content
      </p>

      <div
        role="radiogroup"
        aria-label="Study type options"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4"
      >
        {options.map((op) => {
          const isSelected = op.name === selected;
          return (
            <button
              type="button"
              key={op.name}
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                setSelected(op.name);
                selectedStudyType(op.name);
              }}
              className={`
                flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2
                transition-all duration-200 cursor-pointer text-center select-none min-h-[120px]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${isSelected
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm text-blue-900 font-semibold'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50/80 text-gray-700'
                }
              `}
            >
              <div className="w-12 h-12 flex items-center justify-center mb-2">
                <Image src={op.icon} alt={op.name} width={44} height={44} className="object-contain" />
              </div>
              <span className="text-xs sm:text-sm leading-tight">{op.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SelectOption

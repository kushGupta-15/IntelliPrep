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
    <div>
      <h2 className='text-center mb-2 text-lg'>For Which you want to create your personal study material</h2>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mt-6'>
            {options.map((op)=>(
                <div
                  key={op.name} 
                  className={`flex flex-col items-center justify-center border rounded-xl hover:border-primary hover:border-3 cursor-pointer ${op?.name === selected && 'border-primary' }`}
                  onClick={()=>{setSelected(op.name) ; selectedStudyType(op.name)} }
                >
                    <Image src={op.icon} alt={op.name} width={50} height={50}/>
                    <h2 className='text-sm mt-3 '>{op.name}</h2>
                </div>
            ))} 
        </div>
    </div>
  )
}

export default SelectOption

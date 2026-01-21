"use client"

import { Textarea } from '../../../components/ui/textarea'
import React from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "../../../components/ui/select"

function TopicInput({setTopic,setDifficultyLevel}) {
  return (
    <div className='mt-10 w-full flex flex-col'>
      <h2>Enter topic or paste the content for which you want to generate study material</h2>
      <Textarea placeholder="Start writing here" className="mt-4" onChange={(event)=>setTopic(event.target.value)}/>
      <h2 className='mt-5 mb-3 '>Select the difficulty Level</h2>
      <Select onValueChange={(value)=>setDifficultyLevel(value )}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Difficulty Level" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Difficulty Level</SelectLabel>
          <SelectItem value="Easy">Easy</SelectItem>
          <SelectItem value="Moderate">Moderate</SelectItem>
          <SelectItem value="Hard">Hard</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
    </div>
  )
}

export default TopicInput

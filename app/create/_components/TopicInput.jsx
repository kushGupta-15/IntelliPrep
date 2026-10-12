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

function TopicInput({ setTopic, setDifficultyLevel }) {
  return (
    <div className="w-full flex flex-col space-y-5">
      <div>
        <label htmlFor="course-topic-input" className="block text-sm sm:text-base font-semibold text-gray-800 mb-1.5">
          Enter topic, syllabus, or paste text you want to learn:
        </label>
        <p className="text-xs text-gray-500 mb-2.5">
          Be as detailed as you like (e.g. "React Server Components and Suspense", "Operating Systems Concurrency")
        </p>
        <Textarea
          id="course-topic-input"
          placeholder="e.g. Introduction to Machine Learning algorithms: regression, decision trees, and neural networks..."
          rows={5}
          className="w-full p-3.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm leading-relaxed"
          onChange={(event) => setTopic(event.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-1.5">
          Select target difficulty level:
        </label>
        <Select onValueChange={(value) => setDifficultyLevel(value)}>
          <SelectTrigger className="w-full h-11 rounded-xl border-gray-200 bg-white">
            <SelectValue placeholder="Choose difficulty (e.g. Moderate)" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectGroup>
              <SelectLabel>Difficulty</SelectLabel>
              <SelectItem value="Easy">🟢 Easy — Fundamental concepts & high-level summaries</SelectItem>
              <SelectItem value="Moderate">🟡 Moderate — In-depth explanations with real examples</SelectItem>
              <SelectItem value="Hard">🔴 Hard — Rigorous deep-dive with edge cases & technical nuance</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default TopicInput

"use client"

import React from 'react'
import WelcomeBanner from './_components/WelcomeBanner'
import CourseList from './_components/CourseList'
import { Toaster } from 'react-hot-toast';

function Dashboard() {
  return (
    <div className=''>
      <WelcomeBanner/>
      <CourseList/>
      <Toaster/>
    </div>
  )
}

export default Dashboard

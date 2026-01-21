"use client"
import React, { useState,useEffect } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios';
// import DashboardHeader from '@/app/dashboard/_components/DashboardHeader';
import CourseIntroCard from './_components/CourseIntroCard';
import StudyMaterialSection from './_components/StudyMaterialSection';
import ChapterList from './_components/ChapterList';

function Courses() {
    const {courseId} = useParams();
    const [course,setCourse] = useState();
    
    const GetCourse = async ()=>{
        const coursget = await axios.get('/api/courses?courseId='+courseId);
        setCourse(coursget.data.result);
    }

    useEffect(()=>{
        GetCourse();
    },[])

  return (
    <div>
      <div className=''>
        <CourseIntroCard course={course}/>
        {/*study material card here  */}
        <StudyMaterialSection courseId={courseId} course={course}/>
        <ChapterList course={course}/>
      </div>
    </div>
  )
}

export default Courses

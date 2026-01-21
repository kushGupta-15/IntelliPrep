"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { Progress } from '../../../components/ui/progress'
import { Button } from '../../../components/ui/button'
import { RefreshCcw, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

function CourseCard({course, onCourseDeleted}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  let courseLayout = course?.courseLayout;
  if (typeof courseLayout === 'string') {
    try {
      courseLayout = JSON.parse(courseLayout);
    } catch (error) {
      console.error("Error parsing courseLayout in CourseCard:", error);
      courseLayout = {};
    }
  }

  const courseTitle = courseLayout?.course_title || course?.topic || 'Untitled Course';
  const courseSummary = courseLayout?.course_summary || 'No description available';

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (course?.status === "Generating") {
      toast.error("Cannot delete course while it's still generating. Please wait for it to complete.");
      return;
    }
    
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.delete('/api/courses/delete', {
        data: { courseId: course.courseId }
      });

      if (response.data.success) {
        toast.success(`Course "${courseTitle}" deleted successfully`);
        if (onCourseDeleted) {
          onCourseDeleted(course.courseId);
        }
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className='border rounded-lg shadow-lg p-5 hover:shadow-2xl transition-shadow relative'>
        {/* Delete Button */}
        <div className="absolute top-3 right-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className={`p-2 ${
              course?.status === "Generating" 
                ? "text-gray-300 cursor-not-allowed" 
                : "text-gray-400 hover:text-red-500 hover:bg-red-50"
            }`}
            disabled={isDeleting || course?.status === "Generating"}
            title={course?.status === "Generating" ? "Cannot delete while generating" : "Delete course"}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div>
            <div className='flex justify-between items-center'>
                <Image src={'/knowledge.png'} alt='others' width={50} height={50}/>
            </div>
            <h2 className='mt-3 font-medium text-lg pr-8'>{courseTitle}</h2>
            <p className='text-sm line-clamp-2 text-gray-500 mt-2'>{courseSummary}</p>
            <div className='mt-3'>
            <Progress value={30}/>
            </div>
            <div className='mt-3 flex justify-end  '>
                {course?.status=="Generating" ? <h2 className='text-[12px] p-1 px-2 rounded-full bg-gray-400 text-white flex gap-2 items-center text-sm'> 
                    <RefreshCcw className='w-5 h-5 animate-spin' />
                    Generating... </h2> : <Link href={`/courses/${course.courseId}`}><Button>View</Button></Link>}
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold">Delete Course</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "<strong>{courseTitle}</strong>"? 
                This will permanently remove the course and all its content including notes, flashcards, and quizzes.
              </p>
              
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex items-center gap-2"
                >
                  {isDeleting && <RefreshCcw className="w-4 h-4 animate-spin" />}
                  Delete Course
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default CourseCard

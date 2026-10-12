"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { Progress } from '../../../components/ui/progress'
import { Button } from '../../../components/ui/button'
import { RefreshCcw, Trash2, AlertTriangle, Square } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

function CourseCard({ course, onCourseDeleted, onCourseUpdated }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

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
  const isGenerating = course?.status === "Generating";
  const isCancelled = course?.status === "Cancelled";

  // ── Stop / Cancel generation ──────────────────────────────────────────────
  const handleStopClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowStopConfirm(true);
  };

  const handleStopConfirm = async () => {
    setIsStopping(true);
    try {
      const response = await axios.post('/api/courses/cancel', {
        courseId: course.courseId,
      });

      if (response.data.success) {
        toast.success(`Generation stopped for "${courseTitle}"`);
        // Notify parent to refresh the list so status updates immediately
        if (onCourseUpdated) onCourseUpdated();
      }
    } catch (error) {
      console.error("Error stopping course generation:", error);
      const msg = error?.response?.data?.error || "Failed to stop generation. Please try again.";
      toast.error(msg);
    } finally {
      setIsStopping(false);
      setShowStopConfirm(false);
    }
  };

  const handleStopCancel = () => setShowStopConfirm(false);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.delete('/api/courses/delete', {
        data: { courseId: course.courseId },
      });

      if (response.data.success) {
        toast((t) => (
          <span className="flex items-center justify-between gap-3 text-sm">
            <span>Course moved to trash</span>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await axios.delete('/api/courses/delete', {
                    data: { courseId: course.courseId, action: 'restore' }
                  });
                  toast.success(`Course "${courseTitle}" restored!`);
                  if (onCourseUpdated) onCourseUpdated();
                } catch (_) {
                  toast.error("Failed to restore course");
                }
              }}
              className="text-xs bg-indigo-600 text-white font-semibold px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
            >
              Undo
            </button>
          </span>
        ), { duration: 6000 });

        if (onCourseDeleted) onCourseDeleted(course.courseId);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error(error?.response?.data?.error || "Failed to delete course. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => setShowDeleteConfirm(false);

  return (
    <div className="bg-white border rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 p-5 sm:p-6 relative flex flex-col justify-between group">
      {/* Top-right action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        {/* Stop button — only while generating */}
        {isGenerating && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStopClick}
            disabled={isStopping}
            title="Stop generation"
            aria-label="Stop course generation"
            className="h-8 w-8 p-0 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
          >
            {isStopping
              ? <RefreshCcw className="w-4 h-4 animate-spin" />
              : <Square className="w-3.5 h-3.5 fill-current" />
            }
          </Button>
        )}

        {/* Delete button — hidden while generating, visible otherwise */}
        {!isGenerating && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            title="Delete course"
            aria-label="Delete course"
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center p-2.5">
            <Image src="/knowledge.png" alt="Course icon" width={36} height={36} className="object-contain" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {course?.courseType && (
              <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {course.courseType}
              </span>
            )}
            {course?.difficulty && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                course.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                course.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {course.difficulty}
              </span>
            )}
          </div>
        </div>

        <h3 className="mt-3.5 font-bold text-base sm:text-lg text-gray-900 pr-8 leading-snug line-clamp-1">
          {courseTitle}
        </h3>
        <p className="text-xs sm:text-sm line-clamp-2 text-gray-500 mt-1.5 leading-relaxed">
          {courseSummary}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
        {/* Status indicator */}
        <div>
          {isGenerating && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 font-medium">
              <RefreshCcw className="w-3 h-3 animate-spin text-blue-600" />
              Generating...
            </span>
          )}
          {isCancelled && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1 font-medium">
              <Square className="w-2.5 h-2.5 fill-current" />
              Cancelled
            </span>
          )}
          {!isGenerating && !isCancelled && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              ✓ Ready
            </span>
          )}
        </div>

        {/* Action Button */}
        {!isGenerating && !isCancelled && (
          <Link href={`/courses/${course.courseId}`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 h-8 rounded-lg shadow-2xs">
              View Course →
            </Button>
          </Link>
        )}
      </div>

      {/* ── Stop Confirmation Modal ─────────────────────────────────────────── */}
      {showStopConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Square className="w-6 h-6 text-orange-500 fill-current" />
              <h3 className="text-lg font-semibold">Stop Generation?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to stop generating{' '}
              <strong>"{courseTitle}"</strong>?
              <br />
              <span className="text-sm text-gray-500 mt-1 block">
                Any chapters already generated will be discarded. You can delete the course afterwards.
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleStopCancel}
                disabled={isStopping}
              >
                Keep Generating
              </Button>
              <Button
                onClick={handleStopConfirm}
                disabled={isStopping}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isStopping && <RefreshCcw className="w-4 h-4 animate-spin" />}
                Stop Generation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Delete Course</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              <strong>"{courseTitle}"</strong>?{' '}
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

"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Calendar, BookOpen, Trophy, Settings, Edit3, Save, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';

function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [courseStats, setCourseStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    generatingCourses: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      setEditedName(user.fullName || '');
      setImageError(false); 
      fetchCourseStats();
    }
  }, [isLoaded, user]);

  const fetchCourseStats = async () => {
    try {
      setLoading(true);
      const result = await axios.post("/api/courses", {
        createdBy: user.primaryEmailAddress.emailAddress,
      });

      const courses = result.data.result || [];
      const stats = {
        totalCourses: courses.length,
        completedCourses: courses.filter(course => course.status === 'Ready').length,
        generatingCourses: courses.filter(course => course.status === 'Generating').length
      };

      setCourseStats(stats);
    } catch (error) {
      console.error("Error fetching course stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleEditName = () => {
    setIsEditing(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const nameParts = editedName.trim().split(' ');
      await user.update({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || ''
      });
      toast.success('Name updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditedName(user.fullName || '');
    setIsEditing(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button 
            onClick={handleBackToDashboard}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {user.imageUrl && !imageError ? (
                  <Image
                    src={user.imageUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    priority
                  />
                ) : (
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gray-50 border rounded px-3 py-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveName} className="p-2">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit} className="p-2">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {user.fullName || 'User'}
                    </h1>
                    <Button size="sm" variant="ghost" onClick={handleEditName} className="p-2">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              <div className="space-y-2 text-gray-600">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.primaryEmailAddress?.emailAddress}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {loading ? '...' : courseStats.totalCourses}
            </h3>
            <p className="text-gray-600">Total Courses</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {loading ? '...' : courseStats.completedCourses}
            </h3>
            <p className="text-gray-600">Completed</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {loading ? '...' : courseStats.generatingCourses}
            </h3>
            <p className="text-gray-600">In Progress</p>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {user.firstName || 'Not provided'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {user.lastName || 'Not provided'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {user.primaryEmailAddress?.emailAddress}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account ID
              </label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg font-mono text-sm">
                {user.id}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Sign In
              </label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'Never'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            View My Courses
          </Button>
          
          <Button 
            onClick={() => router.push('/create')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Create New Course
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
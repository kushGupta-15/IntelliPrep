"use client";

import React from 'react';

function ProfileLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

export default ProfileLayout;
"use client"

import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios';

function Provider({children}) {
  const {user} = useUser();
  console.log("user from the provider", user);

  const CheckIsNewUser = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      return;
    }

    try {
      const resp = await axios.post('/api/create-user', { user });
      console.log('create-user response', resp.data);
    } catch (error) {
      console.error('Error creating user:', error.response?.data || error.message);
    }
  }

  useEffect(()=>{
    user&&CheckIsNewUser();
    console.log("user,",user);
  },[user])

  
  return (
    <div>
      {children}
    </div>
  )
}

export default Provider

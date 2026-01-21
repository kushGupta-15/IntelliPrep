"use client"

import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import {eq} from 'drizzle-orm';
import axios from 'axios';
import db from '../configs/db';
import { USER_TABLE } from "../configs/schema";


function Provider({children}) {
  const {user} =  useUser();
  console.log("user from the provider",user);

  const CheckIsNewUser = async ()=>{
    const result = await db.select().from(USER_TABLE).where(eq(USER_TABLE.email,user?.primaryEmailAddress?.emailAddress));

    
    if(result.length===0){
     const userResponse =  await db.insert(USER_TABLE).values({
        name : user?.fullName,
        email : user?.primaryEmailAddress?.emailAddress,
      }).returning({id : USER_TABLE.id})
      console.log("userResponse",userResponse);

    }
    const resp = await axios.post('/api/create-user',{user:user}
     )

    console.log(resp.data)
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

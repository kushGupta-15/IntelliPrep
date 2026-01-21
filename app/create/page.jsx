"use client"
import React, { use } from 'react'
import SelectOption from './_components/SelectOption';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import TopicInput from './_components/TopicInput';
import { v4 as uuidv4} from 'uuid';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
// import { toast } from 'sonner';
import toast from 'react-hot-toast';

function Create() {
    const [step,setStep] = useState(0);
    const [formData,setFormData] = useState([]);
    const {user} = useUser();
    const [loading,setLoading] = useState(false);
    const router = useRouter();

    const handleUserInput = (fieldName,fieldValue)=>{
        setFormData(prev=>({
            ...prev,
            [fieldName] : fieldValue
        }))

        console.log("formdata",formData)
    }

    const notify = ()=> toast.success("Course created successfully! It will appear on your dashboard shortly.");

    const GenerateCourseOutline = async ()=>{
        setLoading(true);
        const courseId = uuidv4();
        try {
          const result = await axios.post('/api/generate-course-outline',{
              courseId: courseId,
              ...formData,
              createdBy:user?.primaryEmailAddress?.emailAddress
          });
          router.replace('/dashboard');
          notify();
          console.log(result.data.result.resp);
        } catch (err) { 
          const status = err?.response?.status; 
          if (status === 429) { 
            toast.error("Gemini quota exceeded. Please wait a bit or check billing/limits, then try again."); // FIX:
          } else { 
            toast.error(err?.response?.data?.details || err?.message || "Failed to generate course outline"); // FIX:
          } 
        } finally {
          setLoading(false);
        } 
    }
  return (
    <div className='flex flex-col items-center p-5 md:px-24 lg:px-36  mt-20'>
      <h2 className='font-bold text-4xl text-primary'>Start Building Your Personal Study Material</h2>
      <p className='text-gray-500 text-lg'>Fill all details in order to generate study material for your next project</p>


      <div className='mt-10'>
       {step===0 ? <SelectOption selectedStudyType={(value)=> handleUserInput('studyType',value)}/> : <TopicInput setTopic={(value)=>handleUserInput('topic',value)} setDifficultyLevel={(value)=> handleUserInput('difficultyLevel',value)}/>}
      </div>

      <div className={`flex justify-between w-full mt-36 ${step===0 ?'justify-center' : null} `}>
         { step!==0 ? <Button onClick={()=>{
            step > 0 ?  setStep(step-1) : null
         }}variant="outline">Previous</Button> : '-'}
        { step==0 ? <Button onClick={()=>{
            setStep(step+1);
        }}>Next</Button> : <Button onClick={GenerateCourseOutline} disabled={loading}>{loading ? <Loader className="animate-spin"/> : 'Generate'}</Button>}
      </div>
    </div>
  )
}

export default Create

"use client";

import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, CheckCircle, Edit3, Save, X, Eye, Volume2, VolumeX, Printer, Pause, Play } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import toast from 'react-hot-toast';
import AiTutorDrawer from './_components/AiTutorDrawer';

function ViewNotes() {
  const { courseId } = useParams();
  const [notes, setNotes] = useState([]);
  const [stepCount, setStepCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Inline Note Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [previewTab, setPreviewTab] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Audio / TTS state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const utteranceRef = useRef(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setIsLoading(true);
        const result = await axios.post("/api/study-type", {
          courseId,
          studyType: 'notes',
        });
        setNotes(result.data || []);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, [courseId]);

  // Clean up audio speech synthesis on unmount or chapter change
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
    setIsEditing(false);
    setPreviewTab(false);
  }, [stepCount]);

  const toggleAudioNarration = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Speech synthesis is not supported on your browser.");
      return;
    }

    // If currently paused, resume
    if (isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      setIsPlayingAudio(true);
      return;
    }

    // If playing, pause
    if (isPlayingAudio) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
      setIsPlayingAudio(false);
      return;
    }

    // Otherwise, start from beginning of current chapter notes
    window.speechSynthesis.cancel();
    const rawHtml = notes[stepCount]?.notes || "";
    // Cleanly strip HTML tags for smooth audio narration
    const textToSpeak = rawHtml
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!textToSpeak) {
      toast.error("No text available to narrate.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
  };

  const stopAudio = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
  };

  const handleRateChange = (newRate) => {
    setPlaybackRate(newRate);
    if (isPlayingAudio || isPausedAudio) {
      stopAudio();
      toast.success(`Speed set to ${newRate}x. Press Play to listen.`);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleStartEditing = () => {
    stopAudio();
    setEditedContent(notes[stepCount]?.notes || "");
    setIsEditing(true);
    setPreviewTab(false);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setPreviewTab(false);
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const chapterId = notes[stepCount]?.chapterId ?? stepCount;
      const res = await axios.post("/api/courses/notes/update", {
        courseId,
        chapterId,
        notes: editedContent,
      });

      if (res.data?.success) {
        toast.success("Notes saved successfully!");
        setNotes(prev => {
          const updated = [...prev];
          updated[stepCount] = { ...updated[stepCount], notes: editedContent };
          return updated;
        });
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update notes:", err);
      toast.error(err?.response?.data?.error || "Failed to save notes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Loading your notes...</p>
        </div>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border max-w-sm">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No notes available yet.</p>
          <p className="text-sm text-gray-400 mt-1">Notes are generated with the course.</p>
          <Button onClick={() => router.back()} variant="outline" className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const isLast = stepCount === notes.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:p-0">
      {/* Top bar - Hidden when printing */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {/* Chapter dots */}
          <div className="flex items-center gap-1.5 flex-1 justify-center overflow-x-auto py-1">
            {notes.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepCount(i)}
                className={`shrink-0 rounded-full transition-all duration-200 ${
                  i === stepCount
                    ? 'w-6 h-2.5 bg-blue-600'
                    : i < stepCount
                    ? 'w-2.5 h-2.5 bg-blue-300'
                    : 'w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300'
                }`}
                title={`Chapter ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPdf}
              title="Print or Save as PDF"
              className="text-xs flex items-center gap-1 text-gray-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
            <span className="text-xs text-gray-400 font-medium ml-1">
              {stepCount + 1} / {notes.length}
            </span>
          </div>
        </div>
      </div>

      {/* Audio Narration Bar - Hidden when printing */}
      <div className="bg-blue-50/80 border-b border-blue-100 py-2 px-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-medium">
            <Volume2 className="w-4 h-4 text-blue-600" />
            <span>AI Audio Reader:</span>
            <span className="text-blue-600 font-bold truncate max-w-[200px] sm:max-w-xs">
              Chapter {stepCount + 1}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudioNarration}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3 h-3" /> Pause
                </>
              ) : isPausedAudio ? (
                <>
                  <Play className="w-3 h-3" /> Resume
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" /> Listen
                </>
              )}
            </button>
            {(isPlayingAudio || isPausedAudio) && (
              <button
                onClick={stopAudio}
                className="p-1 rounded-full hover:bg-blue-200 text-blue-800 transition-colors"
                title="Stop audio"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 text-gray-500 pl-2">
              <span className="text-[10px]">Speed:</span>
              {[1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    playbackRate === rate ? 'bg-blue-200 text-blue-900' : 'hover:bg-blue-100 text-blue-700'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden print:border-none print:shadow-none">
          {/* Chapter header strip */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                Chapter {stepCount + 1}
              </span>
            </div>
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartEditing}
                className="text-white hover:bg-white/20 text-xs flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Note
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTab(p => !p)}
                  className="text-white hover:bg-white/20 text-xs flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> {previewTab ? "Edit Code" : "Live Preview"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                  className="text-white hover:bg-white/20 text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="bg-white text-blue-700 hover:bg-white/90 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" /> {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>

          {/* Notes content / editor */}
          <div className="px-6 py-8 md:px-10 md:py-10 print:p-0">
            {isEditing && !previewTab ? (
              <div className="space-y-3 print:hidden">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Edit your notes (HTML or plain text supported):</span>
                  <span>Sanitized with DOMPurify on save</span>
                </div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={16}
                  className="w-full p-4 font-mono text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
                  placeholder="Enter or modify your study notes here..."
                />
              </div>
            ) : (
              <div
                className="
                  prose prose-base max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900
                  prose-h2:text-2xl prose-h2:mt-0 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-100
                  prose-h3:text-lg prose-h3:text-blue-700 prose-h3:mt-6 prose-h3:mb-2
                  prose-p:text-gray-600 prose-p:leading-relaxed
                  prose-ul:space-y-1.5
                  prose-li:text-gray-600 prose-li:leading-relaxed
                  prose-strong:text-gray-800 prose-strong:font-semibold
                  prose-code:bg-gray-100 prose-code:text-blue-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:overflow-x-auto
                "
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    isEditing ? editedContent : (notes[stepCount]?.notes || '')
                  ),
                }}
              />
            )}
          </div>
        </div>

        {/* Navigation - Hidden when printing */}
        <div className="flex items-center justify-between mt-6 gap-4 print:hidden">
          <Button
            variant="outline"
            onClick={() => setStepCount(s => Math.max(0, s - 1))}
            disabled={stepCount === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {isLast ? (
            <Button
              onClick={() => setStepCount(0)}
              variant="outline"
              className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <CheckCircle className="h-4 w-4" />
              Review from start
            </Button>
          ) : (
            <Button
              onClick={() => setStepCount(s => s + 1)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Completion banner */}
        {isLast && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center print:hidden">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-900 mb-1">All chapters completed!</h3>
            <p className="text-green-700 text-sm mb-4">Great work making it through all the material.</p>
            <Button onClick={() => router.back()} className="bg-green-600 hover:bg-green-700 text-white">
              Back to Course
            </Button>
          </div>
        )}
      </div>

      {/* Grounded In-Context AI Academic Tutor Drawer */}
      <AiTutorDrawer
        courseId={courseId}
        chapterTitle={`Chapter ${stepCount + 1}`}
        contextNotes={notes[stepCount]?.notes}
      />
    </div>
  );
}

export default ViewNotes;

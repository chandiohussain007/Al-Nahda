'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface AudioRecorderProps {
  enrollmentId: string;
  onUploaded?: () => void;
}

export function AudioRecorder({ enrollmentId, onUploaded }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setUploaded(false);
    setDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Record in highly compressed lightweight WebM / Opus voice format (24-32kbps)
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 32000 }
        : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setError('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const uploadHomework = async () => {
    if (!audioBlob) return;
    setUploading(true);
    setError(null);

    try {
      // 1. Get presigned upload URL from backend
      const presignedRes = await api.post('/api/audio/presigned-upload', {
        enrollmentId,
        contentType: audioBlob.type || 'audio/webm',
      });

      const { uploadUrl, objectKey, mock } = presignedRes.data;

      // 2. Direct upload client-to-R2 (Bypasses Render server memory and bandwidth)
      if (!mock) {
        await fetch(uploadUrl, {
          method: 'PUT',
          body: audioBlob,
          headers: {
            'Content-Type': audioBlob.type || 'audio/webm',
          },
        });
      }

      // 3. Confirm submission in database
      await api.post('/api/audio/confirm', {
        enrollmentId,
        r2ObjectKey: objectKey,
        durationSec: duration,
      });

      setUploaded(true);
      onUploaded?.();
    } catch (err: unknown) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-6 rounded-2xl border border-gold/30 bg-surface dark:bg-slate-900 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-serif font-bold text-primary dark:text-gold text-base">
            Voice Homework Recitation (Sabaq)
          </h4>
          <p className="text-xs text-slate-500">
            Recorded in 32kbps Opus audio straight to Cloudflare R2 ($0 server bandwidth).
          </p>
        </div>
        <div className="text-sm font-mono font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-primary dark:text-gold">
          {formatTime(duration)}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {!recording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow transition-all"
          >
            <Mic className="w-4 h-4" />
            <span>{audioBlob ? 'Record Again' : 'Record Sabaq Recitation'}</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow animate-pulse"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Stop Recording</span>
          </button>
        )}

        {audioUrl && !recording && (
          <audio controls src={audioUrl} className="h-10 flex-1 max-w-sm rounded-lg" />
        )}

        {audioBlob && !recording && !uploaded && (
          <button
            onClick={uploadHomework}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow ml-auto disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading to R2...' : 'Submit to Teacher'}</span>
          </button>
        )}

        {uploaded && (
          <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm ml-auto">
            <CheckCircle2 className="w-5 h-5" />
            <span>Homework Submitted!</span>
          </div>
        )}
      </div>
    </div>
  );
}
export default AudioRecorder;

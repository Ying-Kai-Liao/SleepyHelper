"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Download, Play, Pause } from 'lucide-react';

interface RecorderProps {
  apiKey: string;
  isRecording: boolean;
  setAudioUrl: (url: string) => void;
  onTranscriptionUpdate: (transcription: string) => void;
  onError: (error: string) => void;
  language: string;
}

const Recorder: React.FC<RecorderProps> = ({ apiKey, isRecording, setAudioUrl, onTranscriptionUpdate, onError, language }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [audioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startRecording = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
            console.log('Audio chunk received:', event.data.size, 'bytes');
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setLocalAudioUrl(url);
          setAudioUrl(url);
          console.log('Recording stopped, audio blob created');
          sendFullAudio(audioBlob);
        };

        mediaRecorderRef.current.start();
        console.log('Recording started');
      } catch (error) {
        console.error('Error starting recording:', error);
        onError('無法開始錄音。請檢查您的麥克風權限。');
      }
    };

    const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        console.log('Recording stopped');
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };

    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }

    return () => {
      stopRecording();
    };
  }, [isRecording, setAudioUrl, onError]);

  const sendFullAudio = async (audioBlob: Blob) => {
    console.log('Sending full audio for transcription');
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('language', language);

    try {
      console.log('Sending request to transcribe API');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Transcription response received:', data);
      if (data.transcription) {
        onTranscriptionUpdate(data.transcription);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Unknown error occurred');
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      onError(`轉錄音頻時出錯: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = 'recording.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div>
      {audioUrl && (
        <div className="mt-4 flex space-x-2">
          <Button onClick={handlePlayPause}>
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? '暫停' : '播放'}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            下載
          </Button>
        </div>
      )}
      <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPlaying(false)} />
    </div>
  );
};

export default Recorder;
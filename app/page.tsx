// Home.tsx
"use client";

import { useContext, useEffect } from 'react';
import Recorder from '@/components/Recorder';
import Transcription from '@/components/Transcription';
import AudioVisualizer from '@/components/AudioVisualizer';
import AudioPlayback from '@/components/AudioPlayback';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MediaRecorderContext, MediaRecorderProvider } from '@/contexts/MediaRecorderContext';
import { Mic, StopCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { dataURLToBlob } from '@/utils/utils';

export default function Home() {
  const router = useRouter(); // Add this line

  const navigateToBuffer = () => {
    router.push("/buffer"); // Function to navigate to /buffer
  };


  return (
    <MediaRecorderProvider>
      <div className="container mx-auto p-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">即時語音轉錄</h1>
        <Settings />
        <RecorderSection />
        <AudioVisualizer />
        {/* <AudioPlayback /> */}
        <Button onClick={navigateToBuffer} className="mt-4 bg-green-500 hover:bg-green-600">
          Go to Buffer
        </Button>
      </div>
    </MediaRecorderProvider>
  );
}

// Settings Component
const Settings = () => {
  const { apiKey, setApiKey, language, setLanguage } = useContext(MediaRecorderContext)!;

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">OpenAI API 金鑰</h2>
        <input
          type="password"
          placeholder="輸入您的 OpenAI API 金鑰"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">語言選擇</h2>
        <Select onValueChange={setLanguage} defaultValue={language}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="選擇語言" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="zh">繁體中文 / 简体中文</SelectItem>
            {/* If differentiation is needed, handle it separately in the UI */}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

// RecorderSection Component
const RecorderSection = () => {
  const {
    isRecording,
    startRecording,
    stopRecording,
    transcription,
    handleError,
  } = useContext(MediaRecorderContext)!;

  const handleStartRecording = () => {
    startRecording();
    if (!isRecording) {
      toast.success('開始錄音');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    toast.success('停止錄音');
  };

  const { setTranscription, setAudioUrl } = useContext(MediaRecorderContext)!;

  useEffect(() => {
    const savedTranscription = localStorage.getItem('transcription');
    if (savedTranscription) {
      setTranscription(savedTranscription);
    }
  }, []);

  useEffect(() => {
    const savedAudioData = localStorage.getItem('audioData');
    if (savedAudioData) {
      const wavBlob = dataURLToBlob(savedAudioData);
      const audioUrl = URL.createObjectURL(wavBlob);
      setAudioUrl(audioUrl);
    }
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">錄音機</h2>
      <div className="flex justify-center space-x-4 mb-6">
        {!isRecording ? (
          <Button onClick={handleStartRecording} className="bg-blue-500 hover:bg-blue-600">
            <Mic className="w-6 h-6 mr-2" />
            開始錄音
          </Button>
        ) : (
          <Button onClick={handleStopRecording} className="bg-red-500 hover:bg-red-600">
            <StopCircle className="w-6 h-6 mr-2" />
            停止錄音
          </Button>
        )}
      </div>
      <Recorder onError={handleError} />
      <Transcription />
    </div>
  );
};

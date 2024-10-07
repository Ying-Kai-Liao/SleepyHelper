"use client";

import { useState, useEffect } from 'react';
import { Mic, StopCircle } from 'lucide-react';
import Recorder from '@/components/Recorder';
import Transcription from '@/components/Transcription';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState('zh-TW');

  const handleStartRecording = () => {
    if (!apiKey) {
      toast.error('請在開始錄音前輸入您的 OpenAI API 金鑰。');
      return;
    }
    setIsRecording(true);
    setTranscription('');
    setAudioUrl(null);
    toast.success('開始錄音');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast.success('停止錄音');
  };

  const handleTranscriptionUpdate = (update: string) => {
    setTranscription(update);
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">即時語音轉錄</h1>
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
            <SelectItem value="zh-TW">繁體中文</SelectItem>
            <SelectItem value="zh-CN">简体中文</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
        <Recorder
          apiKey={apiKey}
          isRecording={isRecording}
          setAudioUrl={setAudioUrl}
          onTranscriptionUpdate={handleTranscriptionUpdate}
          onError={handleError}
          language={language}
        />
        <Transcription text={transcription} />
      </div>
    </div>
  );
}
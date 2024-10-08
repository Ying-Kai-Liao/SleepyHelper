// Recorder.tsx
import React, { useContext, useRef, useState } from 'react';
import { MediaRecorderContext } from '@/contexts/MediaRecorderContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download } from 'lucide-react';

interface RecorderProps {
  onError: (error: string) => void;
}

const Recorder: React.FC<RecorderProps> = ({ onError }) => {
  const {
    audioUrl,
    setAudioUrl,
    isRecording,
    language,
    apiKey,
    transcription,
    setTranscription,
  } = useContext(MediaRecorderContext)!;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const permanentChunksRef = useRef<Blob[]>([]);

  // Function to send the final recording for transcription
  const sendFinalRecording = async () => {
    if (permanentChunksRef.current.length === 0) {
      console.warn('No audio data to send');
      return;
    }

    const audioBlob = new Blob(permanentChunksRef.current, {
      type: 'audio/webm',
    });
    console.log('Sending final recording for transcription');
    const formData = new FormData();
    formData.append('file', audioBlob, 'finalRecording.webm');
    formData.append('language', language);

    try {
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
      console.log('Final transcription received:', data);
      if (data.transcription) {
        setTranscription(data.transcription);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Unknown error occurred during transcription');
      }
    } catch (error) {
      console.error('Error sending final recording:', error);
      onError(`轉錄音頻時出錯: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // Handle play/pause
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

  // Handle download
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
            {isPlaying ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isPlaying ? '暫停' : '播放'}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            下載
          </Button>
          <Button onClick={sendFinalRecording}>
            <Download className="w-4 h-4 mr-2" />
            發送最終錄音
          </Button>
        </div>
      )}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onEnded={() => setIsPlaying(false)}
        controls
      />
    </div>
  );
};

export default Recorder;

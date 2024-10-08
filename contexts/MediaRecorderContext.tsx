// MediaRecorderContext.tsx
import React, {
  createContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { toast } from "sonner";
import { openDB } from 'idb';

interface MediaRecorderContextProps {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
  transcription: string;
  setTranscription: (transcription: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  handleError: (error: string) => void;
  analyserNodeRef: React.MutableRefObject<AnalyserNode | null>;
}

export const MediaRecorderContext = createContext<
  MediaRecorderContextProps | undefined
>(undefined);

export const MediaRecorderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const recordedSamplesRef = useRef<Float32Array[]>([]);
  const allRecordedSamplesRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(44100);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");
  const [language, setLanguage] = useState("zh");
  const [apiKey, setApiKey] = useState("");

  const apiKeyRef = useRef(apiKey);
  const languageRef = useRef(language);

  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const handleError = useCallback((error: string) => {
    console.error(error);
    toast.error(error);
  }, []);

  // Function to save audio data to IndexedDB
  async function saveAudioToIndexedDB(blob: Blob) {
    try {
      const db = await openDB('MyDatabase', 1, {
        upgrade(db) {
          db.createObjectStore('audio');
        },
      });
      await db.put('audio', blob, 'recordedAudio');
      console.log('Audio data saved to IndexedDB');
    } catch (error) {
      console.error('Error saving audio to IndexedDB:', error);
    }
  }

  // Function to load audio data from IndexedDB
  async function loadAudioFromIndexedDB() {
    try {
      const db = await openDB('MyDatabase', 1, {
        upgrade(db) {
          db.createObjectStore('audio');
        },
      });
      const blob = await db.get('audio', 'recordedAudio');
      if (blob) {
        const audioUrl = URL.createObjectURL(blob);
        setAudioUrl(audioUrl);
        console.log('Audio data loaded from IndexedDB');
      } else {
        console.log('No audio data found in IndexedDB');
      }
    } catch (error) {
      console.error('Error loading audio from IndexedDB:', error);
    }
  }

  useEffect(() => {
    // Load transcription from localStorage
    const savedTranscription = localStorage.getItem('transcription');
    if (savedTranscription) {
      setTranscription(savedTranscription);
    }
  
    // Load audio data from IndexedDB
    loadAudioFromIndexedDB();
  }, []);

  // Moved mergeBuffers outside of startRecording
  function mergeBuffers(bufferArray: Float32Array[]): Float32Array {
    let length = 0;
    bufferArray.forEach((buffer) => {
      length += buffer.length;
    });

    const result = new Float32Array(length);
    let offset = 0;
    bufferArray.forEach((buffer) => {
      result.set(buffer, offset);
      offset += buffer.length;
    });

    return result;
  }

  function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    // Write the PCM samples
    floatTo16BitPCM(view, 44, samples);

    return new Blob([buffer], { type: 'audio/wav' });
  }

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, s, true);
    }
  }

  async function sendChunk(wavBlob: Blob) {
    const formData = new FormData();
    formData.append('file', wavBlob, 'audio_chunk.wav');
    formData.append('language', languageRef.current);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKeyRef.current,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Transcription received:', data);

      if (data.transcription) {
        setTranscription((prevTranscription) => {
          const newTranscription = `${prevTranscription} ${data.transcription}`;
          return newTranscription;
        });
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Unknown error occurred during transcription');
      }
    } catch (error) {
      console.error('Error sending chunk:', error);
      handleError(
        `轉錄音頻時出錯: ${error instanceof Error ? error.message : '未知錯誤'}`
      );
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      sampleRateRef.current = audioContext.sampleRate;

      // Set up AnalyserNode
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNodeRef.current = analyserNode;

      recordedSamplesRef.current = [];
      allRecordedSamplesRef.current = [];
      const recordingInterval = 5000; // 5 seconds
      let lastRecordingTime = Date.now();

      const processAudioData = (audioData: Float32Array) => {
        recordedSamplesRef.current.push(new Float32Array(audioData));
        allRecordedSamplesRef.current.push(new Float32Array(audioData));

        const currentTime = Date.now();
        if (currentTime - lastRecordingTime >= recordingInterval) {
          const allSamples = mergeBuffers(recordedSamplesRef.current);
          const wavBlob = encodeWAV(allSamples, sampleRateRef.current);

          // Send the WAV file to the transcription server
          sendChunk(wavBlob);

          // Reset for next chunk
          recordedSamplesRef.current = [];
          lastRecordingTime = currentTime;
        }
      };

      let source: MediaStreamAudioSourceNode;

      if (audioContext.audioWorklet) {
        try {
          await audioContext.audioWorklet.addModule('/recorderWorkletProcessor.js');
          console.log('AudioWorklet module loaded.');
        } catch (error) {
          console.error('Error loading AudioWorklet module:', error);
          handleError('Unable to load audio processing module.');
          return;
        }

        const recorderWorkletNode = new AudioWorkletNode(audioContext, 'recorder-worklet');
        processorRef.current = recorderWorkletNode;
        source = audioContext.createMediaStreamSource(stream);

        source.connect(analyserNode);
        analyserNode.connect(recorderWorkletNode);

        recorderWorkletNode.port.onmessage = (event) => {
          const audioData = event.data as Float32Array;
          processAudioData(audioData);
        };
      } else {
        // Fallback to ScriptProcessorNode
        source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(analyserNode);
        analyserNode.connect(processor);

        // Uncomment the next line if you want to hear your own voice
        // processor.connect(audioContext.destination);

        processor.onaudioprocess = (event) => {
          const audioData = event.inputBuffer.getChannelData(0);
          processAudioData(audioData);
        };
      }

      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      handleError('無法開始錄音。請檢查您的麥克風權限。');
    }
  };

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      if (processorRef.current instanceof AudioWorkletNode) {
        processorRef.current.port.onmessage = null;
        processorRef.current.disconnect();
      } else if (processorRef.current instanceof ScriptProcessorNode) {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      }
      processorRef.current = null;
    }
    if (analyserNodeRef.current) {
      analyserNodeRef.current.disconnect();
      analyserNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Create a Blob from the recorded samples
    if (allRecordedSamplesRef.current.length > 0) {
      const allSamples = mergeBuffers(allRecordedSamplesRef.current);
      const wavBlob = encodeWAV(allSamples, sampleRateRef.current);
      const audioUrl = URL.createObjectURL(wavBlob);
      setAudioUrl(audioUrl);

      // Save audio data to IndexedDB
      saveAudioToIndexedDB(wavBlob);

      // Clear the recorded samples
      allRecordedSamplesRef.current = [];
    }

    setIsRecording(false);
    console.log('Recording stopped');
  }, [encodeWAV]);

  return (
    <MediaRecorderContext.Provider
      value={{
        isRecording,
        startRecording,
        stopRecording,
        audioUrl,
        setAudioUrl,
        transcription,
        setTranscription,
        language,
        setLanguage,
        apiKey,
        setApiKey,
        handleError,
        analyserNodeRef,
      }}
    >
      {children}
    </MediaRecorderContext.Provider>
  );
};

// Transcription.tsx
import React, { useContext } from 'react';
import { MediaRecorderContext } from '@/contexts/MediaRecorderContext';

const Transcription: React.FC = () => {
  const { transcription } = useContext(MediaRecorderContext)!;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">轉錄結果</h2>
      <div className="bg-gray-100 p-4 rounded-md">
        <p>{transcription || '尚無轉錄結果。'}</p>
      </div>
    </div>
  );
};

export default Transcription;

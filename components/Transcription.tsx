import React from 'react';

interface TranscriptionProps {
  text: string;
}

const Transcription: React.FC<TranscriptionProps> = ({ text }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">轉錄:</h3>
      <div className="p-4 bg-gray-100 rounded-md min-h-[100px] text-gray-800">
        {text || '轉錄將在此處顯示...'}
      </div>
    </div>
  );
};

export default Transcription;
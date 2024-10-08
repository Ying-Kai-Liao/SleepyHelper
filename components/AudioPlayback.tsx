import React, { useContext } from 'react';
import { MediaRecorderContext } from '@/contexts/MediaRecorderContext';

const AudioPlayback: React.FC = () => {
  const { audioUrl } = useContext(MediaRecorderContext)!;

  if (!audioUrl) {
    return null;
  }

  return (
    <audio src={audioUrl} controls></audio>
  );
};

export default AudioPlayback;

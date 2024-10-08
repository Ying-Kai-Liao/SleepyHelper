import BufferedChunksViewer from '@/components/BufferedChunksViewer';
import React from 'react';

const Page: React.FC = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <BufferedChunksViewer />
    </div>
  );
};

export default Page;

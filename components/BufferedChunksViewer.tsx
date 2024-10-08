"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const BufferedChunksViewer: React.FC = () => {
  const [chunks, setChunks] = useState<{ key: string; dataUrl: string }[]>([]);
  const router = useRouter();
  useEffect(() => {
    // Retrieve all stored chunks from localStorage
    const storedChunks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("audio_chunk_")) {
        const dataUrl = localStorage.getItem(key);
        if (dataUrl) {
          storedChunks.push({ key, dataUrl });
        }
      }
    }
    // Sort the chunks by their index to maintain sequence
    storedChunks.sort((a, b) => {
      const indexA = parseInt(a.key.replace("audio_chunk_", ""));
      const indexB = parseInt(b.key.replace("audio_chunk_", ""));
      return indexA - indexB;
    });
    setChunks(storedChunks);
  }, []);

  const handlePlay = (dataUrl: string) => {
    console.log("Playing chunk:", dataUrl);
    const audio = new Audio(dataUrl);
    audio.play();
  };

  const handleClear = () => {
    // Remove all audio_chunk_* keys from localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("audio_chunk_")) {
        localStorage.removeItem(key);
      }
    }
    setChunks([]);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl h-screen flex flex-col justify-center items-center">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        Buffered Chunks
      </h2>
      {chunks.length === 0 ? (
        <div>
          <p>No buffered chunks found in localStorage.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Go to Home
          </button>
        </div>
      ) : (
        <div>
          <ul className="space-y-2">
            {chunks.map((chunk) => (
              <li key={chunk.key} className="flex items-center space-x-4">
                <span>{chunk.key}</span>
                <button
                  onClick={() => handlePlay(chunk.dataUrl)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                >
                  Play
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={handleClear}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Clear Chunks
          </button>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Go to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default BufferedChunksViewer;

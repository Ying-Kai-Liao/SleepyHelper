import React, { useContext, useRef, useEffect } from "react";
import { MediaRecorderContext } from "@/contexts/MediaRecorderContext";

const AudioVisualizer: React.FC = () => {
  const { isRecording, analyserNodeRef } = useContext(MediaRecorderContext)!;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isRecording || !analyserNodeRef.current) return;

    const analyserNode = analyserNodeRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    const bufferLength = analyserNode.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return; // Stop drawing when recording stops

      requestAnimationFrame(draw);

      analyserNode.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = "rgb(200, 200, 200)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "rgb(0, 0, 0)";
      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  }, [isRecording, analyserNodeRef]);

  return <canvas ref={canvasRef} width={500} height={100}></canvas>;
};

export default AudioVisualizer;

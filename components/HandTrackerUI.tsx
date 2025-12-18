
import React, { useEffect, useRef, useState } from 'react';
import { HandGesture } from '../types';

interface HandTrackerUIProps {
  onGesture: (gesture: HandGesture) => void;
  onActiveChange: (active: boolean) => void;
}

const HandTrackerUI: React.FC<HandTrackerUIProps> = ({ onGesture, onActiveChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hands: any = null;
    let camera: any = null;

    const setupMediaPipe = async () => {
      try {
        // @ts-ignore
        hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        hands.onResults((results: any) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Analyze gestures
            // Fist: Tips of fingers are close to palm bases
            const isFist = analyzeFist(landmarks);
            const isOpen = analyzeOpenHand(landmarks);
            const isGrabbing = analyzeGrabbing(landmarks);
            
            // Get hand center for positioning
            const palmBase = landmarks[0];
            const middleBase = landmarks[9];
            const posX = (palmBase.x + middleBase.x) / 2;
            const posY = (palmBase.y + middleBase.y) / 2;

            onGesture({
              isFist,
              isOpen,
              isGrabbing,
              position: { x: posX, y: posY },
              rotation: { x: 0, y: 0, z: 0 }, // Simplified
              rawLandmarks: landmarks
            });

            // Draw on visual feedback canvas
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d')!;
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              // Draw landmarks
              ctx.fillStyle = isFist ? '#EF4444' : (isOpen ? '#10B981' : '#F59E0B');
              landmarks.forEach((pt: any) => {
                ctx.beginPath();
                ctx.arc(pt.x * canvasRef.current!.width, pt.y * canvasRef.current!.height, 3, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          }
        });

        if (videoRef.current) {
          // @ts-ignore
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) await hands.send({ image: videoRef.current });
            },
            width: 320,
            height: 240,
          });
          camera.start();
          setIsLoading(false);
          onActiveChange(true);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to start camera or tracking.");
      }
    };

    setupMediaPipe();

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, []);

  // Gesture analysis helpers
  const dist = (p1: any, p2: any) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

  const analyzeFist = (lm: any) => {
    const tips = [8, 12, 16, 20]; // index, middle, ring, pinky
    const bases = [5, 9, 13, 17];
    const avgDist = tips.reduce((acc, tip, i) => acc + dist(lm[tip], lm[bases[i]]), 0) / 4;
    return avgDist < 0.12;
  };

  const analyzeOpenHand = (lm: any) => {
    const tips = [8, 12, 16, 20];
    const bases = [5, 9, 13, 17];
    const avgDist = tips.reduce((acc, tip, i) => acc + dist(lm[tip], lm[bases[i]]), 0) / 4;
    return avgDist > 0.25;
  };

  const analyzeGrabbing = (lm: any) => {
    // Thumb tip to Index tip
    return dist(lm[4], lm[8]) < 0.05;
  };

  return (
    <div className="relative w-48 h-36 bg-black/80 rounded-xl border border-yellow-500/30 overflow-hidden shadow-2xl">
      <video ref={videoRef} className="hidden" />
      <canvas 
        ref={canvasRef} 
        width={320} 
        height={240} 
        className="w-full h-full object-cover opacity-60 scale-x-[-1]" 
      />
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent animate-spin rounded-full mb-2" />
          <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-tighter">Initializing AI...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500 text-[10px] p-2 text-center">
          {error}
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded-full border border-white/10">
          <span className="text-[8px] font-bold text-white uppercase tracking-widest">Hand Cam</span>
      </div>
    </div>
  );
};

export default HandTrackerUI;

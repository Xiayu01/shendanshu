
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PhotoData, AppState, HandGesture } from './types';
import Experience from './components/Experience';
import HandTrackerUI from './components/HandTrackerUI';
import { CameraIcon, PhotoIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.CLOSED);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [gesture, setGesture] = useState<HandGesture | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos: PhotoData[] = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file)
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const onGesture = useCallback((newGesture: HandGesture) => {
    setGesture(newGesture);
    
    // State transitions based on gestures
    if (newGesture.isFist && appState !== AppState.CLOSED) {
      setAppState(AppState.CLOSED);
      setSelectedPhotoId(null);
    } else if (newGesture.isOpen && appState === AppState.CLOSED) {
      setAppState(AppState.SCATTERED);
    }
    
    // Zoom/Grab logic is handled within the 3D scene for spatial selection
  }, [appState]);

  return (
    <div className="relative w-screen h-screen bg-[#050a08] overflow-hidden">
      {/* 3D Scene */}
      <Canvas
        shadows
        camera={{ position: [0, 5, 15], fov: 45 }}
        gl={{ antialias: false, alpha: false }}
        className="w-full h-full"
      >
        <color attach="background" args={['#050a08']} />
        <Experience 
          appState={appState} 
          photos={photos} 
          gesture={gesture} 
          selectedPhotoId={selectedPhotoId}
          onPhotoSelect={setSelectedPhotoId}
          setAppState={setAppState}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        {/* Top Header */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="text-white">
            <h1 className="text-3xl font-bold tracking-tighter text-yellow-500 italic drop-shadow-lg">
              Golden Christmas <span className="text-red-500 font-light">Vision</span>
            </h1>
            <p className="text-xs text-green-400 opacity-80 uppercase tracking-widest mt-1">Gesture-Controlled 3D Experience</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-600/50 text-yellow-500 px-4 py-2 rounded-full transition-all"
            >
              <PhotoIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Add Photos</span>
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
          </div>
        </div>

        {/* Center Prompt */}
        <div className="flex flex-col items-center justify-center text-center opacity-40 group hover:opacity-100 transition-opacity">
          {appState === AppState.CLOSED && (
            <p className="text-yellow-500 text-sm animate-pulse">Open your palm to scatter the tree</p>
          )}
          {appState === AppState.SCATTERED && (
            <p className="text-yellow-500 text-sm animate-pulse">Clench your fist to rebuild</p>
          )}
        </div>

        {/* Bottom Panel */}
        <div className="flex justify-between items-end">
          <div className="pointer-events-auto">
             <HandTrackerUI onGesture={onGesture} onActiveChange={setIsCameraActive} />
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-64 text-white pointer-events-auto">
            <h3 className="text-xs font-bold text-yellow-500 mb-2 uppercase tracking-widest">Gesture Guide</h3>
            <ul className="text-xs space-y-2 opacity-80">
              <li className="flex justify-between"><span>✊ Clench Fist</span> <span className="text-green-400">Close Tree</span></li>
              <li className="flex justify-between"><span>✋ Open Palm</span> <span className="text-green-400">Scatter Tree</span></li>
              <li className="flex justify-between"><span>🤏 Pinch Index</span> <span className="text-green-400">Zoom Photo</span></li>
              <li className="flex justify-between"><span>👋 Move Hand</span> <span className="text-green-400">Rotate View</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Selected Photo Modal Overlay */}
      {selectedPhotoId && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
          <button 
            onClick={() => setSelectedPhotoId(null)}
            className="absolute top-10 right-10 text-white p-2 hover:bg-white/10 rounded-full"
          >
            <XMarkIcon className="w-10 h-10" />
          </button>
          <div className="relative max-w-[80vw] max-h-[80vh]">
            <img 
              src={photos.find(p => p.id === selectedPhotoId)?.url} 
              alt="Zoomed" 
              className="object-contain w-full h-full shadow-2xl border-4 border-yellow-500/30 rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

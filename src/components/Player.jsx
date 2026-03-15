import React, { useEffect, useRef, useState } from 'react';
import useStore from '../store/useStore';

export default function Player() {
  const currentTrack = useStore(state => state.currentTrack);
  const isPlaying = useStore(state => state.isPlaying);
  const togglePlay = useStore(state => state.togglePlay);
  
  const audioRef = useRef(null);
  
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // When current track or isPlaying changes, sync the Audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = async () => {
      try {
        if (isPlaying) {
          // If source changed, we should load first
          if (audio.paused || audio.ended) {
            await audio.play();
          }
        } else {
          audio.pause();
        }
      } catch (e) {
        console.error("Global Player Error:", e);
      }
    };

    handlePlay();
  }, [isPlaying, currentTrack]);

  // Handle source changes explicitly
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback restart error", e));
      }
    }
  }, [currentTrack?.nft_id]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const previewLimit = currentTrack?.preview_duration;

      // Enforcement: If track is a preview and limit reached
      if (previewLimit && currentTime >= previewLimit) {
        audioRef.current.pause();
        audioRef.current.currentTime = previewLimit;
        if (isPlaying) togglePlay(); // Set state to paused
      }

      setProgress(audioRef.current.currentTime);
      // If preview exists, override duration for UI
      setDuration(previewLimit || audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const previewLimit = currentTrack?.preview_duration;
    
    if (audioRef.current && duration) {
      let targetTime = percent * duration;
      // Seek Protection
      if (previewLimit && targetTime > previewLimit) targetTime = previewLimit;
      audioRef.current.currentTime = targetTime;
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isAnyModalOpen = useStore(state => state.isAnyModalOpen);

  // Do not render if no track is selected
  if (!currentTrack) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 transition-all duration-700 ${isAnyModalOpen ? 'opacity-0 scale-95 pointer-events-none translate-y-10' : 'opacity-100 scale-100'}`}>
      <audio 
        ref={audioRef} 
        src={currentTrack.ipfs_audio_hash || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"} 
        crossOrigin="anonymous"
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => {
          if (isPlaying) togglePlay();
        }}
      />
      
      <div className="bg-surface-container-high/90 backdrop-blur-xl p-4 rounded-full shadow-2xl flex items-center gap-6 border border-outline-variant/30">
        {/* Album Info */}
        <div className="flex items-center gap-3 w-64 pl-2">
          <div className="w-12 h-12 rounded-full shadow-lg relative group overflow-hidden shrink-0">
            <img className={`w-full h-full object-cover transition-transform ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} 
                 alt={currentTrack.song_title}
                 src={currentTrack.ipfs_cover_hash || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17"} />
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
            {/* Vinyl inner circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-surface-container-highest rounded-full border border-outline-variant/30"></div>
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <p className="font-headline font-bold text-sm truncate text-on-surface tracking-tight">{currentTrack.song_title}</p>
              {currentTrack.preview_duration && (
                <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-primary/20">Preview</span>
              )}
            </div>
            <p className="text-xs text-outline font-body truncate">{currentTrack.artists?.artist_name || 'Unknown Artist'}</p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-6">
            <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">shuffle</span></button>
            <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">skip_previous</span></button>
            
            <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-primary text-on-primary-fixed flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_15px_rgba(223,182,178,0.4)]">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
            </button>
            
            <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">skip_next</span></button>
            <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">repeat</span></button>
          </div>
          
          <div className="w-full flex items-center gap-3 max-w-md">
            <span className="text-[10px] font-label text-outline w-8 text-right">{formatTime(progress)}</span>
            <div
                onClick={handleSeek}
                className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden relative group cursor-pointer">
                <div className="h-full bg-primary rounded-full relative transition-all duration-100 ease-linear" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-on-surface rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
            </div>
            <span className="text-[10px] font-label text-outline w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume/Other */}
        <div className="w-64 flex items-center justify-end gap-5 pr-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm hover:text-on-surface cursor-pointer">lyrics</span>
          <span className="material-symbols-outlined text-sm hover:text-on-surface cursor-pointer">queue_music</span>
          <div className="flex items-center gap-2 w-20 relative group">
              <span className="material-symbols-outlined text-sm">volume_up</span>
              <div className="flex-1 h-1 bg-surface-container-highest rounded-full cursor-pointer">
                  <div className="h-full bg-outline w-[80%] rounded-full group-hover:bg-primary transition-colors"></div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

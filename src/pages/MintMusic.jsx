import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import { mintOnChain } from '../lib/blockchain';

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

export default function MintMusic() {
  const user = useStore((state) => state.user);
  const isInitializing = useStore((state) => state.isInitializing);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    songTitle: '',
    artistName: user?.name || '',
    price: '',
    royaltyPercent: '',
    genre: 'Syntwave',
    customGenre: '',
    audioUploaded: false,
    audioFileName: '',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=600',
    audioUrl: '',
    currency: 'HLUSD',
    previewDuration: 30, // Default 30s preview
  });

  const [isMinting, setIsMinting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isInitializing && !user) {
      navigate('/', { replace: true });
    }
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `audio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
      
    if (error) {
      alert("Error: " + error.message);
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);

    setFormData({
      ...formData,
      audioUploaded: true,
      audioFileName: file.name,
      audioUrl: publicUrl
    });
    setIsUploading(false);
  };

  const handleRegenerateArt = () => {
    const COVER_URLS = [
      "https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"
    ];
    setFormData({ ...formData, coverUrl: COVER_URLS[Math.floor(Math.random() * COVER_URLS.length)] });
  };

  const handleMint = async () => {
    if (!user) return alert("Please sign in first!");
    if (!formData.songTitle || !formData.price || !formData.audioUploaded) {
      return alert("Please fill all required fields and upload your track.");
    }
    
    setIsMinting(true);
    
    try {
      // 1. Ensure user exists in 'public.users' table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({
          user_id: user.id,
          name: user.name,
          email: user.email,
          wallet_address: user.wallet_address,
          role: 'artist'
        }, { onConflict: 'user_id' });

      if (userError) throw userError;

      // 2. Ensure user exists in 'public.artists' table with their CHOSEN ARTIST NAME
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .upsert({
          artist_id: user.id,
          artist_name: formData.artistName || user.name,
          verified: true
        }, { onConflict: 'artist_id' });

      if (artistError) throw artistError;

      // 3. ON-CHAIN MINTING (The Blockchain Step)
      // This triggers the Gas Popup in the wallet
      const bcResult = await mintOnChain(
        formData.audioUrl,
        formData.songTitle,
        formData.artistName,
        formData.royaltyPercent
      );

      if (!bcResult.success) throw new Error("On-chain minting failed");

      // 4. Now save the record to our indexing database
      const { data: insertedNft, error } = await supabase.from('nfts').insert([{
        token_id: bcResult.tokenId,
        song_title: formData.songTitle,
        artist_id: user.id,
        genre: formData.genre === 'OTHER' ? formData.customGenre : formData.genre,
        price: parseFloat(formData.price),
        currency: formData.currency,
        royalty_percent: parseInt(formData.royaltyPercent || 10),
        ipfs_audio_hash: formData.audioUrl,
        ipfs_cover_hash: formData.coverUrl,
        preview_duration: formData.previewDuration,
        chain: 'hela',
        current_owner_id: user.id,
        is_listed: true,
        tx_hash: bcResult.transactionHash
      }]).select().single();

      if (error) throw error;
      
      // Update local state so it appears in Vault immediately
      const newNft = {
        ...insertedNft,
        artists: { artist_name: formData.artistName || user.name }
      };
      
      useStore.getState().addMintedNft(newNft);

      alert(`Successfully Minted! \nTransaction: ${bcResult.transactionHash.slice(0, 10)}...`);
      navigate('/mints');
    } catch (err) {
      alert("Minting Failed: " + err.message);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <motion.div
      initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
      className="max-w-6xl mx-auto p-10 pb-32"
    >
      <header className="mb-16 flex justify-between items-end">
         <div>
            <h1 className="text-6xl font-headline font-bold text-white tracking-tighter mb-2 text-glow-hover">Creator Studio.</h1>
            <p className="text-outline font-label uppercase tracking-[0.4em] text-[10px]">Secure Asset Registration • NFTMUSIC</p>
         </div>
         <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
            <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <p className="text-[9px] font-label text-primary font-black uppercase tracking-[0.3em]">E2E Security Engine: Active</p>
         </div>
      </header>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-7 space-y-12">
           {/* Upload Section */}
           <section>
              <h2 className="text-xs font-label text-outline uppercase tracking-[0.3em] mb-6 px-2">Master Audio File</h2>
              <input type="file" id="audio-upload" className="hidden" accept="audio/*" onChange={handleFileUpload} />
              <label htmlFor="audio-upload" className="block cursor-pointer">
                 <div className={`p-10 rounded-[3rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 bg-white/5 ${formData.audioUploaded ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-white/20'}`}>
                    <span className={`material-symbols-outlined text-4xl ${formData.audioUploaded ? 'text-primary' : 'text-outline'}`}>
                       {isUploading ? 'sync' : formData.audioUploaded ? 'verified' : 'cloud_upload'}
                    </span>
                    <div className="text-center">
                       <p className="font-headline font-bold text-white font-bright">{isUploading ? 'Encrypting Stream...' : formData.audioUploaded ? formData.audioFileName : 'Upload High-Res Master'}</p>
                       <p className="text-outline text-[10px] uppercase tracking-widest mt-1">WAV, MP3 OR FLAC (MAX 100MB)</p>
                    </div>
                 </div>
              </label>
           </section>

           {/* Metadata section */}
           <section className="space-y-8">
              <h2 className="text-xs font-label text-outline uppercase tracking-[0.3em] mb-6 px-2">Asset Metadata</h2>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-label text-outline uppercase ml-2">Track Title</label>
                    <input value={formData.songTitle} onChange={e => setFormData({...formData, songTitle: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-primary transition-colors" placeholder="e.g. Genesis Echo" />
                 </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-label text-outline uppercase ml-2">Artist / Stage Name</label>
                     <input value={formData.artistName} onChange={e => setFormData({...formData, artistName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-primary transition-colors" placeholder="e.g. Kshitizgotbarss" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-label text-outline uppercase ml-2">Genre Classification</label>
                     <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-primary transition-colors appearance-none">
                        <option className="bg-black">Syntwave</option>
                        <option className="bg-black">Techno</option>
                        <option className="bg-black">Ambient</option>
                        <option className="bg-black text-primary font-bold">OTHER</option>
                     </select>
                     {formData.genre === 'OTHER' && (
                        <motion.input 
                           initial={{ opacity: 0, y: -10 }}
                           animate={{ opacity: 1, y: 0 }}
                           value={formData.customGenre} 
                           onChange={e => setFormData({...formData, customGenre: e.target.value})} 
                           className="w-full mt-3 bg-white/5 border border-primary/30 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-primary transition-all" 
                           placeholder="Type your custom genre..."
                        />
                     )}
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-label text-outline uppercase ml-2">Listing Price</label>
                    <div className="relative">
                       <input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-primary transition-colors" placeholder="0.00" />
                       <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-primary text-xs">HLUSD</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-label text-outline uppercase ml-2">Creator Royalty %</label>
                    <input value={formData.royaltyPercent} onChange={e => setFormData({...formData, royaltyPercent: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-primary transition-colors" placeholder="10" />
                 </div>
              </div>

               {/* Preview Security Slider */}
               <div className="space-y-6 pt-4">
                  <div className="flex justify-between items-center ml-2">
                     <label className="text-[10px] font-label text-outline uppercase">NFT Preview Duration (Security)</label>
                     <span className="text-primary font-bold text-xs">{formData.previewDuration} Seconds</span>
                  </div>
                  <div className="relative flex items-center gap-6 px-2">
                     <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Safe</span>
                     <input 
                        type="range" 
                        min="15" 
                        max="60" 
                        step="5"
                        value={formData.previewDuration} 
                        onChange={e => setFormData({...formData, previewDuration: parseInt(e.target.value)})}
                        className="flex-1 h-1.5 bg-white/5 rounded-full appearance-none outline-none accent-primary cursor-pointer"
                     />
                     <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Risky</span>
                  </div>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] leading-relaxed max-w-lg">
                     * This duration limits the public stream for non-holders. Your high-res master remains encrypted on Hela L2 until acquired.
                  </p>
               </div>
           </section>
        </div>

        <div className="col-span-12 lg:col-span-5">
           <div className="sticky top-32 space-y-8">
              <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-[#050505]">
                 <p className="text-[10px] font-label text-outline uppercase tracking-[0.3em] mb-6">Visual Identity</p>
                 <div className="aspect-square rounded-[2rem] overflow-hidden mb-8 border border-white/5 relative group">
                    <img src={formData.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                       <h3 className="text-2xl font-headline font-bold text-white font-bright truncate">{formData.songTitle || 'Untitled Asset'}</h3>
                       <p className="text-primary text-xs font-bold uppercase tracking-widest">@{user?.name?.toLowerCase() || 'unverified'}</p>
                    </div>
                 </div>
                 <button onClick={handleRegenerateArt} className="w-full py-4 rounded-2xl border border-white/10 text-white font-label text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    Regenerate AI Cover
                 </button>
              </div>

              <button 
                onClick={handleMint}
                disabled={isMinting || isUploading}
                className="w-full bg-white text-black font-headline font-extrabold py-5 rounded-[2rem] hover:scale-[1.02] transition-transform uppercase tracking-[0.2em] text-sm shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                {isMinting ? 'Finalizing Genesis...' : 'Initialize Mint'}
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

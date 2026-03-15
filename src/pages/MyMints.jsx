import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { getWalletBalance } from '../lib/blockchain';
import ResellModal from '../components/ResellModal';

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  in: { opacity: 1, scale: 1 },
  out: { opacity: 0, scale: 0.98 }
};

export default function MyMints() {
  const user = useStore((state) => state.user);
  const isInitializing = useStore((state) => state.isInitializing);
  const logout = useStore((state) => state.logout);
  const mintedNfts = useStore((state) => state.mintedNfts);
  const updateMintedNft = useStore((state) => state.updateMintedNft);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState('0.00');

  // Resell modal state
  const [resellTarget, setResellTarget] = useState(null);
  const [isResellOpen, setIsResellOpen] = useState(false);

  useEffect(() => {
    const fetchBalanceAndSync = async () => {
      if (!user) return;
      
      setLoading(true);
      if (user.id) {
        const bal = await getWalletBalance(user.id);
        setBalance(bal);
      }
      setLoading(false);
    };
    fetchBalanceAndSync();
  }, [user, user?.id]);

  const currentTrack = useStore(state => state.currentTrack);
  const isPlaying = useStore(state => state.isPlaying);
  const playTrack = useStore(state => state.playTrack);
  const togglePlay = useStore(state => state.togglePlay);

  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !user) {
      navigate('/', { replace: true });
    }
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  const handleResellClick = (nft) => {
    setResellTarget(nft);
    setIsResellOpen(true);
  };

  const handleResellSuccess = (updatedNft) => {
    updateMintedNft(updatedNft);
  };

  return (
    <>
    <motion.div
      initial="initial" animate="in" exit="out" variants={pageVariants}
      className="max-w-7xl mx-auto px-10 py-16 pb-32"
    >
      {/* Refined Header */}
      <header className="mb-20">
        <div className="flex justify-between items-center mb-12">
           <div>
              <h1 className="text-7xl font-headline font-extrabold text-white tracking-tighter leading-none text-glow-hover">My Mints.</h1>
              <p className="text-primary font-bold text-[10px] uppercase tracking-[0.4em] mt-3">Genesis Creations • Creator Signature: {user.id.slice(0, 16)}</p>
           </div>
           <button 
             onClick={logout}
             className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-label text-[10px] uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
           >
             <span className="material-symbols-outlined text-sm">power_settings_new</span>
             Terminate Session
           </button>
        </div>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-4 gap-6">
           <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-white/[0.02]">
              <p className="text-[9px] font-label text-outline uppercase tracking-[0.3em] mb-2 font-bold">Identity Signature</p>
              <h3 className="text-2xl font-headline font-bold text-white font-bright">@{user.name.toLowerCase()}</h3>
           </div>
           <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-white/[0.02]">
              <p className="text-[9px] font-label text-outline uppercase tracking-[0.3em] mb-2 font-bold">Total Creations</p>
              <h3 className="text-2xl font-headline font-bold text-white font-bright">{mintedNfts?.length || 0} Assets</h3>
           </div>
           <div 
             onClick={() => window.open('https://portfolio.metamask.io/buy', '_blank')}
             className="glass-panel p-8 rounded-[2rem] border border-primary/10 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all group"
           >
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-label text-primary uppercase tracking-[0.3em] mb-2 font-black">Native Balance (HLUSD)</p>
                <span className="material-symbols-outlined text-primary text-sm opacity-50 group-hover:opacity-100 transition-opacity">add_circle</span>
              </div>
              <h3 className="text-2xl font-headline font-bold text-white font-bright">
                 {parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
           </div>
           <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] flex items-center justify-center gap-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] font-label text-white uppercase tracking-[0.3em] font-black">Registry Active</p>
           </div>
        </div>
      </header>

      {/* Main Asset Gallery */}
      <section>
        <div className="flex items-center justify-between mb-12 px-2">
           <div>
              <h2 className="text-xs font-label text-outline uppercase tracking-[0.4em] font-black">Creator Portfolio</h2>
           </div>
           <div className="flex gap-4">
              <span className="text-[10px] font-label text-white/20 uppercase tracking-widest leading-none">Filter: All Originations</span>
           </div>
        </div>

        {loading ? (
           <div className="h-96 flex flex-col items-center justify-center space-y-6">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-label text-outline uppercase tracking-[0.5em] font-bold">Syncing Ledger...</p>
           </div>
        ) : mintedNfts?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {mintedNfts.map((nft) => (
              <div key={nft.nft_id} className="group glass-panel p-5 rounded-[2.5rem] border border-white/5 hover:bg-white/5 hover:border-primary/20 transition-all duration-500">
                <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 bg-black relative shadow-2xl">
                  <img src={nft.ipfs_cover_hash} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" alt={nft.song_title} />
                  
                  {/* Listed badge */}
                  {nft.is_listed && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-primary/90 text-black font-label text-[8px] font-black rounded-full uppercase tracking-tighter shadow-[0_0_15px_rgba(255,107,0,0.5)]">
                      Listed
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button 
                      onClick={(e) => {
                        e.preventDefault();
                        currentTrack?.nft_id === nft.nft_id ? togglePlay() : playTrack(nft);
                      }}
                      className="w-16 h-16 bg-white rounded-full text-black flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                     >
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {currentTrack?.nft_id === nft.nft_id && isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                     </button>
                  </div>
                </div>
                <div className="px-2 mb-4">
                  <h4 className="font-headline font-bold text-xl text-white mb-1 group-hover:text-primary transition-colors truncate">{nft.song_title}</h4>
                  <p className="text-[10px] text-outline font-label uppercase tracking-widest font-bright">
                     {nft.genre || 'Soundscape'} • ID: {nft.nft_id.toString().slice(0,8)}
                  </p>
                  <p className="text-[10px] text-white/30 font-label uppercase tracking-widest mt-1">
                     Price: <span className="text-white/60 font-black">{nft.price} {nft.currency || 'HLUSD'}</span>
                  </p>
                </div>

                {/* Resell / Re-List Button */}
                <button
                  onClick={() => handleResellClick(nft)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-[10px] font-label uppercase tracking-widest font-black transition-all duration-300 ${
                    nft.is_listed
                      ? 'bg-orange-500/20 border-primary/40 text-primary hover:bg-primary/20'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sell</span>
                  {nft.is_listed ? 'Update Listing Price' : 'List for Resale'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-24 rounded-[4rem] border border-dashed border-white/10 text-center space-y-8 bg-white/[0.01]">
             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                <span className="material-symbols-outlined text-5xl text-outline">album</span>
             </div>
             <div className="space-y-3">
                <p className="text-white font-headline text-3xl font-black uppercase tracking-tighter">No Creations Found.</p>
                <p className="text-outline text-xs uppercase tracking-[0.2em] font-bold">You haven't initialized any assets on the network yet.</p>
             </div>
             <Link to="/mint" className="inline-block px-10 py-4 bg-primary text-black rounded-full font-headline font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,107,0,0.3)]">Initialize Mint</Link>
          </div>
        )}
      </section>
    </motion.div>

    {/* Resell Modal */}
    <ResellModal
      isOpen={isResellOpen}
      onClose={() => { setIsResellOpen(false); setResellTarget(null); }}
      nft={resellTarget}
      onResellSuccess={handleResellSuccess}
    />
    </>
  );
}

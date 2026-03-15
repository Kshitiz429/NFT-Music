import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import PurchaseModal from '../components/PurchaseModal';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 }
};

// Internal Countdown Component
function Countdown({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('...');

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('LIVE');
      return;
    }

    const updateTimer = () => {
      const total = Date.parse(expiresAt) - Date.parse(new Date());
      if (total <= 0) {
        setTimeLeft('ENDED');
      } else {
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return <span>{timeLeft}</span>;
}

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [userBids, setUserBids] = useState([]);
  const user = useStore(state => state.user);
  const login = useStore(state => state.login);
  const playTrack = useStore(state => state.playTrack);
  const currentTrack = useStore(state => state.currentTrack);
  const isPlaying = useStore(state => state.isPlaying);
  const togglePlay = useStore(state => state.togglePlay);
  const ownedNfts = useStore(state => state.ownedNfts);

  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedTrackForBid, setSelectedTrackForBid] = useState(null);
  
  const [activeTab, setActiveTab] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArtist, setFilterArtist] = useState('all');

  // 1. Fetch User Bids
  useEffect(() => {
    const fetchBids = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('bids')
          .select('*')
          .or(`bidder_id.eq.${user.id},bidder_wallet.eq.${user.wallet_address}`);
        if (data) setUserBids(data.filter(b => b.status === 'active'));
      }
    };
    fetchBids();
    const interval = setInterval(fetchBids, 30000);
    return () => clearInterval(interval);
  }, [user, isBidModalOpen]);

  // 2. Fetch Marketplace NFTs
  useEffect(() => {
    const fetchNfts = async () => {
      let query = supabase.from('nfts').select(`
        *,
        artists ( artist_name, profile_image )
      `);
      
      const { data: allNfts } = await query;
      
      if (allNfts) {
        let filtered = [...allNfts];
        if (searchQuery) {
          filtered = filtered.filter(n => 
            n.song_title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            n.artists?.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (filterArtist !== 'all') {
          filtered = filtered.filter(n => n.artists?.artist_name === filterArtist);
        }
        if (activeTab === 'trending') {
          filtered = filtered.sort((a, b) => b.price - a.price).slice(0, 8);
        } else if (activeTab === 'new') {
          filtered = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
        } else if (activeTab === 'auctions') {
          filtered = filtered.filter((_, i) => i % 2 === 0);
        }
        setNfts(filtered);
      }
    };
    fetchNfts();
  }, [activeTab, searchQuery, filterArtist]);

  const handleOpenBid = (track) => {
    setSelectedTrackForBid(track);
    setIsBidModalOpen(true);
  };

  const isInitializing = useStore(state => state.isInitializing);

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center font-headline text-white/20 uppercase tracking-widest">Restoring Session...</div>;
  }

  if (!user) {
    return (
      <motion.div 
        initial="initial" animate="in" exit="out" variants={pageVariants}
        className="min-h-[80vh] flex items-center justify-center p-6 relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="w-full max-w-xl relative">
          <div className="glass-panel p-12 rounded-[4rem] border border-white/10 relative z-10 backdrop-blur-3xl bg-black/40 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
            <div className="space-y-8 text-center">
              <div className="space-y-4">
                 <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                    <span className="text-[10px] font-label text-primary font-black uppercase tracking-[0.3em]">Curation Gateway v1.1</span>
                 </div>
                 <h1 className="text-6xl font-headline font-black text-white tracking-tighter leading-none font-bright">INITIALIZE.<br/>CURATOR.</h1>
                 <p className="text-outline text-xs uppercase tracking-[0.4em] font-bold">Secure Gateway to NFTMUSIC Ledger</p>
              </div>

              <div className="pt-8 flex flex-col gap-4">
                 <Link 
                   to="/auth"
                   className="w-full py-6 bg-white text-black rounded-[2rem] font-headline font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform shadow-2xl"
                 >
                    <span className="material-symbols-outlined">identity_platform</span>
                    Start Registration
                 </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
    <motion.div
      initial="initial" animate="in" exit="out" variants={pageVariants}
      className="max-w-7xl mx-auto px-6 py-12 pb-40"
    >
      {/* Hero Section */}
      <section className="mb-20 relative h-[500px] rounded-[3rem] overflow-hidden border border-white/5 bg-black group">
        <div className="absolute inset-0 grayscale opacity-40 group-hover:opacity-60 transition-opacity duration-1000">
           <img src={nfts[0]?.ipfs_cover_hash || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=1200'} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[3s]" alt="Hero" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        
        <div className="absolute bottom-16 left-16 max-w-2xl space-y-8">
           <div className="space-y-2">
              <h1 className="text-8xl font-headline font-black text-white tracking-tighter leading-none text-glow-hover">
                {nfts[0]?.song_title || 'GENESIS ECHO.'}
              </h1>
              <p className="text-primary font-label text-sm uppercase tracking-[0.5em] font-black">
                Featured Artist: {nfts[0]?.artists?.artist_name || 'NFTMUSIC LABS'}
              </p>
           </div>
           
           <div className="flex items-center gap-6">
              <button 
                onClick={() => nfts[0] && playTrack(nfts[0])}
                className="px-10 py-4 bg-white text-black rounded-full font-headline font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Play Preview
              </button>
              <Link to={nfts[0] ? `/track/${nfts[0].nft_id}` : '/'} className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-full font-headline font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">
                View Asset
              </Link>
           </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-8 mb-12">
         <div className="flex items-center gap-4 bg-white/5 p-2 rounded-full border border-white/5">
            {['all', 'trending', 'new'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 rounded-full font-label text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-primary text-black font-black' : 'text-outline hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
         </div>
         
         <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Track, Artist or Genre..." 
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-8 text-white text-sm outline-none focus:border-primary/40 transition-all font-label tracking-widest"
            />
         </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {nfts.map((nft) => {
          const isOwned = ownedNfts.some(n => n.nft_id === nft.nft_id);
          const userBid = userBids.find(b => b.nft_id === nft.nft_id);
          
          return (
            <div key={nft.id || nft.nft_id} className="group glass-panel rounded-[2.5rem] border border-white/5 p-5 hover:bg-white/5 transition-all hover:-translate-y-2">
              <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-6 bg-black shadow-2xl">
                <img src={nft.ipfs_cover_hash} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={nft.song_title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Auction badge removed as requested */}
                
                {userBid && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-[#7BF1D8] text-black font-label text-[8px] font-black rounded-full uppercase tracking-tighter animate-pulse shadow-[0_0_15px_rgba(123,241,216,0.5)]">
                     Already In & Winning
                  </div>
                )}

                <button 
                  onClick={() => currentTrack?.nft_id === nft.nft_id ? togglePlay() : playTrack(nft)}
                  className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
                >
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {currentTrack?.nft_id === nft.nft_id && isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
              </div>

              <div className="px-1 space-y-4">
                <div>
                  <h4 className="font-headline font-bold text-xl truncate text-white">{nft.song_title}</h4>
                  <p className="text-outline text-[10px] uppercase tracking-widest font-bold">By {nft.artists?.artist_name || 'NFTMUSIC Artist'}</p>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <p className="text-[9px] text-outline uppercase tracking-widest">Pricing</p>
                    <p className="font-headline font-extrabold text-white text-lg">{nft.price} {nft.currency || 'HLUSD'}</p>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <p className="text-[9px] text-primary uppercase tracking-widest font-black">
                      Availability
                    </p>
                    <p className="text-white font-headline font-bold text-sm tracking-tighter">
                       {isOwned ? 'In Vault' : '1/1 Master'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                   {isOwned ? (
                     <Link to="/vault" className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-label text-[9px] uppercase tracking-widest text-center hover:bg-white/10 transition-colors">
                        Access in Vault
                     </Link>
                   ) : userBid ? (
                     <Link to="/bids" className="flex-1 py-3 rounded-2xl bg-[#7BF1D8]/20 border border-[#7BF1D8]/40 text-[#7BF1D8] font-label text-[9px] uppercase tracking-widest font-black text-center hover:bg-[#7BF1D8]/30 transition-colors">
                         Already In & Winning
                     </Link>
                   ) : (
                     <button 
                       onClick={() => handleOpenBid(nft)}
                       className="flex-1 py-3 rounded-2xl bg-white text-black font-label text-[9px] uppercase tracking-widest font-black hover:scale-[1.02] transition-transform"
                     >
                        Purchase Asset
                     </button>
                   )}
                   <Link to={`/track/${nft.nft_id}`} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-outline hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                   </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {nfts.length === 0 && (
        <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
           <span className="material-symbols-outlined text-6xl">search_off</span>
           <p className="font-label text-xs uppercase tracking-widest">No assets found matching your criteria</p>
        </div>
      )}
    </motion.div>

    <PurchaseModal
      isOpen={isBidModalOpen}
      onClose={() => setIsBidModalOpen(false)}
      track={selectedTrackForBid}
    />
    </>
  );
}

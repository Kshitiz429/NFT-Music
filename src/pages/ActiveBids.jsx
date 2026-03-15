import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import BidModal from '../components/BidModal';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
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
      try {
        const targetDate = new Date(expiresAt);
        const now = new Date();
        const total = targetDate.getTime() - now.getTime();

        if (total <= 0) {
          setTimeLeft('EXPIRED');
        } else {
          const seconds = Math.floor((total / 1000) % 60);
          const minutes = Math.floor((total / 1000 / 60) % 60);
          const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
          const days = Math.floor(total / (1000 * 60 * 60 * 24));

          if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
          else setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      } catch (err) {
        setTimeLeft('...');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return <span>{timeLeft}</span>;
}

export default function ActiveBids() {
  const user = useStore(state => state.user);
  const isInitializing = useStore(state => state.isInitializing);
  const [myBids, setMyBids] = useState([]);
  const [availableAuctions, setAvailableAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch My Bids
      if (user?.id) {
        const { data: myBidsData } = await supabase
          .from('bids')
          .select('*, nfts!nft_id(*)')
          .eq('bidder_id', user.id)
          .order('created_at', { ascending: false });
        setMyBids(myBidsData || []);
      }

      // 2. Fetch Available Auctions (Marketplace)
      const { data: allNfts } = await supabase
        .from('nfts')
        .select('*, artists(artist_name)');

      if (allNfts) {
        // For demo: filter for "auctions" (every even track or specific tag)
        const auctions = allNfts.filter((_, i) => i % 2 === 0);
        setAvailableAuctions(auctions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh on realtime if needed
    const channel = supabase.channel('bids_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, fetchData).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, isBidModalOpen]);

  const handleOpenBid = (track) => {
    setSelectedTrack(track);
    setIsBidModalOpen(true);
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !user) {
      navigate('/', { replace: true });
    }
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  return (
    <motion.div
      initial="initial" animate="in" exit="out" variants={pageVariants}
      className="max-w-7xl mx-auto px-6 py-16 pb-40"
    >
      <header className="mb-20">
        <h1 className="text-7xl font-headline font-bold text-white mb-2 tracking-tighter">Auction House.</h1>
        <p className="text-outline font-label uppercase tracking-[0.4em] text-[10px]">Real-time Bidding & Registry Management</p>
      </header>

      {/* SECTION 1: MY ACTIVE SIGNATURES */}
      <section className="mb-24">
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-2xl font-headline font-bold text-white tracking-tight uppercase">My Active Signatures</h2>
          <div className="h-px flex-1 bg-white/5"></div>
          <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <p className="text-[9px] font-label text-primary font-black uppercase tracking-[0.2em]">{myBids.length} Active Positions</p>
          </div>
        </div>

        {myBids.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {myBids.map((bid) => (
              <div key={bid.bid_id} className="glass-panel p-8 rounded-[3rem] border border-[#7BF1D8]/20 bg-[#1B3632]/5 flex flex-col md:flex-row items-center gap-8 group">
                <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-black flex-shrink-0">
                  <img src={bid.nfts?.ipfs_cover_hash} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-headline font-bold text-white mb-1">{bid.nfts?.song_title}</h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <span className={`text-[9px] font-label uppercase tracking-widest font-black ${bid.status === 'won' ? 'text-primary' : 'text-[#7BF1D8] animate-pulse'}`}>
                      {bid.status === 'won' ? 'COLLECTION MASTER' : 'Already In & Winning'}
                    </span>
                    <span className="text-[9px] text-outline uppercase tracking-widest">
                      {bid.status === 'won' ? 'Acquired for' : 'Bid'}: {bid.amount} {bid.currency}
                    </span>
                  </div>
                </div>
                <div className="text-center md:text-right px-8 border-x border-white/5">
                  <p className="text-[9px] font-label text-primary uppercase tracking-[0.2em] mb-1">Time Left</p>
                  <p className="text-2xl font-headline font-bold text-white tracking-widest"><Countdown expiresAt={bid.expires_at} /></p>
                </div>
                <Link to={`/track/${bid.nft_id}`} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 rounded-[3rem] border border-dashed border-white/5 text-center opacity-40">
            <p className="font-label text-xs uppercase tracking-widest">No active signatures in the ledger</p>
          </div>
        )}
      </section>

      {/* SECTION 2: LIVE AUCTION FLOOR */}
      <section>
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-2xl font-headline font-bold text-white tracking-tight uppercase">Live Auction Floor</h2>
          <div className="h-px flex-1 bg-white/5"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {availableAuctions.map((nft) => {
            const hasBid = myBids.some(b => b.nft_id === nft.nft_id);
            return (
              <div key={nft.nft_id} className="glass-panel p-5 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group">
                <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-6 bg-black">
                  <img src={nft.ipfs_cover_hash} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt="Cover" />
                  {hasBid && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-[#7BF1D8] text-black font-label text-[8px] font-black rounded-full uppercase tracking-tighter shadow-xl">
                      Already In & Winning
                    </div>
                  )}
                </div>
                <div className="px-1 space-y-4">
                  <div>
                    <h4 className="font-headline font-bold text-lg truncate text-white">{nft.song_title}</h4>
                    <p className="text-outline text-[9px] uppercase tracking-widest font-bold">By {nft.artists?.artist_name || 'NFTMUSIC'}</p>
                  </div>
                  <div className="flex justify-between items-center py-4 border-t border-white/5">
                    <p className="font-headline text-white font-bold">{nft.price} {nft.currency}</p>
                    <p className="text-[10px] text-primary font-bold"><Countdown expiresAt={nft.expires_at} /></p>
                  </div>
                  <button
                    onClick={() => !hasBid && handleOpenBid(nft)}
                    disabled={hasBid}
                    className={`w-full py-3 rounded-2xl font-label text-[9px] uppercase tracking-widest font-black transition-all ${hasBid ? 'bg-[#7BF1D8]/20 text-[#7BF1D8] cursor-not-allowed border border-[#7BF1D8]/40' : 'bg-white text-black hover:scale-[1.02]'}`}
                  >
                    {hasBid ? 'Already In & Winning' : 'Enter Auction'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <BidModal mode="bid" isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} track={selectedTrack} />
    </motion.div>
  );
}

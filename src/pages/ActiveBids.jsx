import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

function Countdown({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('...');
  useEffect(() => {
    if (!expiresAt) { setTimeLeft('LIVE'); return; }
    const updateTimer = () => {
      try {
        const total = new Date(expiresAt).getTime() - Date.now();
        if (total <= 0) { setTimeLeft('EXPIRED'); return; }
        const s = Math.floor((total / 1000) % 60);
        const m = Math.floor((total / 60000) % 60);
        const h = Math.floor((total / 3600000) % 24);
        const d = Math.floor(total / 86400000);
        setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
      } catch { setTimeLeft('...'); }
    };
    updateTimer();
    const t = setInterval(updateTimer, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return <span>{timeLeft}</span>;
}

// ─── BidPlacementModal ─────────────────────────────────────────────────────────
function BidPlacementModal({ isOpen, onClose, track, onBidPlaced }) {
  const user = useStore(state => state.user);
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buyerBalance, setBuyerBalance] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && track) {
      setBidAmount(parseFloat(track.price || 0).toString());
      setIsSuccess(false);
    }
  }, [isOpen, track]);

  useEffect(() => {
    const fetch = async () => {
      if (user?.id) {
        const { data } = await supabase.from('users').select('balance').eq('user_id', user.id).single();
        if (data) setBuyerBalance(parseFloat(data.balance));
      }
    };
    if (isOpen) fetch();
  }, [isOpen, user]);

  if (!track) return null;

  const parsedBid = parseFloat(bidAmount) || 0;
  const minBid = parseFloat(track.price || 0);
  const isValid = parsedBid >= minBid;
  const canAfford = buyerBalance !== null && buyerBalance >= parsedBid;

  const handlePlace = async () => {
    if (!user) { alert('Please login.'); return; }
    if (!isValid) { alert(`Bid must be at least ${minBid} HLUSD.`); return; }
    if (!canAfford) { alert(`Insufficient funds. You have ${buyerBalance?.toFixed(2)} HLUSD.`); return; }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('bids').insert({
        nft_id: track.nft_id,
        bidder_id: user.id,
        bidder_wallet: user.wallet_address || '0x',
        amount: parsedBid,
        currency: 'HLUSD',
        status: 'active',
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString()
      });
      if (error) throw error;
      setIsSuccess(true);
      onBidPlaced?.();
    } catch (err) {
      alert('Bid failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-sm bg-[#080808] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]"
          >
            {!isSuccess ? (
              <>
                {/* Track header */}
                <div className="relative h-28 overflow-hidden">
                  <img src={track.ipfs_cover_hash} className="w-full h-full object-cover blur-sm scale-110 opacity-30" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080808]" />
                  <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-white">close</span>
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-3">
                    <img src={track.ipfs_cover_hash} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    <div>
                      <h2 className="font-headline font-extrabold text-white text-lg leading-none">{track.song_title}</h2>
                      <p className="font-label text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                        🏷️ Floor: {track.price} HLUSD &nbsp;·&nbsp; {track.artists?.artist_name || 'NFTMusic'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-7 pb-7 space-y-4 pt-2">
                  <div>
                    <label className="font-label text-[9px] uppercase tracking-[0.3em] text-white/40 block mb-2">Your Bid Amount (HLUSD)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={minBid}
                        step="0.01"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        placeholder={`Min: ${minBid}`}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-headline text-xl font-bold outline-none focus:border-primary/50 transition-colors"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-label text-[10px] text-primary font-black uppercase tracking-widest">HLUSD</span>
                    </div>
                    {!isValid && bidAmount !== '' && (
                      <p className="text-red-400 font-label text-[9px] uppercase tracking-widest mt-1">Bid must be ≥ {minBid} HLUSD</p>
                    )}
                  </div>

                  {/* Bid breakdown */}
                  <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-label text-[9px] text-white/40 uppercase tracking-widest">Bid Amount</span>
                      <span className="font-label text-[9px] text-white font-black">{parsedBid.toLocaleString()} HLUSD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-label text-[9px] text-white/40 uppercase tracking-widest">Expires In</span>
                      <span className="font-label text-[9px] text-white font-black">72 Hours</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/5">
                      <span className="font-label text-[9px] text-white/40 uppercase tracking-widest">Your Balance</span>
                      <span className={`font-label text-[9px] font-black ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                        {buyerBalance !== null ? `${buyerBalance.toLocaleString('en-US', {minimumFractionDigits: 2})} HLUSD` : '...'}
                      </span>
                    </div>
                  </div>

                  <p className="font-label text-[8px] text-white/20 uppercase tracking-widest text-center">
                    Bids are non-binding. Owner accepts or declines. Funds not locked.
                  </p>

                  <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-label text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handlePlace}
                      disabled={isSubmitting || !isValid || !canAfford || buyerBalance === null}
                      className="flex-1 py-4 rounded-2xl bg-primary text-black font-headline font-extrabold text-sm uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          Placing...
                        </span>
                      ) : 'Place Bid'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="p-12 flex flex-col items-center text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-extrabold text-white">Bid Placed!</h3>
                  <p className="font-label text-[9px] text-white/40 uppercase tracking-widest mt-1">
                    {parsedBid.toLocaleString()} HLUSD on <span className="text-primary">{track.song_title}</span>
                  </p>
                </div>
                <button onClick={onClose} className="w-full py-4 rounded-2xl bg-primary text-black font-headline font-extrabold text-sm uppercase tracking-widest">
                  Done
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main ActiveBids Page ──────────────────────────────────────────────────────
export default function ActiveBids() {
  const user = useStore(state => state.user);
  const isInitializing = useStore(state => state.isInitializing);
  const [myBids, setMyBids] = useState([]);
  const [availableNfts, setAvailableNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidModalTrack, setBidModalTrack] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch ONLY this user's bids (active, not 'won' which are purchases)
      if (user?.id) {
        const { data: myBidsData } = await supabase
          .from('bids')
          .select('*, nfts!nft_id(nft_id, song_title, ipfs_cover_hash, price, currency)')
          .eq('bidder_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        setMyBids(myBidsData || []);
      }

      // 2. All listed NFTs available to bid on
      const { data: allNfts } = await supabase
        .from('nfts')
        .select('*, artists(artist_name)')
        .eq('is_listed', true);
      setAvailableNfts(allNfts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('active_bids_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    if (!isInitializing && !user) navigate('/', { replace: true });
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  const myBidNftIds = new Set(myBids.map(b => b.nft_id));

  return (
    <motion.div
      initial="initial" animate="in" exit="out" variants={pageVariants}
      className="max-w-7xl mx-auto px-6 py-16 pb-40"
    >
      <header className="mb-20">
        <h1 className="text-7xl font-headline font-bold text-white mb-2 tracking-tighter">Auction House.</h1>
        <p className="text-outline font-label uppercase tracking-[0.4em] text-[10px]">Real-time Bidding & Registry Management</p>
      </header>

      {/* MY ACTIVE BIDS */}
      <section className="mb-24">
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-2xl font-headline font-bold text-white tracking-tight uppercase">My Active Bids</h2>
          <div className="h-px flex-1 bg-white/5" />
          <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <p className="text-[9px] font-label text-primary font-black uppercase tracking-[0.2em]">{myBids.length} Active Bids</p>
          </div>
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : myBids.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {myBids.map(bid => (
              <motion.div
                key={bid.bid_id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-7 rounded-[2.5rem] border border-primary/10 bg-primary/5 flex flex-col md:flex-row items-center gap-6 group"
              >
                <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-black flex-shrink-0 shadow-xl">
                  <img src={bid.nfts?.ipfs_cover_hash} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-headline font-bold text-white mb-1">{bid.nfts?.song_title || 'Unknown Track'}</h3>
                  <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
                    <span className="text-[9px] font-label text-primary font-black uppercase tracking-widest animate-pulse">● Active Bid</span>
                    <span className="text-[9px] text-outline uppercase tracking-widest">
                      Bid Amount: <span className="text-white font-bold">{parseFloat(bid.amount).toLocaleString()} {bid.currency}</span>
                    </span>
                  </div>
                </div>
                <div className="text-center px-6 border-x border-white/5">
                  <p className="text-[9px] font-label text-primary uppercase tracking-[0.2em] mb-1">Expires In</p>
                  <p className="text-xl font-headline font-bold text-white tracking-widest font-mono">
                    <Countdown expiresAt={bid.expires_at} />
                  </p>
                </div>
                <Link
                  to={`/track/${bid.nft_id}`}
                  className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                >
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-16 rounded-[3rem] border border-dashed border-white/5 text-center">
            <span className="material-symbols-outlined text-4xl text-white/10 block mb-4">gavel</span>
            <p className="font-label text-xs uppercase tracking-widest text-white/20">No active bids yet. Explore the auction floor below.</p>
          </div>
        )}
      </section>

      {/* LIVE AUCTION FLOOR */}
      <section>
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-2xl font-headline font-bold text-white tracking-tight uppercase">Live Auction Floor</h2>
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[9px] font-label text-outline uppercase tracking-widest">{availableNfts.length} Assets Listed</span>
        </div>

        {availableNfts.length === 0 ? (
          <div className="p-16 rounded-[3rem] border border-dashed border-white/5 text-center">
            <p className="font-label text-xs uppercase tracking-widest text-white/20">No assets currently listed on the auction floor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {availableNfts.map(nft => {
              const hasBid = myBidNftIds.has(nft.nft_id);
              return (
                <div key={nft.nft_id} className="glass-panel p-5 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group">
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-5 bg-black shadow-xl">
                    <img src={nft.ipfs_cover_hash} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" alt="Cover" />
                    {hasBid && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-primary text-black font-label text-[8px] font-black rounded-full uppercase tracking-widest shadow-xl">
                        Bid Active
                      </div>
                    )}
                  </div>
                  <div className="px-1 space-y-3">
                    <div>
                      <h4 className="font-headline font-bold text-lg truncate text-white">{nft.song_title}</h4>
                      <p className="text-outline text-[9px] uppercase tracking-widest font-bold">By {nft.artists?.artist_name || 'NFTMUSIC'}</p>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t border-white/5">
                      <div>
                        <p className="text-[8px] text-outline uppercase tracking-widest">Floor</p>
                        <p className="font-headline text-white font-bold">{parseFloat(nft.price).toLocaleString()} <span className="text-primary text-[10px]">{nft.currency || 'HLUSD'}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-outline uppercase tracking-widest">Royalty</p>
                        <p className="font-headline text-white font-bold">{nft.royalty_percent || 10}%</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => !hasBid && setBidModalTrack(nft)}
                        disabled={hasBid}
                        className={`flex-1 py-3 rounded-2xl font-label text-[9px] uppercase tracking-widest font-black transition-all ${
                          hasBid
                            ? 'bg-primary/20 text-primary cursor-not-allowed border border-primary/30'
                            : 'bg-white text-black hover:scale-[1.02]'
                        }`}
                      >
                        {hasBid ? 'Bid Active' : 'Place Bid'}
                      </button>
                      <Link
                        to={`/track/${nft.nft_id}`}
                        className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-outline hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bid Placement Modal */}
      <BidPlacementModal
        isOpen={!!bidModalTrack}
        onClose={() => setBidModalTrack(null)}
        track={bidModalTrack}
        onBidPlaced={() => { setBidModalTrack(null); fetchData(); }}
      />
    </motion.div>
  );
}

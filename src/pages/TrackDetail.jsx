import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: 10 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

export default function TrackDetail() {
  const { id } = useParams();
  const [track, setTrack] = useState(null);
  const user = useStore(state => state.user);
  const playTrack = useStore(state => state.playTrack);
  const currentTrack = useStore(state => state.currentTrack);
  const isPlaying = useStore(state => state.isPlaying);
  const togglePlay = useStore(state => state.togglePlay);

  const [displayCurrency, setDisplayCurrency] = useState('HLUSD');
  const [isMinting, setIsMinting] = useState(false);
  const [isMinted, setIsMinted] = useState(false);

  const addOwnedNft = useStore(state => state.addOwnedNft);
  const ownedNfts = useStore(state => state.ownedNfts);
  const isOwned = track && ownedNfts.some(n => n.nft_id === track.nft_id);

  const handleMint = async () => {
    if (!user) {
      alert("Please login to collect assets.");
      return;
    }

    setIsMinting(true);
    try {
      // Execute Real Balance Transfer via RPC
      // Assuming 'Collect Asset' in TrackDetail is a primary mint/sale context
      const isSecondarySale = track.current_owner_id && track.current_owner_id !== track.artist_id;
      // if track.currency !== HLUSD, ideally handle exchange rate, assuming 1 for now if not defined in TrackDetail
      const totalPrice = parseFloat(track.price);
      
      const PLATFORM_FEE_PERCENT = 3;
      const platformFee = (totalPrice * PLATFORM_FEE_PERCENT) / 100;
      const royaltyPercent = track.royalty_percent || 10;
      const artistRoyalty = isSecondarySale ? (totalPrice * royaltyPercent) / 100 : 0;
      const sellerProceeds = isSecondarySale ? (totalPrice - platformFee - artistRoyalty) : (totalPrice - platformFee);

      const { error: paymentError } = await supabase.rpc('process_payment', {
        p_buyer_id: user.id,
        p_seller_id: track.current_owner_id || track.artist_id,
        p_artist_id: track.artist_id,
        p_total_amount: totalPrice,
        p_royalty_amount: artistRoyalty,
        p_platform_fee: platformFee
      });

      if (paymentError) throw new Error(paymentError.message || "Payment processing failed due to insufficient network balance.");

      // 1. Create a transaction record in Supabase
      if (isSecondarySale) {
        const { error: txError1 } = await supabase.from('transactions').insert({
          nft_id: track.nft_id,
          buyer_id: user.id,
          buyer_wallet: user.wallet_address || 'anonymous',
          seller_wallet: track.current_owner_id || 'platform',
          price: sellerProceeds,
          currency: track.currency,
          tx_type: 'secondary_sale',
          tx_hash: '0x' + Math.random().toString(16).slice(2, 42)
        });
        if (txError1) throw txError1;

        const { error: txError2 } = await supabase.from('transactions').insert({
          nft_id: track.nft_id,
          buyer_id: user.id,
          buyer_wallet: user.wallet_address || 'anonymous',
          seller_wallet: track.artist_id || 'platform',
          price: artistRoyalty,
          currency: track.currency,
          tx_type: 'royalty',
          tx_hash: '0x' + Math.random().toString(16).slice(2, 42)
        });
        if (txError2) throw txError2;
      } else {
        const { error: txError } = await supabase.from('transactions').insert({
          nft_id: track.nft_id,
          buyer_id: user.id,
          buyer_wallet: user.wallet_address || 'anonymous',
          seller_wallet: track.artist_id || 'platform',
          price: sellerProceeds,
          currency: track.currency,
          tx_type: 'primary_sale',
          tx_hash: '0x' + Math.random().toString(16).slice(2, 42)
        });
        if (txError) throw txError;
      }

      // Mark NFT as unlisted and assign to new owner
      await supabase.from('nfts').update({ 
        is_listed: false,
        current_owner_id: user.id
      }).eq('nft_id', track.nft_id);

      // 2. Update local store
      addOwnedNft({ ...track, current_owner_id: user.id });

      setTimeout(() => {
        setIsMinting(false);
        setIsMinted(true);
      }, 100);
    } catch (err) {
      console.error("Minting failed:", err);
      alert("Purchase failed: " + err.message);
      setIsMinting(false);
    }
  };

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const { data: trackData, error: trackError } = await supabase.from('nfts').select(`
          *,
          artists ( artist_name, bio, profile_image, artist_id )
        `).eq('nft_id', id).single();
        
        if (trackError) throw trackError;

        if (trackData) {
          // Fetch the seller wallet directly from the users table
          const { data: userData } = await supabase.from('users').select('wallet_address').eq('user_id', trackData.artist_id).single();
          
          setTrack({
            ...trackData,
            seller: { wallet_address: userData?.wallet_address || '0x0000...0000' }
          });
        }
      } catch (err) {
        console.error("Failed to load track:", err);
        // Fallback or error handling can go here
      }
    };
    if (id) fetchTrack();
  }, [id]);

  if (!track) return <div className="min-h-screen flex items-center justify-center font-headline text-white/50">Loading Track Stream...</div>;

  return (
    <motion.div
      initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
      className="max-w-6xl mx-auto p-10 pb-32"
    >
      <header className="mb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-outline hover:text-white transition-colors group mb-8">
           <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
           <span className="font-label text-xs uppercase tracking-widest">Marketplace</span>
        </Link>
        <div className="flex flex-col md:flex-row gap-12 items-end">
          <div className="w-80 h-80 shrink-0 rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 relative group">
            <img src={track.ipfs_cover_hash} alt={track.song_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          <div className="flex-1 space-y-4">
            <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-label text-primary font-bold uppercase tracking-[0.2em]">
               {track.genre || 'Rare Asset'}
            </span>
            <h1 className="text-7xl font-headline font-extrabold text-white tracking-tighter leading-none text-glow-hover">
               {track.song_title}
            </h1>
            <div className="flex items-center gap-3">
               <p className="text-2xl font-body text-outline font-bold">
                  By <span className="text-white font-bright">{track.artists?.artist_name || 'NFTMusic Artist'}</span>
               </p>
               {track.preview_duration && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg">
                     <span className="material-symbols-outlined text-[10px] text-primary">security</span>
                     <span className="text-[9px] font-label text-primary uppercase font-bold tracking-tighter">Secure Asset Preview</span>
                  </div>
               )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-7 space-y-12">
          {/* Player */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-r from-white/5 to-transparent">
             <div className="flex items-center gap-8">
                <button 
                  onClick={() => currentTrack?.nft_id === track.nft_id ? togglePlay() : playTrack(track)}
                  className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-2xl"
                >
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {currentTrack?.nft_id === track.nft_id && isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                <div className="flex-1 space-y-4">
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: '0%' }}
                        animate={{ width: currentTrack?.nft_id === track.nft_id && isPlaying ? '40%' : '0%' }}
                        className="h-full bg-primary"
                      />
                   </div>
                   <div className="flex justify-between text-[10px] font-label text-outline uppercase tracking-widest">
                      <span>{currentTrack?.nft_id === track.nft_id && isPlaying ? '0:12' : '0:00'}</span>
                      <span>{track.preview_duration ? `0:${track.preview_duration.toString().padStart(2, '0')} (Preview)` : '03:42'}</span>
                   </div>
                </div>
             </div>
          </div>

          <section>
             <h3 className="text-xs font-label text-outline uppercase tracking-[0.3em] mb-6 px-2">Master Credits</h3>
             <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'Vocalist', val: track.artists?.artist_name },
                  { label: 'Composer', val: 'NFTMusic Labs' },
                  { label: 'Producer', val: track.artists?.artist_name }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                    <span className="text-[10px] font-label text-outline uppercase tracking-widest">{item.label}</span>
                    <span className="font-headline font-bold text-white font-bright">{item.val || 'Classified'}</span>
                  </div>
                ))}
             </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-5">
           <div className="sticky top-32 glass-panel p-10 rounded-[3rem] border border-primary/20 bg-[#050505] shadow-[0_0_50px_rgba(255,107,0,0.05)]">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-[10px] font-label text-outline uppercase tracking-[0.3em]">Acquisition</h3>
                 <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                    <select 
                      value={displayCurrency} 
                      onChange={(e) => setDisplayCurrency(e.target.value)}
                      className="bg-transparent text-primary font-bold font-label text-[10px] uppercase outline-none cursor-pointer tracking-widest"
                    >
                      <option value="HLUSD" className="bg-black">HLUSD</option>
                      <option value="ETH" className="bg-black">ETH</option>
                    </select>
                 </div>
              </div>

              <div className="mb-12">
                 <p className="text-[10px] font-label text-outline uppercase tracking-widest mb-2">Fixed Mint Price</p>
                 <h4 className="text-5xl font-headline font-extrabold text-white font-bright tracking-tighter">
                    {displayCurrency === 'HLUSD' && track.currency !== 'HLUSD' 
                      ? (track.price * 3000).toLocaleString(undefined, { minimumFractionDigits: 2 }) 
                      : displayCurrency === 'ETH' && track.currency !== 'ETH'
                      ? (track.price / 3000).toLocaleString(undefined, { minimumFractionDigits: 4 })
                      : track.price} {displayCurrency}
                 </h4>
              </div>

              <div className="space-y-4 mb-12">
                 <div className="flex justify-between text-xs">
                    <span className="text-outline uppercase tracking-widest">Platform Fee</span>
                    <span className="text-white font-bold">3%</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-outline uppercase tracking-widest">Royalty Pool</span>
                    <span className="text-white font-bold">{track.royalty_percent}%</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-outline uppercase tracking-widest">Supply Cap</span>
                    <span className="text-white font-bold">1/1 Master</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-outline uppercase tracking-widest">Settlement</span>
                    <span className="text-white font-bold">Hela Chain</span>
                 </div>
              </div>

              {isOwned || isMinted ? (
                <div className="space-y-4">
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                     className="bg-primary/10 border border-primary/30 p-8 rounded-[2rem] text-center space-y-4"
                  >
                    <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <p className="font-headline text-lg font-bold text-white">Asset Owned.</p>
                    <p className="text-outline text-[10px] uppercase tracking-widest leading-relaxed">Asset registered to your vault signature.</p>
                  </motion.div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      const newPrice = prompt(`Enter new listing price (Current Value: ${track.price} ${track.currency}):\nNote: Price should ideally be higher than your purchase price.`);
                      if (newPrice && !isNaN(newPrice) && parseFloat(newPrice) > 0) {
                         if (parseFloat(newPrice) <= parseFloat(track.price)) {
                            alert("Strategy Tip: To gain yield, list it higher than your buying price!");
                         }
                         supabase.from('nfts').update({ price: parseFloat(newPrice), is_listed: true }).eq('nft_id', track.nft_id)
                           .then(({ error }) => {
                              if(error) alert("Listing Failed.");
                              else {
                                 alert(`Asset successfully listed on the Global Marketplace for ${newPrice} ${track.currency}!`);
                                 setTrack({...track, price: parseFloat(newPrice)});
                              }
                           });
                      }
                    }}
                    className="w-full bg-[#1B3632]/50 border border-[#7BF1D8]/30 text-[#7BF1D8] font-headline font-extrabold py-5 rounded-2xl hover:bg-[#7BF1D8] hover:text-black transition-all uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(123,241,216,0.1)]"
                  >
                    Resell Asset
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleMint}
                  disabled={isMinting}
                  className="w-full bg-primary text-black font-headline font-extrabold py-5 rounded-2xl hover:scale-[1.02] transition-transform mb-4 uppercase tracking-widest text-sm disabled:opacity-50"
                >
                  {isMinting ? 'Synchronizing...' : 'Collect Asset'}
                </button>
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}

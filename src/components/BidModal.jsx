import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function BidModal({ isOpen, onClose, track, mode = "purchase" }) {
  const user = useStore(state => state.user);
  const [selectedBid, setSelectedBid] = useState(2.45);
  const [confirmedFloor, setConfirmedFloor] = useState(2.45);
  const [currency, setCurrency] = useState('HLUSD');
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingBid, setExistingBid] = useState(null);
  const audioRef = useRef(null);
  
  const setModalOpen = useStore(state => state.setModalOpen);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Target track from props
  const targetTrack = track || {};

  useEffect(() => {
    const checkExisiting = async () => {
      if (user?.id && targetTrack?.nft_id) {
        const { data } = await supabase
          .from('bids')
          .select('*')
          .eq('nft_id', targetTrack.nft_id)
          .eq('bidder_id', user.id)
          .limit(1);
        
        if (data && data.length > 0) {
          setExistingBid(data[0]);
        } else {
          setExistingBid(null);
        }
      }
    };
    if (isOpen) {
      checkExisiting();
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen, user, targetTrack]);

  // Sync Global Player State to fade it out
  useEffect(() => {
    setModalOpen(isOpen);
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingPreview(false);
      }
    }
  }, [isOpen, setModalOpen]);

  const handleStartPreview = () => {
    if (audioRef.current) {
      // Direct high-fidelity source
      const sourceUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 
      
      if (audioRef.current.src !== sourceUrl) {
        audioRef.current.src = sourceUrl;
        audioRef.current.load();
      }

      // We need to wait for the audio to be ready before seeking
      const onReadyToPlay = () => {
        audioRef.current.currentTime = 69; // Jump to 1:09
        audioRef.current.play()
          .then(() => {
            setIsPlayingPreview(true);
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.pause();
                setIsPlayingPreview(false);
              }
            }, 15000);
          })
          .catch(err => console.error("Playback blocked:", err));
        
        audioRef.current.removeEventListener('canplay', onReadyToPlay);
      };

      if (audioRef.current.readyState >= 3) {
        onReadyToPlay();
      } else {
        audioRef.current.addEventListener('canplay', onReadyToPlay);
      }
    }
  };
  
  // Fake exchange rate: 1 ETH = ~3000 HLUSD
  const EXCHANGE_RATE = 3000;
  
  const displayAmount = currency === 'HLUSD' ? selectedBid * EXCHANGE_RATE : selectedBid;
  const currencySymbol = currency === 'HLUSD' ? 'HLUSD' : 'ETH';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
        >
          {/* Close Area */}
          <div className="absolute inset-0 z-0" onClick={() => {
            onClose();
            // Optional reset delay so it resets after close animation
            setTimeout(() => setIsSuccess(false), 500);
          }}></div>
          
          {/* Currency Selector */}
          <div className="absolute top-8 right-8 z-[110]">
              <div className="bg-[#1B3632]/80 backdrop-blur-md border border-[#7BF1D8]/20 rounded-2xl p-2 flex items-center shadow-[0_0_20px_rgba(123,241,216,0.1)]">
                <span className="material-symbols-outlined text-[#88BDB2] text-sm mr-2 pl-2">currency_exchange</span>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent text-[#7BF1D8] font-bold font-label text-sm outline-none appearance-none cursor-pointer pr-4"
                >
                  <option value="HLUSD" className="bg-[#1B3632]">HLUSD (Hela Labs)</option>
                  <option value="ETH" className="bg-[#1B3632]">ETH (Ethereum)</option>
                </select>
              </div>
          </div>

          {/* 3D Background Decorative Elements mapping to screenshot */}
          <div className="relative w-full max-w-4xl h-[600px] flex items-center justify-center z-10 pointer-events-none">
            {/* Shapes floating around */}
            <motion.div 
                animate={{ y: [-10, 10, -10], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-[10%] left-[20%] w-32 h-32 rounded-full border-[15px] border-red-900/40 opacity-80"
            ></motion.div>
            <motion.div 
                animate={{ y: [15, -15, 15] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-[10%] right-[15%] w-48 h-48 rounded-full border-[25px] border-red-800/30 opacity-80"
            ></motion.div>
            <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-[20%] right-[25%] w-24 h-24 rounded-full bg-gradient-to-tr from-[#2a0845] to-[#4b0082] shadow-2xl"
            ></motion.div>
            <motion.div 
                animate={{ x: [-15, 15, -15] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-[20%] left-[25%] w-32 h-32 rounded-full bg-gradient-to-tr from-[#120422] to-[#2a0845] shadow-2xl"
            ></motion.div>
            <motion.div 
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[80px]"
            ></motion.div>

            {/* Central Glass Capsule */}
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                className="relative z-20 w-full max-w-2xl bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/10 rounded-[4rem] p-12 shadow-[0_0_50px_rgba(75,0,130,0.3)] pointer-events-auto"
            >
              
              <div className="relative overflow-hidden w-full h-full min-h-[400px]">
                <AnimatePresence mode="wait">
                   {!isSuccess ? (
                    <motion.div 
                      key="bid-form"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col items-center justify-center text-center space-y-6"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3 mb-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                           <span className="material-symbols-outlined text-[10px] text-primary">{mode === 'bid' ? 'gavel' : 'shopping_bag'}</span>
                           <span className="text-[10px] font-label text-primary font-black uppercase tracking-[0.2em]">{mode === 'bid' ? 'Active Auction Floor' : '1/1 Direct Purchase'}</span>
                        </div>
                        <h2 className="font-headline text-5xl font-extrabold text-[#FF3E3E] mb-1 tracking-tight drop-shadow-[0_0_15px_rgba(255,62,62,0.4)]">{targetTrack.song_title}</h2>
                        <div className="flex items-center gap-4">
                           <p className="font-body text-[#FF8A8A] tracking-widest uppercase text-[10px] font-black">BY {targetTrack.artists?.artist_name || 'KSHITIZ'}</p>
                           <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                           <p className="font-label text-white/40 tracking-[0.3em] uppercase text-[9px] font-black">GENRE: {targetTrack.genre || 'Jersey Trap Music'}</p>
                        </div>
                        
                        {/* Start Preview Button - Solving Auto-Play Issues */}
                        <button 
                          onClick={handleStartPreview}
                          disabled={isPlayingPreview}
                          className={`mt-4 px-6 py-2 rounded-full border border-[#FF3E3E]/40 font-label text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${isPlayingPreview ? 'bg-[#FF3E3E]/20 text-[#FF3E3E]' : 'bg-transparent text-white hover:bg-[#FF3E3E] hover:text-black'}`}
                        >
                           <span className="material-symbols-outlined text-sm">{isPlayingPreview ? 'graphic_eq' : 'play_circle'}</span>
                           {isPlayingPreview ? 'Now Playing: 15s Drop' : 'Start Preview (15s Drop)'}
                        </button>
                      </div>

                      {/* 30s Audio Visualizer Simulation */}
                      <div className="w-full h-12 flex items-center justify-center gap-1.5 mt-2">
                        {[40, 70, 45, 90, 65, 80, 50, 95, 30, 85, 60, 75, 55, 90, 40].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [h + '%', (h/2) + '%', h + '%'] }}
                            transition={{ duration: 1 + Math.random(), repeat: Infinity, ease: 'easeInOut' }}
                            className="w-1.5 bg-gradient-to-t from-[#7BF1D8] to-primary/40 rounded-full"
                            style={{ height: h + '%' }}
                          />
                        ))}
                      </div>

                      <div className="w-full flex justify-between items-center py-6 border-y border-white/10 my-4">
                         <div className="text-left">
                           <p className="font-label text-[#88BDB2] text-xs tracking-widest uppercase mb-1">{mode === 'bid' ? 'Time Remaining' : 'Ownership Type'}</p>
                           <p className="font-headline text-white text-2xl font-bold font-mono">{mode === 'bid' ? '04:22:15' : '1/1 MASTER'}</p>
                         </div>
                          <div className="text-right">
                            <p className="font-label text-[#88BDB2] text-xs tracking-widest uppercase mb-1">{mode === 'bid' ? 'Current Bid' : 'Asset Value'} ({currencySymbol})</p>
                            <p className="font-headline text-[#7BF1D8] text-2xl font-bold">{(confirmedFloor * (currency === 'HLUSD' ? EXCHANGE_RATE : 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</p>
                          </div>
                      </div>

                      {mode === 'bid' ? (
                        <div className="w-full space-y-3">
                            <div className="flex justify-between font-label text-xs text-[#88BDB2]">
                                <span>Raise Bid</span>
                                <span>SELECTED: {displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</span>
                            </div>
                            <input 
                              type="range" 
                              min={confirmedFloor} 
                              max="100.00" 
                              step="0.05"
                              value={selectedBid}
                              onChange={(e) => setSelectedBid(parseFloat(e.target.value))}
                              className="w-full h-2 bg-black/30 rounded-full appearance-none outline-none accent-primary"
                            />
                            <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">Note: Minimum bid must be higher than current floor</p>
                        </div>
                      ) : (
                        <div className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                           <span className="material-symbols-outlined text-primary text-sm">info</span>
                           <p className="text-[9px] text-white/60 uppercase tracking-[0.2em] text-left">This asset is a unique 1 of 1 master copy. Purchasing grants you full curation rights and revenue shares on the Hela Network.</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="w-full pt-4 flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 rounded-full font-bold text-white bg-white/5 hover:bg-white/10 transition-colors uppercase tracking-wider text-sm">
                            Cancel
                        </button>
                         <button 
                           onClick={async () => {
                             if (!user) {
                               alert("Please login to place bids.");
                               return;
                             }
                             if (existingBid) {
                               onClose();
                               navigate('/bids');
                               return;
                             }
                             setIsSubmitting(true);
                             try {
                               if (mode === 'purchase') {
                                 // Determine if this is a secondary sale
                                 const isSecondarySale = targetTrack.current_owner_id && targetTrack.current_owner_id !== targetTrack.artist_id;
                                 const totalPrice = confirmedFloor * (currency === 'HLUSD' ? EXCHANGE_RATE : 1);
                                 
                                 const PLATFORM_FEE_PERCENT = 3; // 3% platform fee
                                 const platformFee = (totalPrice * PLATFORM_FEE_PERCENT) / 100;

                                 const royaltyPercent = targetTrack.royalty_percent || 10;
                                 const artistRoyalty = isSecondarySale ? (totalPrice * royaltyPercent) / 100 : 0;
                                 const sellerProceeds = isSecondarySale ? (totalPrice - platformFee - artistRoyalty) : (totalPrice - platformFee);
                                 
                                 // Execute Real Balance Transfer via RPC
                                 const { error: paymentError } = await supabase.rpc('process_payment', {
                                   p_buyer_id: user.id,
                                   p_seller_id: targetTrack.current_owner_id || targetTrack.artist_id,
                                   p_artist_id: targetTrack.artist_id,
                                   p_total_amount: totalPrice,
                                   p_royalty_amount: artistRoyalty,
                                   p_platform_fee: platformFee
                                 });
                                 if (paymentError) throw new Error(paymentError.message || "Payment processing failed due to insufficient network balance.");

                                 // 0. Remove prior 'won' bids, but DO NOT delete past transactions (to keep ledger history)
                                 await supabase.from('bids').delete().eq('nft_id', targetTrack.nft_id).eq('status', 'won');

                                 if (isSecondarySale) {

                                   // 1a. Transaction for Seller
                                   const { error: txError1 } = await supabase.from('transactions').insert({
                                     nft_id: targetTrack.nft_id,
                                     buyer_id: user.id,
                                     buyer_wallet: user.wallet_address,
                                     seller_wallet: targetTrack.current_owner_id || 'platform',
                                     price: sellerProceeds,
                                     currency: currency,
                                     tx_type: 'secondary_sale',
                                     tx_hash: '0x' + Math.random().toString(16).slice(2, 42)
                                   });
                                   if (txError1) throw txError1;

                                   // 1b. Royalty Transaction for Artist
                                   const { error: txError2 } = await supabase.from('transactions').insert({
                                     nft_id: targetTrack.nft_id,
                                     buyer_id: user.id,
                                     buyer_wallet: user.wallet_address,
                                     seller_wallet: targetTrack.artist_id || 'platform',
                                     price: artistRoyalty,
                                     currency: currency,
                                     tx_type: 'royalty',
                                     tx_hash: '0x' + Math.random().toString(16).slice(2, 42)
                                   });
                                   if (txError2) throw txError2;

                                 } else {
                                   // Primary Sale
                                   const { error: txError } = await supabase.from('transactions').insert({
                                     nft_id: targetTrack.nft_id,
                                     buyer_id: user.id,
                                     buyer_wallet: user.wallet_address,
                                     seller_wallet: targetTrack.artist_id || 'platform',
                                     price: sellerProceeds,
                                     currency: currency,
                                     tx_type: 'primary_sale',
                                     tx_hash: '0x' + Math.random().toString(16).slice(2, 42)
                                   });
                                   if (txError) throw txError;
                                 }

                                 // 1.5. Also add to 'bids' table so it shows in "Active Signatures"
                                 await supabase.from('bids').insert({
                                   nft_id: targetTrack.nft_id,
                                   bidder_id: user.id,
                                   bidder_wallet: user.wallet_address,
                                   amount: totalPrice,
                                   currency: currency,
                                   status: 'won', // special status for purchases
                                   expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString() // effectively permanent
                                 });

                                 // 2. Mark NFT as unlisted and assign to new owner
                                 await supabase.from('nfts').update({ 
                                   is_listed: false,
                                   current_owner_id: user.id
                                 }).eq('nft_id', targetTrack.nft_id);
                                 
                                 // 3. Update local state
                                 useStore.getState().addOwnedNft({ ...targetTrack, current_owner_id: user.id });
                               } else {
                                 // Bid Mode: Log to bids table
                                 const { error: bidError } = await supabase.from('bids').insert({
                                   nft_id: targetTrack.nft_id,
                                   bidder_id: user.id, // Support account separation
                                   bidder_wallet: user.wallet_address || 'anonymous',
                                   amount: selectedBid,
                                   currency: currency,
                                   status: 'active',
                                   expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString()
                                 });

                                 if (bidError) throw bidError;
                               }

                               setIsSuccess(true);
                             } catch (err) {
                               console.error(`${mode === 'bid' ? 'Bid' : 'Purchase'} failed:`, err);
                               alert(`${mode === 'bid' ? 'Bid' : 'Purchase'} failed: ` + err.message);
                             } finally {
                               setIsSubmitting(false);
                             }
                           }}
                           disabled={isSubmitting}
                           className={`flex-1 py-4 rounded-full font-bold uppercase tracking-wider text-sm transition-all ${existingBid ? 'bg-[#7BF1D8]/20 text-[#7BF1D8] hover:bg-[#7BF1D8]/30 border border-[#7BF1D8]/40' : 'text-[#0D211F] bg-[#7BF1D8] hover:bg-[#92FFE6] shadow-[0_0_20px_rgba(123,241,216,0.4)]'}`}
                         >
                             {isSubmitting ? 'PROCESSING...' : existingBid ? (mode === 'bid' ? 'Already In & Winning' : 'Already Purchased') : (mode === 'bid' ? 'Confirm Bid' : 'Confirm Purchase')}
                         </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="success-form"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, type: "spring" }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 h-full"
                    >
                      <div className="w-24 h-24 rounded-full bg-[#7BF1D8]/20 flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-[#7BF1D8] animate-ping opacity-20"></div>
                        <span className="material-symbols-outlined text-5xl text-[#7BF1D8]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      </div>
                      
                      <h2 className="font-headline text-4xl font-extrabold text-white mb-2 tracking-tight">
                        Purchase Successful!
                      </h2>
                      
                      <div className="bg-[#1B3632]/50 border border-[#7BF1D8]/20 p-6 rounded-2xl w-full">
                        <p className="font-body text-[#88BDB2] text-sm leading-relaxed mb-4">
                          Congratulations! You have successfully acquired <strong className="text-white">{targetTrack.song_title}</strong> for <strong className="text-[#FF3E3E]">{displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</strong>.
                        </p>
                        <p className="font-label text-xs uppercase tracking-widest text-primary/80 bg-primary/10 py-3 px-4 rounded-xl border border-primary/20">
                          The asset is now being cryptographically transferred to your **Vault**.
                        </p>
                      </div>

                      <button 
                        onClick={() => {
                          onClose();
                          // Redirect back to Explore as requested
                          navigate('/');
                          setTimeout(() => setIsSuccess(false), 500);
                        }} 
                        className="w-full mt-4 py-4 rounded-full font-bold text-[#0D211F] bg-[#7BF1D8] hover:bg-[#92FFE6] transition-colors shadow-[0_0_20px_rgba(123,241,216,0.4)] uppercase tracking-wider text-sm"
                      >
                        RETURN TO EXPLORE
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* High-Performance Audio Engine for RAWANA */}
              <audio 
                ref={audioRef} 
                className="hidden"
                crossOrigin="anonymous"
                preload="auto"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

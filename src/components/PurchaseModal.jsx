import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const PLATFORM_FEE_PERCENT = 3;
const EXCHANGE_RATE = 1;

export default function PurchaseModal({ isOpen, onClose, track }) {
  const user = useStore(state => state.user);
  const addOwnedNft = useStore(state => state.addOwnedNft);
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [buyerBalance, setBuyerBalance] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Fetch live buyer balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.id) {
        const { data } = await supabase.from('users').select('balance').eq('user_id', user.id).single();
        if (data) setBuyerBalance(parseFloat(data.balance));
      }
    };
    if (isOpen) fetchBalance();
  }, [isOpen, user]);

  if (!track) return null;

  const totalPrice = parseFloat(track.price);
  const platformFee = (totalPrice * PLATFORM_FEE_PERCENT) / 100;
  const isSecondarySale = track.current_owner_id && track.current_owner_id !== track.artist_id;
  const royaltyPercent = track.royalty_percent || 10;
  const royaltyAmount = isSecondarySale ? (totalPrice * royaltyPercent) / 100 : 0;
  const sellerReceives = isSecondarySale
    ? totalPrice - platformFee - royaltyAmount
    : totalPrice - platformFee;
  const canAfford = buyerBalance !== null && buyerBalance >= totalPrice;

  const handleConfirmPurchase = async () => {
    if (!user) { alert('Please login.'); return; }
    if (!canAfford) { alert(`Insufficient funds. You need ${totalPrice} HLUSD but have ${buyerBalance?.toFixed(2)} HLUSD.`); return; }

    setIsSubmitting(true);
    try {
      // 1. Execute payment via RPC
      const { error: paymentError } = await supabase.rpc('process_payment', {
        p_buyer_id: user.id,
        p_seller_id: track.current_owner_id || track.artist_id,
        p_artist_id: track.artist_id,
        p_total_amount: totalPrice,
        p_royalty_amount: royaltyAmount,
        p_platform_fee: platformFee,
      });
      if (paymentError) throw new Error(paymentError.message || 'Payment failed.');

      // 2. Log transaction(s)
      if (isSecondarySale) {
        await supabase.from('transactions').insert([
          {
            nft_id: track.nft_id, buyer_id: user.id, buyer_wallet: user.wallet_address,
            seller_wallet: track.current_owner_id, price: sellerReceives,
            currency: track.currency || 'HLUSD', tx_type: 'secondary_sale',
            tx_hash: '0x' + Math.random().toString(16).slice(2, 42)
          },
          {
            nft_id: track.nft_id, buyer_id: user.id, buyer_wallet: user.wallet_address,
            seller_wallet: track.artist_id, price: royaltyAmount,
            currency: track.currency || 'HLUSD', tx_type: 'royalty',
            tx_hash: '0x' + Math.random().toString(16).slice(2, 42)
          }
        ]);
      } else {
        await supabase.from('transactions').insert({
          nft_id: track.nft_id, buyer_id: user.id, buyer_wallet: user.wallet_address,
          seller_wallet: track.artist_id, price: sellerReceives,
          currency: track.currency || 'HLUSD', tx_type: 'primary_sale',
          tx_hash: '0x' + Math.random().toString(16).slice(2, 42)
        });
      }

      // 3. Transfer ownership
      await supabase.from('nfts').update({ is_listed: false, current_owner_id: user.id }).eq('nft_id', track.nft_id);
      await supabase.from('bids').delete().eq('nft_id', track.nft_id).eq('status', 'won');
      await supabase.from('bids').insert({
        nft_id: track.nft_id, bidder_id: user.id, bidder_wallet: user.wallet_address,
        amount: totalPrice, currency: track.currency || 'HLUSD', status: 'won',
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString()
      });

      // 4. Update local store
      addOwnedNft({ ...track, current_owner_id: user.id });
      setIsSuccess(true);
    } catch (err) {
      alert('Purchase failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const Row = ({ label, value, color, bold, large, highlight }) => (
    <div className={`flex justify-between items-center py-3 ${highlight ? 'border-t border-white/10 mt-2 pt-4' : 'border-b border-white/5'}`}>
      <span className={`font-label text-[10px] uppercase tracking-[0.2em] ${color || 'text-white/50'}`}>{label}</span>
      <span className={`font-headline ${large ? 'text-2xl' : 'text-sm'} ${bold ? 'font-extrabold' : 'font-semibold'} ${color || 'text-white'}`}>{value}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && !isSuccess && onClose()}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-md bg-[#080808] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]"
          >
            {!isSuccess ? (
              <>
                {/* Header with cover */}
                <div className="relative h-36 overflow-hidden">
                  <img src={track.ipfs_cover_hash} className="w-full h-full object-cover blur-sm scale-105 opacity-40" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#080808]" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
                    <img src={track.ipfs_cover_hash} className="w-14 h-14 rounded-2xl shadow-2xl object-cover" alt={track.song_title} />
                    <div>
                      <h2 className="font-headline font-extrabold text-white text-xl tracking-tight leading-none">{track.song_title}</h2>
                      <p className="font-label text-[9px] text-white/40 uppercase tracking-[0.2em] mt-1">
                        {isSecondarySale ? '🔄 Secondary Sale' : '✦ Primary Sale'} &nbsp;·&nbsp; {track.artists?.artist_name || 'NFTMusic Artist'}
                      </p>
                    </div>
                  </div>
                  {/* Close button */}
                  <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-sm text-white">close</span>
                  </button>
                </div>

                {/* Pricing Breakdown */}
                <div className="px-7 pb-7 space-y-1">
                  <p className="font-label text-[9px] text-white/30 uppercase tracking-[0.3em] mb-4 pt-2">Transaction Breakdown</p>

                  <Row label="Asset Price" value={`${totalPrice.toLocaleString()} HLUSD`} />
                  <Row label={`Platform Fee (${PLATFORM_FEE_PERCENT}%)`} value={`− ${platformFee.toFixed(2)} HLUSD`} color="text-red-400" />

                  {isSecondarySale ? (
                    <>
                      <Row label={`Royalty to Creator (${royaltyPercent}%)`} value={`− ${royaltyAmount.toFixed(2)} HLUSD`} color="text-purple-400" />
                      <Row label="Seller Receives" value={`${sellerReceives.toFixed(2)} HLUSD`} color="text-green-400" />
                    </>
                  ) : (
                    <Row label="Creator Receives" value={`${sellerReceives.toFixed(2)} HLUSD`} color="text-green-400" />
                  )}

                  {/* Total you pay */}
                  <div className="flex justify-between items-center border-t border-white/10 pt-5 mt-3">
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-white/50">You Pay</span>
                    <span className="font-headline text-3xl font-extrabold text-white">{totalPrice.toLocaleString()} <span className="text-primary text-lg">HLUSD</span></span>
                  </div>

                  {/* Wallet Balance */}
                  <div className={`flex justify-between items-center py-2 px-4 rounded-2xl mt-2 ${canAfford ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <span className="font-label text-[9px] uppercase tracking-[0.2em] text-white/50">Your Balance</span>
                    <span className={`font-headline text-sm font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                      {buyerBalance !== null ? `${buyerBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} HLUSD` : 'Loading...'}
                      {!canAfford && buyerBalance !== null && <span className="ml-2 text-[9px] font-label text-red-400 uppercase">Insufficient</span>}
                    </span>
                  </div>

                  {/* Footnote */}
                  <p className="font-label text-[8px] text-white/20 uppercase tracking-[0.15em] text-center pt-2">
                    {isSecondarySale
                      ? `Creator earns ${royaltyPercent}% royalty on every resale automatically.`
                      : 'First acquisition. Royalties will apply on future resales.'}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onClose}
                      className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-label text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmPurchase}
                      disabled={isSubmitting || !canAfford || buyerBalance === null}
                      className="flex-1 py-4 rounded-2xl bg-primary text-black font-headline font-extrabold text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,107,0,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : 'Confirm Purchase'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 flex flex-col items-center text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-4xl text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </motion.div>
                <div className="space-y-2">
                  <h3 className="font-headline text-2xl font-extrabold text-white">Asset Acquired!</h3>
                  <p className="font-label text-[10px] text-white/40 uppercase tracking-[0.2em]">
                    <span className="text-primary font-black">{track.song_title}</span> is now in your Vault.
                  </p>
                  <p className="font-label text-[9px] text-white/30 uppercase tracking-[0.2em] pt-1">
                    {totalPrice.toLocaleString()} HLUSD deducted from your wallet.
                  </p>
                </div>
                <div className="flex gap-3 w-full pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-label text-[10px] uppercase tracking-widest"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/vault'); }}
                    className="flex-1 py-4 rounded-2xl bg-primary text-black font-label font-black text-[10px] uppercase tracking-widest"
                  >
                    Open Vault
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

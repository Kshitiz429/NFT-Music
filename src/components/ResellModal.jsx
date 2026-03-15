import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';

const PLATFORM_FEE_PERCENT = 3;
const MIN_PRICE = 10;
const MAX_PRICE = 50000;

export default function ResellModal({ isOpen, onClose, nft, onResellSuccess }) {
  const user = useStore(state => state.user);

  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sliderValue, setSliderValue] = useState(MIN_PRICE);

  // Sync slider ↔ input
  useEffect(() => {
    if (isOpen && nft) {
      const initial = Math.max(MIN_PRICE, parseFloat(nft.price) || MIN_PRICE);
      setPrice(String(initial));
      setSliderValue(initial);
      setIsSuccess(false);
      setError('');
    }
  }, [isOpen, nft]);

  if (!nft) return null;

  const numPrice = parseFloat(price) || 0;
  const platformFee = (numPrice * PLATFORM_FEE_PERCENT) / 100;
  const royaltyPercent = nft.royalty_percent || 10;
  const royaltyAmount = (numPrice * royaltyPercent) / 100;
  const youReceive = numPrice - platformFee - royaltyAmount;

  const isValidPrice = numPrice >= MIN_PRICE && numPrice <= MAX_PRICE;

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setSliderValue(val);
    setPrice(String(val));
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setPrice(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= MIN_PRICE && num <= MAX_PRICE) {
      setSliderValue(num);
    }
  };

  const handleResell = async () => {
    if (!isValidPrice) {
      setError(`Price must be between ${MIN_PRICE} and ${MAX_PRICE.toLocaleString()} HLUSD`);
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      // Re-list the NFT on the marketplace with the new price
      const { error: dbError } = await supabase
        .from('nfts')
        .update({
          is_listed: true,
          price: numPrice,
          // current_owner_id stays the same—it's still owned by the seller until re-bought
        })
        .eq('nft_id', nft.nft_id);

      if (dbError) throw new Error(dbError.message);

      setIsSuccess(true);
      if (onResellSuccess) onResellSuccess({ ...nft, price: numPrice, is_listed: true });
    } catch (err) {
      setError('Failed to list: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Percentage for gradient track
  const sliderPercent = ((sliderValue - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

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
                {/* Header with Blurred Cover */}
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={nft.ipfs_cover_hash}
                    className="w-full h-full object-cover blur-sm scale-105 opacity-30"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#080808]" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
                    <img
                      src={nft.ipfs_cover_hash}
                      className="w-14 h-14 rounded-2xl shadow-2xl object-cover border border-white/10"
                      alt={nft.song_title}
                    />
                    <div>
                      <h2 className="font-headline font-extrabold text-white text-xl tracking-tight leading-none">
                        {nft.song_title}
                      </h2>
                      <p className="font-label text-[9px] text-white/40 uppercase tracking-[0.2em] mt-1">
                        🔄 Re-List on Marketplace
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-white">close</span>
                  </button>
                </div>

                {/* Content */}
                <div className="px-7 pb-7 space-y-5 pt-2">
                  {/* Price Label */}
                  <p className="font-label text-[9px] text-white/30 uppercase tracking-[0.3em]">
                    Set Your Resell Price
                  </p>

                  {/* Price Input */}
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-primary/40 transition-colors">
                    <span className="font-headline font-black text-primary text-lg">₮</span>
                    <input
                      type="number"
                      value={price}
                      onChange={handleInputChange}
                      min={MIN_PRICE}
                      max={MAX_PRICE}
                      step="0.5"
                      className="flex-1 bg-transparent text-white font-headline font-extrabold text-2xl outline-none placeholder:text-white/20"
                      placeholder="0"
                    />
                    <span className="font-label text-[10px] text-white/30 uppercase tracking-widest font-black">HLUSD</span>
                  </div>

                  {/* Slider */}
                  <div className="space-y-2">
                    <div className="relative h-2 rounded-full bg-white/10">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-orange-400 transition-all"
                        style={{ width: `${sliderPercent}%` }}
                      />
                      <input
                        type="range"
                        min={MIN_PRICE}
                        max={MAX_PRICE}
                        step="10"
                        value={sliderValue}
                        onChange={handleSliderChange}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                        style={{ zIndex: 2 }}
                      />
                      {/* Thumb indicator */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-[0_0_15px_rgba(255,107,0,0.6)] border-2 border-primary pointer-events-none transition-all"
                        style={{ left: `calc(${sliderPercent}% - 10px)` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-label text-white/20 uppercase tracking-widest">
                      <span>{MIN_PRICE} HLUSD</span>
                      <span>{MAX_PRICE.toLocaleString()} HLUSD</span>
                    </div>
                  </div>

                  {/* Preset Quick Picks */}
                  <div className="flex gap-2 flex-wrap">
                    {[100, 500, 1000, 5000, 10000].map(p => (
                      <button
                        key={p}
                        onClick={() => { setPrice(String(p)); setSliderValue(p); }}
                        className={`px-4 py-1.5 rounded-full border font-label text-[9px] uppercase tracking-widest font-black transition-all ${
                          numPrice === p
                            ? 'bg-primary border-primary text-black'
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-primary/30 hover:text-white'
                        }`}
                      >
                        {p >= 1000 ? `${p / 1000}K` : p}
                      </button>
                    ))}
                  </div>

                  {/* Fee Breakdown */}
                  <div className="space-y-2 bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                    <p className="font-label text-[8px] text-white/30 uppercase tracking-[0.3em] mb-3">Estimate Breakdown</p>

                    <div className="flex justify-between items-center">
                      <span className="font-label text-[10px] text-white/50 uppercase tracking-widest">Listed At</span>
                      <span className="font-headline text-sm font-extrabold text-white">
                        {isValidPrice ? numPrice.toLocaleString() : '—'} HLUSD
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-label text-[10px] text-white/50 uppercase tracking-widest">
                        Platform Fee ({PLATFORM_FEE_PERCENT}%)
                      </span>
                      <span className="font-headline text-sm font-semibold text-red-400">
                        − {isValidPrice ? platformFee.toFixed(2) : '—'} HLUSD
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-label text-[10px] text-white/50 uppercase tracking-widest">
                        Creator Royalty ({royaltyPercent}%)
                      </span>
                      <span className="font-headline text-sm font-semibold text-purple-400">
                        − {isValidPrice ? royaltyAmount.toFixed(2) : '—'} HLUSD
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-1">
                      <span className="font-label text-[10px] text-white uppercase tracking-widest font-black">You Receive</span>
                      <span className="font-headline text-xl font-extrabold text-green-400">
                        {isValidPrice ? youReceive.toFixed(2) : '—'} HLUSD
                      </span>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-red-400 font-label text-[10px] uppercase tracking-widest text-center">{error}</p>
                  )}

                  {/* Info note */}
                  <p className="font-label text-[8px] text-white/20 uppercase tracking-[0.15em] text-center">
                    Track stays in your vault until a buyer confirms purchase.
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-label text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResell}
                      disabled={isSubmitting || !isValidPrice}
                      className="flex-1 py-4 rounded-2xl bg-primary text-black font-headline font-extrabold text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,107,0,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          Listing...
                        </span>
                      ) : 'List for Resale'}
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
                  className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center"
                >
                  <span
                    className="material-symbols-outlined text-4xl text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    sell
                  </span>
                </motion.div>
                <div className="space-y-2">
                  <h3 className="font-headline text-2xl font-extrabold text-white">Listed!</h3>
                  <p className="font-label text-[10px] text-white/40 uppercase tracking-[0.2em]">
                    <span className="text-primary font-black">{nft.song_title}</span> is now live on the marketplace.
                  </p>
                  <p className="font-label text-[9px] text-white/30 uppercase tracking-[0.2em] pt-1">
                    Listed at {numPrice.toLocaleString()} HLUSD
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-primary text-black font-label font-black text-[10px] uppercase tracking-widest"
                >
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  in: { opacity: 1, scale: 1 },
  out: { opacity: 0, scale: 0.98 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

export default function ArtistProfile() {
  const user = useStore(state => state.user);
  const [artist, setArtist] = useState(null);
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const artistId = user?.id || '11111111-1111-1111-1111-111111111111';
      const { data: artistData } = await supabase.from('artists').select('*').eq('artist_id', artistId).single();
      if (artistData) setArtist(artistData);

      const { data: nftData } = await supabase.from('nfts').select('*').eq('artist_id', artistId);
      if (nftData) setNfts(nftData);
    };
    fetchProfile();
  }, [user]);

  return (
    <motion.div
      initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
      className="max-w-6xl mx-auto p-10 pb-32"
    >
      <header className="mb-16 relative h-80 rounded-[3rem] overflow-hidden group">
         <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
         <div className="absolute bottom-10 left-10 flex items-end gap-10">
            <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-black shadow-2xl">
               <img src={artist?.profile_image} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-2">
               <h1 className="text-6xl font-headline font-bold text-white tracking-tighter text-glow-hover">{artist?.artist_name || 'Anonymous Artist'}</h1>
               <p className="text-primary font-bold tracking-widest uppercase text-xs">Verified NFTMUSIC Artist</p>
            </div>
         </div>
      </header>

      <div className="grid grid-cols-4 gap-8 mb-16">
         {[
           { label: 'Collection Size', val: nfts.length },
           { label: 'Market Cap', val: '252.6K HLUSD' },
           { label: 'Verified Fans', val: '12.5K' },
           { label: 'Royalties Paid', val: '44.4K' }
         ].map((stat, i) => (
            <div key={i} className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-white/5">
               <p className="text-[10px] font-label text-outline uppercase tracking-widest mb-2">{stat.label}</p>
               <p className="text-3xl font-headline font-bold text-white font-bright tracking-tight">{stat.val}</p>
            </div>
         ))}
      </div>

      <section>
         <h3 className="text-xs font-label text-outline uppercase tracking-[0.3em] mb-10 px-4">Digital Portfolio</h3>
         <div className="grid grid-cols-3 gap-10">
            {nfts.map((nft) => (
               <div key={nft.nft_id} className="group glass-panel p-5 rounded-[2.5rem] border border-white/5 hover:bg-white/5 transition-all duration-500">
                  <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 bg-black relative shadow-2xl">
                     <img src={nft.ipfs_cover_hash} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Link to={`/track/${nft.nft_id}`} className="w-14 h-14 bg-white rounded-full text-black flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                           <span className="material-symbols-outlined text-3xl">expand_content</span>
                        </Link>
                     </div>
                  </div>
                  <div className="px-2">
                     <h4 className="font-headline font-bold text-xl text-white mb-1 group-hover:text-primary transition-colors">{nft.song_title}</h4>
                     <p className="text-[10px] text-white/40 font-label uppercase tracking-widest mb-4 font-bright">{nft.genre} • Origin Code: {String(nft.nft_id).slice(0,8)}</p>
                     <p className="text-lg font-headline font-bold text-white font-bright">{nft.price} {nft.currency}</p>
                  </div>
               </div>
            ))}
         </div>
      </section>
    </motion.div>
  );
}

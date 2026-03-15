import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getWalletBalance } from '../lib/blockchain';

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  in: { opacity: 1, scale: 1 },
  out: { opacity: 0, scale: 0.98 }
};

export default function Profile() {
  const user = useStore((state) => state.user);
  const isInitializing = useStore((state) => state.isInitializing);
  const logout = useStore((state) => state.logout);
  const ownedNfts = useStore((state) => state.ownedNfts);
  const [stats, setStats] = useState({
    totalMinted: 0,
    totalBids: 0,
    joinDate: 'Jan 2024',
    balance: '0.00'
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      
      // Fetch Minted Count
      const { count: mintedCount } = await supabase
        .from('nfts')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', user.id);

      // Fetch Bids Count
      const { count: bidsCount } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .or(`bidder_id.eq.${user.id},bidder_wallet.eq.${user.wallet_address}`);

      // Fetch Balance
      const bal = await getWalletBalance(user.id);

      setStats(prev => ({
        ...prev,
        totalMinted: mintedCount || 0,
        totalBids: bidsCount || 0,
        balance: bal
      }));
    };

    fetchUserStats();
  }, [user]);

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
      className="max-w-4xl mx-auto px-6 py-16 pb-32"
    >
      <div className="glass-panel p-12 rounded-[4rem] border border-white/5 relative overflow-hidden group mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-30 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          {/* Large Profile Initial */}
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-40 h-40 rounded-full bg-gradient-to-tr from-white/10 to-white/5 border-2 border-white/20 flex items-center justify-center text-7xl font-headline font-black text-white shadow-[0_0_50px_rgba(255,255,255,0.1)] relative z-10"
            >
              {user.name[0]}
            </motion.div>
            <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-6xl font-headline font-black text-white tracking-tighter mb-2 font-bright">
              {user.name}
            </h1>
            <p className="text-primary font-bold text-xs uppercase tracking-[0.4em] mb-6">
              Verified {user.role || 'Curator'} • ID: {user.id.slice(0, 16)}
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] text-outline font-label uppercase tracking-widest">
                {user.wallet_address?.slice(0, 8)}...{user.wallet_address?.slice(-8)}
              </div>
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] text-outline font-label uppercase tracking-widest">
                Joined {stats.joinDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard label="Native Balance" value={`${parseFloat(stats.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} HLUSD`} icon="account_balance_wallet" color="text-primary" border="border-primary/20" />
        <StatCard label="Collected Assets" value={ownedNfts.length} icon="album" />
        <StatCard label="Active Bids" value={stats.totalBids} icon="gavel" color="text-[#7BF1D8]" border="border-[#7BF1D8]/20" />
        <StatCard label="Minted Tracks" value={stats.totalMinted} icon="bolt" />
      </div>

      {/* Profile Details */}
      <div className="glass-panel p-10 rounded-[3rem] border border-white/5 space-y-8">
        <h3 className="text-xl font-headline font-bold text-white tracking-tight uppercase tracking-[0.2em] opacity-60 text-xs">Registry Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <InfoItem label="Full Name" value={user.name} />
          <InfoItem label="Email Identity" value={user.email || 'wallet-auth@hela.network'} />
          <InfoItem label="Primary Role" value={user.role === 'artist' ? 'Artist / Producer' : 'Digital Curator'} />
          <InfoItem label="Wallet Chain" value="Hela Labs (Mainnet)" />
          <InfoItem label="Age Index" value={user.age || 'N/A'} />
          <InfoItem label="Gender Mode" value={user.gender || 'Restricted'} />
        </div>

        <div className="pt-8 border-t border-white/5 flex justify-between items-center">
          <button 
            onClick={logout}
            className="px-8 py-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-headline font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
          >
            TERMINATE SESSION
          </button>
          <Link 
            to="/vault"
            className="px-8 py-4 rounded-full bg-white text-black font-headline font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
          >
            VIEW MY VAULT
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, color = "text-white", border = "border-white/5" }) {
  return (
    <div className={`glass-panel p-8 rounded-[2.5rem] border ${border} bg-white/[0.02] flex flex-col items-center text-center group hover:bg-white/[0.05] transition-all`}>
      <span className={`material-symbols-outlined text-3xl mb-4 ${color} opacity-40 group-hover:opacity-100 transition-opacity`}>{icon}</span>
      <p className="text-[9px] font-label text-outline uppercase tracking-[0.3em] mb-2 font-bold">{label}</p>
      <h3 className={`text-3xl font-headline font-bold font-bright ${color}`}>{value}</h3>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-label text-outline uppercase tracking-[0.3em] mb-2 font-bold">{label}</p>
      <p className="text-lg font-headline font-bold text-white font-bright">{value}</p>
    </div>
  );
}

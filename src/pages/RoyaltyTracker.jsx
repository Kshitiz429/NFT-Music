import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import { getWalletBalance } from '../lib/blockchain';

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

export default function RoyaltyTracker() {
  const user = useStore(state => state.user);
  const isInitializing = useStore(state => state.isInitializing);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState('0.00');
  const [graphData, setGraphData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !user) {
      navigate('/', { replace: true });
    }
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  useEffect(() => {
    const fetchTransactions = async () => {
      // 1. Fetch Real Balance
      if (user?.wallet_address) {
        const bal = await getWalletBalance(user.wallet_address);
        setBalance(bal);
      }

      // 2. Fetch Transactions for this Wallet
      // Note: We're filtering by wallet_id which is linked to the user.id in Supabase
      const artistId = user?.id || '11111111-1111-1111-1111-111111111111';
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          nfts!inner( artist_id, song_title, ipfs_cover_hash )
        `)
        .eq('nfts.artist_id', artistId)
        .in('tx_type', ['primary_sale', 'royalty'])
        .order('timestamp', { ascending: false });

      if (data) {
        setTransactions(data);
        const totalYield = data.reduce((sum, tx) => sum + Number(tx.price), 0);
        setBalance(totalYield.toString());
        
        // 3. Construct Graph Data (Mocking if ledger is sparse, otherwise mapping prices)
        const points = data.length > 3 
          ? data.slice(0, 8).reverse().map((tx, i) => ({ x: i * 100, y: 150 - (tx.price * 2) }))
          : [
              { x: 0, y: 150 }, { x: 100, y: 130 }, { x: 200, y: 160 }, 
              { x: 300, y: 120 }, { x: 400, y: 140 }, { x: 500, y: 90 }, 
              { x: 600, y: 110 }, { x: 700, y: 80 }, { x: 800, y: 100 }
            ];
        setGraphData(points);
      }
    };

    fetchTransactions();
  }, [user]);

  // Generate SVG Path for the graph
  const generatePath = (data) => {
    if (data.length === 0) return "";
    let d = `M ${data[0].x} ${data[0].y}`;
    for (let i = 1; i < data.length; i++) {
      const cp1x = data[i-1].x + (data[i].x - data[i-1].x) / 2;
      d += ` C ${cp1x} ${data[i-1].y}, ${cp1x} ${data[i].y}, ${data[i].x} ${data[i].y}`;
    }
    return d;
  };

  return (
    <motion.div
      initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
      className="max-w-6xl mx-auto p-10 pb-32"
    >
      <header className="mb-16">
         <h1 className="text-6xl font-headline font-bold text-white tracking-tighter mb-2 text-glow-hover">Insights.</h1>
         <p className="text-outline font-label uppercase tracking-[0.4em] text-[10px]">Real-time Royalty Streams • {user?.wallet_address?.slice(0, 10)}...</p>
      </header>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-10">
           {/* Chart Area with Moving Graphics */}
           <div className="glass-panel p-10 rounded-[3rem] border border-white/5 bg-black/40 h-[400px] relative overflow-hidden group">
              {/* IMMERSIVE BACKGROUND ANIMATIONS */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                    rotate: [0, 90, 0]
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 blur-[120px] rounded-full"
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.5, 1],
                    x: [0, -50, 0],
                    y: [0, 50, 0]
                  }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full"
                />
                
                {/* Moving Data Particles */}
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: Math.random() * 800, y: 400, opacity: 0 }}
                    animate={{ 
                      y: -100, 
                      opacity: [0, 0.5, 0],
                      x: `calc(${Math.random() * 800}px + ${Math.sin(i) * 50}px)` 
                    }}
                    transition={{ 
                      duration: 5 + Math.random() * 5, 
                      repeat: Infinity, 
                      delay: Math.random() * 5,
                      ease: "linear"
                    }}
                    className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"
                  />
                ))}
              </div>

              <div className="relative z-10 flex justify-between items-center mb-10">
                 <div className="space-y-1">
                    <h3 className="text-xs font-label text-outline uppercase tracking-[0.2em]">Revenue Velocity (Historical)</h3>
                    <p className="text-[10px] text-white/40 font-label uppercase">Connected to: {user?.wallet_address}</p>
                 </div>
                 <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(255,107,0,0.5)] animate-pulse"></span>
                    <span className="text-[10px] font-label text-white uppercase tracking-widest">Live Ledger Index</span>
                 </div>
              </div>

              <div className="absolute inset-0 top-32 px-10 z-10">
                 <svg className="w-full h-48 overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                        <stop offset="50%" stopColor="#fff" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid Lines */}
                    {[0, 50, 100, 150, 200].map(y => (
                      <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
                    ))}

                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      d={generatePath(graphData)}
                      fill="none" 
                      stroke="url(#lineGradient)" 
                      strokeWidth="3" 
                      className="drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                    />

                    {/* Glowing Data Point Nodes */}
                    {graphData.map((p, i) => (
                      <motion.circle
                        key={i}
                        initial={{ r: 0 }}
                        animate={{ r: 4 }}
                        transition={{ delay: 1.5 + (i * 0.1) }}
                        cx={p.x} cy={p.y} fill="#fff"
                        className="shadow-[0_0_15px_white]"
                      />
                    ))}
                 </svg>
              </div>
           </div>

           {/* Ledger */}
           <section className="relative z-10">
              <h3 className="text-xs font-label text-outline uppercase tracking-[0.3em] mb-6 px-4">Transaction Ledger</h3>
              <div className="space-y-3">
                 {transactions.length > 0 ? transactions.map(tx => (
                    <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       key={tx.tx_id} 
                       className="group flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
                    >
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-xl overflow-hidden grayscale group-hover:grayscale-0 transition-all border border-white/10">
                             <img src={tx.nfts?.ipfs_cover_hash} className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <p className="font-headline font-bold text-white font-bright">{tx.nfts?.song_title}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-outline uppercase tracking-widest">Secondary Payout</span>
                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                <span className="text-[9px] text-white/30 font-label">{tx.tx_hash.slice(0, 10)}...</span>
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-headline font-bold text-primary">+{tx.price} {tx.currency}</p>
                          <p className="text-[9px] text-outline uppercase tracking-widest mt-1">Validated on {new Date(tx.timestamp).toLocaleDateString()}</p>
                       </div>
                    </motion.div>
                 )) : (
                    <div className="p-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10 text-center">
                       <p className="text-outline text-[10px] uppercase tracking-widest">No transaction streams detected for this wallet</p>
                    </div>
                 )}
              </div>
           </section>
        </div>

        {/* Sidebar Statistics */}
        <div className="col-span-12 lg:col-span-4 space-y-10 relative z-10">
           <div className="glass-panel p-10 rounded-[3rem] border border-white/5 bg-gradient-to-tr from-primary/10 to-transparent">
              <div className="flex justify-between items-start mb-1">
                 <p className="text-[10px] font-label text-outline uppercase tracking-widest">Total Yield</p>
                 <span className="material-symbols-outlined text-primary text-sm flex animate-pulse">account_balance_wallet</span>
              </div>
              <h2 className="text-4xl font-headline font-bold text-white tracking-tighter font-bright">
                 {parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                 <span className="text-xs font-label text-primary ml-2 uppercase">HLUSD</span>
              </h2>
              <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                 <div>
                    <p className="text-[9px] text-outline uppercase tracking-widest mb-2">Platform Power</p>
                    <div className="flex items-center gap-4">
                       <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '82%' }}
                            transition={{ duration: 2, delay: 0.5 }}
                            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          />
                       </div>
                       <span className="text-[10px] font-label text-white font-bold">TOP 2%</span>
                    </div>
                 </div>
              </div>
           </div>

            <section>
              <h3 className="text-xs font-label text-outline uppercase tracking-[0.3em] mb-6 px-4">Top Collectors</h3>
              <div className="space-y-4">
                 {[
                   { name: 'cryptonight.eth', tip: '7,500' },
                   { name: '0xAudioGeek', tip: '3,600' },
                   { name: 'nftmusic.sol', tip: '2,400' }
                 ].map((fan, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                       <div>
                          <p className="text-sm font-bold text-white">{fan.name}</p>
                          <p className="text-[9px] text-outline uppercase tracking-widest">Verified Fan</p>
                       </div>
                       <p className="text-xs font-bold text-primary">+{fan.tip} HLUSD</p>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </div>
    </motion.div>
  );
}

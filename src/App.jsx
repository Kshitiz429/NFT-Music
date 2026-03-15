import React from 'react';
import { Routes, Route, useLocation, Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Home from './pages/Home';
import ArtistProfile from './pages/ArtistProfile';
import RoyaltyTracker from './pages/RoyaltyTracker';
import MintMusic from './pages/MintMusic';
import ActiveBids from './pages/ActiveBids';
import Profile from './pages/Profile';
import TrackDetail from './pages/TrackDetail';
import Vault from './pages/Vault';
import MyMints from './pages/MyMints';
import Auth from './pages/Auth';
import Player from './components/Player';
import useStore from './store/useStore';

import { supabase } from './lib/supabase';
import { connectWallet, loginWithWallet } from './lib/blockchain';

function App() {
  const location = useLocation();
  const user = useStore(state => state.user);
  const login = useStore(state => state.login);
  const logout = useStore(state => state.logout);
  const setInitializing = useStore(state => state.setInitializing);
  React.useEffect(() => {
    // 1. Initial Session Check (Real + Demo Persistence)
    const restoreSession = async () => {
      try {
        // Priority 1: Real Supabase Session
        const { data: { session } } = await supabase.auth.getSession();
        
        let userId = session?.user?.id;
        let userEmail = session?.user?.email;

        // Priority 2: LocalStorage (for bypass/demo persistence)
        if (!userId) {
          const savedSession = localStorage.getItem('nftmusic_demo_session');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            userId = parsed.id;
            userEmail = parsed.email;
          }
        }

        if (userId) {
          // Fetch full profile from indexing database
          const { data: dbUser } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (dbUser) {
            login({
              ...dbUser,
              id: userId // Ensure ID is the database key
            });
            return;
          }

          // Fallback for real session without DB entry yet
          if (session) {
            const dbFallbackUser = {
              user_id: session.user.id,
              name: session.user.user_metadata?.username || 'Curator',
              email: session.user.email,
              wallet_address: '0x' + session.user.id.slice(0, 8),
              role: 'curator',
              balance: 10000.00
            };
            
            // Try pushing into database so API/RPC payments work seamlessly.
            await supabase.from('users').upsert([dbFallbackUser], { onConflict: 'user_id' }).catch(() => {});

            login({
              ...dbFallbackUser,
              id: session.user.id,
              balance: "10000.00"
            });
          }
        }
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();

    // 2. Wallet Event Listeners (Prevent Overwriting Real Sessions)
    const handleAccounts = (accounts) => {
      if (accounts.length > 0) {
        const address = accounts[0];
        const currentUser = useStore.getState().user;

        // ONLY auto-login if no user is present OR it's a legacy wallet-auth session
        if (!currentUser || currentUser.email === 'wallet-auth@hela.network') {
          // Check if this wallet is linked to a registered email
          supabase.from('users').select('*').eq('wallet_address', address).limit(1).then(({ data }) => {
             if (data && data.length > 0) {
                // If we found a registered user for this wallet, log them in!
                login(data[0]);
             } else {
                // Otherwise, legacy login
                const dbFallbackWallet = {
                  user_id: address,
                  name: address.slice(0, 6) + '...' + address.slice(-4),
                  email: 'wallet-auth@hela.network',
                  wallet_address: address,
                  role: 'curator',
                  balance: 10000.00
                };
                
                // Push wallet-only logins into database so they can execute RPC payments
                supabase.from('users').upsert([dbFallbackWallet], { onConflict: 'user_id' }).catch(() => {});

                login({
                  ...dbFallbackWallet,
                  id: address,
                  balance: "10000.00"
                });
             }
          });
        }
      } else {
        const currentUser = useStore.getState().user;
        if (currentUser?.email === 'wallet-auth@hela.network') {
          logout();
        }
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccounts);
    }

    // 3. Supabase Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        restoreSession();
      } else if (event === 'SIGNED_OUT') {
        const currentUser = useStore.getState().user;
        if (currentUser && currentUser.email !== 'wallet-auth@hela.network') {
          localStorage.removeItem('nftmusic_demo_session');
          logout();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccounts);
      }
    };
  }, []); // Run once on mount

  const setOwnedNftsStore = useStore(state => state.setOwnedNfts);
  const setMintedNftsStore = useStore(state => state.setMintedNfts);

  // 4. Fetch User Data (Owned vs Minted NFTs)
  React.useEffect(() => {
    const fetchOwned = async () => {
      if (user?.id) {
        const [ownedRes, mintedRes] = await Promise.all([
           // Fetch assets currently owned by this user
           supabase.from('nfts').select('*').eq('current_owner_id', user.id),
           // Fetch assets minted by this user
           supabase.from('nfts').select('*').eq('artist_id', user.id)
        ]);
        
        setOwnedNftsStore(ownedRes.data || []);
        setMintedNftsStore(mintedRes.data || []);
      } else {
        setOwnedNftsStore([]);
        setMintedNftsStore([]);
      }
    };
    fetchOwned();
  }, [user?.wallet_address, user?.id]);

  const handleLogout = async () => {
    if (user?.email !== 'wallet-auth@hela.network') {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('nftmusic_demo_session');
    logout();
  };

  const navItems = [
    { label: 'Mint', path: '/mint', protected: true },
    { label: 'My Mints', path: '/mints', protected: true },
    { label: 'The Vault', path: '/vault', protected: true },
    { label: 'Bids', path: '/bids', protected: true },
    { label: 'Royalties', path: '/royalty', protected: true },
  ];

  const filteredNav = navItems.filter(item => !item.protected || user);

  return (
    <div className="w-full bg-background min-h-screen text-on-background selection:bg-primary-container selection:text-on-primary-container font-body overflow-x-hidden">
      
      {/* Premium Pinterest-Style Floating Menu */}
      <header className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] w-auto">
        <nav className="relative bg-black/50 backdrop-blur-[50px] border border-white/20 rounded-full p-3 flex items-center gap-3 shadow-[0_30px_70px_rgba(0,0,0,0.8)] hover:border-white/40 transition-all duration-700 overflow-hidden">
          
          {/* Animated Glow Border */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 z-0 opacity-20 bg-[conic-gradient(from_0deg,transparent,white,transparent,white,transparent)] scale-150"
          />

          <div className="relative z-10 flex items-center gap-3">
            {/* Logo / Home link */}
            <Link to="/" className="flex items-center gap-4 pl-8 pr-10 border-r border-white/10 hover:opacity-80 transition-opacity">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center font-headline font-black text-[12px] text-black shadow-lg shadow-primary/30"
              >
                NM
              </motion.div>
              <span className="font-headline font-black text-base tracking-tighter text-white">NFTMUSIC</span>
            </Link>

            <div className="flex items-center gap-2 px-4">
              {filteredNav.map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  className={({ isActive }) => `relative px-10 py-3.5 text-[13px] font-label uppercase tracking-[0.2em] transition-all duration-500 rounded-full ${isActive ? 'text-black' : 'text-white/70 hover:text-white'}`}
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10 font-black">{item.label}</span>
                      {isActive && (
                        <motion.div 
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-white rounded-full z-0 shadow-[0_0_40px_rgba(255,255,255,0.6)]"
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 35,
                            mass: 1
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* User Profile / Status */}
            {user && (
              <div className="pl-8 pr-4 flex items-center border-l border-white/10 ml-2">
                <div className="flex items-center gap-6">
                  <Link to="/profile" className="flex items-center gap-3 group/user">
                    <motion.div 
                      whileHover={{ scale: 1.15, rotate: -5 }}
                      className="w-11 h-11 rounded-full bg-gradient-to-tr from-white/20 to-white/5 border border-white/30 flex items-center justify-center text-sm font-black text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] group-hover/user:border-primary transition-all"
                    >
                      {user.name?.[0] || '?'}
                    </motion.div>
                  </Link>
                  <button onClick={handleLogout} className="material-symbols-outlined text-white/40 hover:text-primary transition-all text-2xl hover:scale-125">logout</button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      <div className="pt-36 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/royalty" element={<RoyaltyTracker />} />
              <Route path="/mint" element={<MintMusic />} />
              <Route path="/mints" element={<MyMints />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/bids" element={<ActiveBids />} />
              <Route path="/track/:id" element={<TrackDetail />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
      <Player />
    </div>
  );
}

export default App;

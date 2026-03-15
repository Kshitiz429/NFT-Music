import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';
import { loginWithWallet } from '../lib/blockchain';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 }
};

export default function Auth() {
  const user = useStore(state => state.user);
  const login = useStore(state => state.login);
  const navigate = useNavigate();

  // Login Flow State
  const [loginStep, setLoginStep] = useState(1); 
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'signin'
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('rather_not_say');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  return (
    <motion.div 
      initial="initial" animate="in" exit="out" variants={pageVariants}
      className="min-h-[80vh] flex items-center justify-center p-6 relative"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-xl relative">
        <div className="glass-panel p-12 rounded-[4rem] border border-white/10 relative z-10 backdrop-blur-3xl bg-black/40 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
          <AnimatePresence mode="wait">
            {loginStep === 1 && (
              <motion.div 
                key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="space-y-8"
              >
                {/* Mode Selector */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-8">
                   <button 
                     onClick={() => setAuthMode('signup')}
                     className={`flex-1 py-3 rounded-xl font-label text-[10px] uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-white text-black font-black' : 'text-outline hover:text-white'}`}
                   >
                     Create Account
                   </button>
                   <button 
                     onClick={() => setAuthMode('signin')}
                     className={`flex-1 py-3 rounded-xl font-label text-[10px] uppercase tracking-widest transition-all ${authMode === 'signin' ? 'bg-white text-black font-black' : 'text-outline hover:text-white'}`}
                   >
                     Sign In
                   </button>
                </div>

                <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-4xl font-headline font-bold text-white tracking-tighter uppercase font-bright">
                    {authMode === 'signup' ? 'Registry Details' : 'Welcome Back'}
                  </h2>
                  <p className="text-outline text-[10px] uppercase tracking-widest">
                    {authMode === 'signup' ? 'Provide your credentials for the secure database' : 'Access your secure vault signature'}
                  </p>
                </div>

                <div className="space-y-5">
                   {authMode === 'signup' && (
                     <>
                       <div className="space-y-2">
                          <label className="text-[9px] font-label text-outline uppercase tracking-widest px-4 font-black">Full Legal Name</label>
                          <input 
                            type="text" value={username} onChange={e => setUsername(e.target.value)}
                            placeholder="Genesis Name..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-primary/40 transition-all text-sm font-label"
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[9px] font-label text-outline uppercase tracking-widest px-4 font-black">Age Index</label>
                             <input 
                               type="number" value={age} onChange={e => setAge(e.target.value)}
                               placeholder="21"
                               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-primary/40 transition-all text-sm font-label"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-label text-outline uppercase tracking-widest px-4 font-black">Gender Node</label>
                             <select 
                               value={gender} onChange={e => setGender(e.target.value)}
                               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-primary/40 transition-all text-sm font-label appearance-none cursor-pointer"
                             >
                                <option value="rather_not_say" className="bg-black text-white">Select...</option>
                                <option value="male" className="bg-black text-white">Male</option>
                                <option value="female" className="bg-black text-white">Female</option>
                                <option value="non_binary" className="bg-black text-white">Non-Binary</option>
                             </select>
                          </div>
                       </div>
                     </>
                   )}

                   <div className="space-y-2">
                      <label className="text-[9px] font-label text-outline uppercase tracking-widest px-4 font-black">Gmail Address</label>
                      <input 
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="name@gmail.com"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-primary/40 transition-all text-sm font-label"
                      />
                   </div>
                </div>

                <button 
                  onClick={async () => {
                    if (authMode === 'signup' && (!username || !age || !email)) {
                      alert("Complete all registry fields.");
                      return;
                    }
                    if (authMode === 'signin' && !email) {
                      alert("Enter your registered email.");
                      return;
                    }

                    // Reset any old session
                    localStorage.removeItem('nftmusic_demo_session');
                    login(null); 
                    
                    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                      alert("Please enter a valid Gmail address.");
                      return;
                    }
                    
                    setIsLoggingIn(true);
                    try {
                      const { error } = await supabase.auth.signInWithOtp({
                        email: email,
                        options: { shouldCreateUser: authMode === 'signup' }
                      });
                      
                      if (error) {
                        if (error.message.includes('rate limit')) {
                           alert(`MAIL LIMIT REACHED: The secure server is currently throttled. \n\nPROCEEDING IN DEV MODE: Use passcode 000000 on the next screen.`);
                           setLoginStep(2);
                           return;
                        }
                        throw error;
                      }
                      
                      alert(`SECURITY SYNC: A verification sequence has been dispatched to ${email}.`);
                      setLoginStep(2);
                      setResendTimer(60);
                    } catch (err) {
                      console.error("OTP Dispatch Failure:", err);
                      alert(`Mail Protocol Error: ${err.message}\n\nNote: For dev bypass, enter any email and use '000000' in the next step.`);
                      setLoginStep(2); 
                    } finally {
                      setIsLoggingIn(false);
                    }
                  }}
                  disabled={isLoggingIn}
                  className="w-full py-5 bg-white text-black rounded-[2rem] font-headline font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-2xl disabled:opacity-50"
                >
                   {isLoggingIn ? 'DISPATCHING...' : authMode === 'signup' ? 'Proceed to Verification' : 'Initialize Session'}
                </button>
              </motion.div>
            )}

            {loginStep === 2 && (
              <motion.div 
                key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="space-y-8 text-center"
              >
                <div className="space-y-2">
                  <button onClick={() => setLoginStep(1)} className="text-white/40 hover:text-white flex items-center justify-center gap-2 mb-4 mx-auto">
                     <span className="material-symbols-outlined text-sm">arrow_back</span>
                     <span className="text-[10px] uppercase font-label tracking-widest">Edit Details</span>
                  </button>
                  <h2 className="text-4xl font-headline font-bold text-white tracking-tighter uppercase font-bright">Gmail Secure Sync</h2>
                  <p className="text-outline text-[10px] uppercase tracking-widest leading-relaxed">
                    Enter the 6-digit OTP sent to <span className="text-white">{email}</span>
                    <br/>
                    <span className="text-primary/60 text-[8px] tracking-tighter">(Dev Tip: Use 000000 if testing locally)</span>
                  </p>
                </div>

                 <div className="flex justify-center gap-2 py-4">
                   {[...Array(6)].map((_, i) => (
                      <input 
                        key={i} 
                        id={`otp-${i}`}
                        type="text" 
                        maxLength="1" 
                        value={otp[i]} 
                        onChange={e => {
                           const val = e.target.value;
                           if (/^\d*$/.test(val)) {
                             const newOtp = [...otp];
                             newOtp[i] = val.slice(-1);
                             setOtp(newOtp);
                             
                             // Auto-focus next
                             if (val && i < 5) {
                               document.getElementById(`otp-${i+1}`).focus();
                             }
                           }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Backspace' && !otp[i] && i > 0) {
                            document.getElementById(`otp-${i-1}`).focus();
                          }
                        }}
                        className="w-12 h-16 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold text-primary outline-none focus:border-primary transition-all focus:bg-white/10"
                      />
                   ))}
                </div>

                <button 
                  onClick={async () => {
                    const fullOtp = otp.join('');
                    if (fullOtp.length !== 6) {
                      alert("Please enter the complete 6-digit code.");
                      return;
                    }

                    setIsLoggingIn(true);
                    try {
                      let session = null;
                      let error = null;

                      // 1. Verify OTP (with bypass for demo)
                      if (fullOtp === '000000') {
                        console.log("🛠️ Demo Bypass Active");
                      } else {
                        const { error: otpError } = await supabase.auth.verifyOtp({
                          email: email,
                          token: fullOtp,
                          type: 'signup'
                        });
                        error = otpError;
                        const { data } = await supabase.auth.getSession();
                        session = data?.session;
                      }
                      
                      const isDemo = fullOtp === '000000' || email.includes('demo');
                      
                      if (!isDemo && (error || !session)) {
                         throw error || new Error("Session stabilization failed. Check OTP or try again.");
                      }

                       // 2. Fetch or Create User Profile
                       const emailHash = btoa(email.toLowerCase()).slice(0, 12);
                       const finalUserId = (session && session.user.email === email) 
                         ? session.user.id 
                         : `user-${emailHash}`;

                       let existingUser = null;
                       const { data: dbUser } = await supabase.from('users').select('*').eq('user_id', finalUserId).single();
                       existingUser = dbUser;

                       if (authMode === 'signup') {
                         alert("Email Verified! Now connecting your MetaMask to finalize the account linkage.");
                         const { address } = await loginWithWallet();

                         const dbUserData = {
                           user_id: finalUserId,
                           name: username,
                           email: email.toLowerCase(),
                           wallet_address: address,
                           age: age,
                           gender: gender,
                           role: 'curator',
                           balance: 10000.00
                         };

                         const { error: upsertError } = await supabase.from('users').upsert(dbUserData, { onConflict: 'user_id' });
                         if (upsertError) throw upsertError;
                         
                         login({ ...dbUserData, id: finalUserId });
                       } else {
                         // SIGN IN FLOW
                         if (!existingUser && !isDemo) {
                           throw new Error("Account not found. Please switch to 'Create Account'.");
                         }
                         
                         const userData = existingUser || {
                           id: finalUserId,
                           user_id: finalUserId,
                           email: email.toLowerCase(),
                           name: email.split('@')[0],
                           wallet_address: '0x...',
                           role: 'curator'
                         };
                         
                         login(userData);
                       }

                       // 5. Persist
                       if (!session) {
                         localStorage.setItem('nftmusic_demo_session', JSON.stringify({
                           id: finalUserId,
                           email: email
                         }));
                       }

                       navigate('/');
                     } catch (err) {
                       console.error("Auth Sequence Failed:", err);
                       alert("Authentication Failed: " + err.message);
                     } finally {
                       setIsLoggingIn(false);
                     }
                   }}
                   disabled={isLoggingIn}
                   className="w-full py-5 bg-primary/20 border border-primary/40 text-primary rounded-[2rem] font-headline font-black text-xs uppercase tracking-[0.2em] hover:bg-primary/30 transition-all disabled:opacity-50"
                 >
                    {isLoggingIn ? 'FINALIZING...' : authMode === 'signup' ? 'Verify & Create Account' : 'Verify & Enter Vault'}
                 </button>
                <p className="text-[9px] text-white/20 uppercase tracking-widest leading-relaxed">
                  Haven't received? 
                  <button 
                    disabled={resendTimer > 0 || isLoggingIn}
                    className="text-white underline cursor-pointer px-1 disabled:opacity-30" 
                    onClick={async () => {
                      setIsLoggingIn(true);
                      try {
                        const { error } = await supabase.auth.signInWithOtp({ email });
                        if (error) throw error;
                        alert("OTP Refreshed! Check your inbox.");
                        setResendTimer(60);
                      } catch (err) {
                        alert("Protocol Error: " + err.message);
                      } finally {
                        setIsLoggingIn(false);
                      }
                    }}
                  >
                    {resendTimer > 0 ? `Retry in ${resendTimer}s` : 'Resend OTP'}
                  </button> • 
                  <button className="text-white underline cursor-pointer px-1" onClick={() => { setLoginStep(1); setOtp(['','','','','','']); }}>
                     Change Identity
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

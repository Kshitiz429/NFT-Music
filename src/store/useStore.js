import { create } from 'zustand'

const useStore = create((set) => ({
  user: null, // { id, wallet_address, name, role }
  artistProfile: null, // if role is artist
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null, artistProfile: null }),
  setArtistProfile: (profile) => set({ artistProfile: profile }),

  // Auth State
  isInitializing: true,
  setInitializing: (val) => set({ isInitializing: val }),

  // Audio Player State
  currentTrack: null, // Will hold NFT/track object
  isPlaying: false,
  isAnyModalOpen: false,

  // User Owned Assets
  ownedNfts: [],
  setOwnedNfts: (nfts) => set({ ownedNfts: nfts }),
  addOwnedNft: (nft) => set((state) => ({ 
    ownedNfts: state.ownedNfts.some(n => n.nft_id === nft.nft_id) 
      ? state.ownedNfts 
      : [...state.ownedNfts, nft] 
  })),
  removeOwnedNft: (nftId) => set((state) => ({ 
    ownedNfts: state.ownedNfts.filter(n => n.nft_id !== nftId)
  })),
  updateOwnedNft: (nft) => set((state) => ({ 
    ownedNfts: state.ownedNfts.map(n => n.nft_id === nft.nft_id ? { ...n, ...nft } : n)
  })),

  // User Minted Assets
  mintedNfts: [],
  setMintedNfts: (nfts) => set({ mintedNfts: nfts }),
  addMintedNft: (nft) => set((state) => ({ 
    mintedNfts: state.mintedNfts.some(n => n.nft_id === nft.nft_id) 
      ? state.mintedNfts 
      : [...state.mintedNfts, nft] 
  })),
  updateMintedNft: (nft) => set((state) => ({
    mintedNfts: state.mintedNfts.map(n => n.nft_id === nft.nft_id ? { ...n, ...nft } : n)
  })),

  setModalOpen: (isOpen) => set({ isAnyModalOpen: isOpen }),
  playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
}))

export default useStore

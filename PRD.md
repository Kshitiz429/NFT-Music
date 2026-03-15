
NFTMusic
Decentralized Music NFT Marketplace
Product Requirements Document (PRD)
Version 1.0  |  March 2026
Status: Draft

Confidential — Internal Use Only
 
Table of Contents


 
1. Product Overview
NFTMusic is a decentralized music NFT marketplace that empowers artists to mint, sell, and earn royalties from their music through blockchain technology. The platform bridges the gap between the music industry and Web3, creating a creator-first ecosystem.

VISION: NFTMusic enables artists to maintain true ownership of their work while fans participate in the music economy as collectors and curators — not just listeners.

Artists can upload audio files in MP3 or WAV format, mint them as NFTs on multiple blockchains, and sell directly to fans without intermediaries. Buyers can collect, trade, and create playlists from the music NFTs they own, fostering a rich community-driven experience.

Key differentiators of the platform:
•	Automated royalty distribution via ERC-2981 smart contracts
•	Multi-chain support: Ethereum, Solana, and Polygon
•	AI-generated album artwork when no cover is provided
•	Fan tipping and direct artist support mechanisms
•	Curator-driven playlist economy

2. Product Vision
NFTMusic aims to create a creator-first music economy built on three foundational pillars:

Pillar	Description	Mechanism
Artist Ownership	Artists retain full rights to their music	Immutable on-chain ownership records
Fan Collecting	Fans own music as verifiable digital assets	ERC-721 NFT standard
Automated Royalties	Artists earn on every resale automatically	ERC-2981 royalty standard

3. Target Users
3.1 Artists
Independent musicians who want to monetize music through NFTs. These users are comfortable with crypto wallets and seek alternatives to traditional streaming platforms.
•	Primary goal: Mint and sell music NFTs
•	Secondary goal: Track royalties and fan engagement
•	Technical comfort: Medium to high

3.2 Fans / Collectors
Music enthusiasts who want to collect and trade exclusive music as digital assets. They are motivated by both passion for music and investment potential.
•	Primary goal: Discover and collect music NFTs
•	Secondary goal: Build valuable music collections
•	Technical comfort: Low to medium

3.3 Curators
Power users who build playlists from owned NFTs, showcase collections, and act as taste-makers in the community.
•	Primary goal: Create and share curated playlists
•	Secondary goal: Build reputation as tastemakers
•	Technical comfort: Medium

4. Core Features
4.1 Artist Wallet Login
Authentication is handled entirely through crypto wallets, eliminating passwords and providing cryptographic security guarantees.

Supported Wallets:
•	MetaMask — Browser extension, Ethereum/EVM chains
•	WalletConnect — Mobile-friendly, multi-chain protocol
•	Phantom — Native Solana wallet

Authentication Flow:

1. User clicks 'Connect Wallet' button
↓
2. Wallet extension / app opens
↓
3. Backend generates a unique nonce (challenge message)
↓
4. User signs the nonce with their private key
↓
5. Backend verifies the signature against the wallet address
↓
6. JWT session token issued — user is authenticated

IMPLEMENTATION: Signatures are verified server-side using ethers.js verifyMessage() for EVM chains and @solana/web3.js for Phantom. Sessions expire after 24 hours.

4.2 Artist Profile
Each artist gets a rich profile page displaying their identity, catalog, and performance metrics.

Profile Field	Type	Description
Artist Name	String	Display name shown publicly
Real Name	String	Legal name (optional, private)
Bio	Text (500 chars)	Artist biography
Wallet Address	String	Ethereum/Solana address
Social Links	Array	Twitter, Instagram, Spotify, etc.
Profile Image	IPFS Hash	Avatar stored on IPFS

Artist Statistics Dashboard:

Metric	Source	Update Frequency
Total NFTs Minted	Smart contract events	Real-time
Total Sales Volume	Transaction records	Real-time
Total Royalties Earned	Royalty distribution events	Real-time
Follower Count	Platform database	On follow/unfollow

4.3 MintForm — Music Upload & NFT Creation
The MintForm is the primary interface for artists to transform audio files into on-chain NFTs. It handles file validation, IPFS upload, metadata construction, and smart contract interaction.

Form Fields:

Field	Type	Validation	Required
Song Title	String	Max 100 chars	Yes
Artist Name	String	Max 100 chars	Yes
Real Name	String	Max 100 chars	No
Email (Gmail)	Email	Valid email format	Yes
Genre	Dropdown	Predefined list	Yes
Music File	File	MP3/WAV, max 50MB	Yes
Cover Image	File	JPG/PNG, max 5MB	No (AI-generated if absent)
Price	Number	Min 0.001	Yes
Currency	Dropdown	ETH / SOL / MATIC	Yes
Royalty %	Number	0–50%	Yes
Description	Textarea	Max 1000 chars	No

Minting Workflow:

1. Artist completes MintForm and submits
↓
2. Frontend validates all fields client-side
↓
3. Backend validates and receives audio file
↓
4. Audio file uploaded to IPFS via Pinata/Infura
↓
5. IPFS returns Content Identifier (CID / hash)
↓
6. If no cover image: AI generates 1024×1024 artwork
↓
7. Cover image uploaded to IPFS — CID returned
↓
8. Metadata JSON constructed (ERC-721 compatible)
↓
9. Metadata JSON uploaded to IPFS — final CID returned
↓
10. Frontend calls mintNFT() on smart contract with metadata CID
↓
11. User signs the transaction in their wallet
↓
12. NFT minted on-chain — listed on marketplace automatically

4.4 Automatic Cover Image Generation
When an artist does not upload a cover image, the platform automatically generates professional album artwork using AI, ensuring every NFT looks polished on the marketplace.

Generation Parameters:
•	Song title — used as the primary prompt subject
•	Genre — informs visual style and color palette
•	Artist name — incorporated as text or motif

Technical Specifications:
•	Output resolution: 1024 × 1024 pixels
•	Format: PNG with transparency support
•	Storage: IPFS — immutable once minted
•	AI Service: Stable Diffusion / DALL-E API (configurable)

UX NOTE: Generated artwork becomes permanently associated with the NFT metadata on IPFS. Artists can preview before minting and regenerate if unsatisfied.

4.5 NFTCard Component
The NFTCard is the fundamental display unit for music NFTs across the marketplace. It provides at-a-glance information and primary interaction points.

Displayed Information:
•	Cover image (1:1 ratio, lazy-loaded)
•	Song title and artist name
•	Price in native currency (ETH/SOL/MATIC) with USD equivalent
•	Blockchain network badge (Ethereum / Solana / Polygon)
•	Play preview button — triggers 30-second audio preview
•	Buy Now button — initiates purchase flow

Interaction Features:
•	Hover animation — subtle scale transform and shadow elevation
•	30-second audio preview via HTML5 Audio API
•	Click-through to full NFT Detail Page
•	Wishlist / favorite toggle

4.6 Marketplace Grid
The Marketplace Grid is the primary discovery interface — a responsive masonry-style grid of NFTCards that users browse and explore.

Filtering Options:
Filter	Options
Genre	Hip-Hop, Pop, Rock, Electronic, Jazz, Classical, R&B, Country, Other
Price Range	Custom min/max input in ETH/SOL/MATIC
Artist	Search by artist name or wallet address
Blockchain	Ethereum, Solana, Polygon, All
Time	Trending (24h), Recently Minted, All Time

Sorting Options:
•	Lowest price first
•	Highest price first
•	Most popular (by plays / purchases)
•	Newest first
•	Ending soon (for auctions, future feature)

4.7 NFT Detail Page
Each NFT has a dedicated detail page providing full context and enabling purchase. This is the conversion-focused page of the marketplace.

Page Sections:
•	Hero — full-resolution album cover with audio player
•	Track Info — title, artist, genre, description, mint date
•	Pricing — current price, currency, USD equivalent
•	Ownership — current owner wallet address (abbreviated)
•	Royalty Info — percentage artist earns on resales
•	Ownership History — chronological transfer log
•	Artist Profile Card — links to artist's full profile
•	Buy Button — triggers wallet transaction flow

4.8 PlaylistBuilder
The PlaylistBuilder allows collectors to curate playlists from NFTs they own, enabling a new form of creative expression and community sharing.

Eligibility: Only NFTs in the user's wallet can be added to playlists, enforced on-chain.

Features:
•	Drag-and-drop NFT ordering within playlists
•	Playlist name and description fields
•	Public or private visibility toggle
•	Shareable playlist link with embed code
•	Sequential audio playback of owned tracks

PlaylistBuilder Workflow:

1. User navigates to PlaylistBuilder
↓
2. System loads all NFTs in user's wallet
↓
3. User creates new playlist (name + description)
↓
4. User drags NFTs from library into playlist
↓
5. User sets visibility (public / private)
↓
6. User saves playlist — stored in platform database
↓
7. Share link generated for public playlists

4.9 RoyaltyTracker Dashboard
The RoyaltyTracker gives artists real-time visibility into earnings from primary sales and secondary market resales.

Dashboard Metrics:
Widget	Data Source	Description
Total Royalties Earned	On-chain events	Cumulative royalty income across all NFTs
Earnings Per NFT	Filtered on-chain events	Breakdown by individual track
Sales History	Transaction records	All primary and secondary sales
Resale Transactions	Marketplace events	Secondary sales triggering royalties
Royalty Rate	Smart contract state	Current configured percentage

ROYALTY EXAMPLE: Example: Song NFT originally sold at 1 ETH with 10% royalty. Resold at 3 ETH → Artist automatically receives 0.3 ETH. The original seller receives 2.7 ETH.

4.10 Automated Royalty System
NFTMusic implements royalties at the smart contract level using ERC-2981, ensuring artists are compensated on every secondary sale regardless of the marketplace facilitating the transaction.

Standard: ERC-2981 — NFT Royalty Standard (Ethereum) with Solana equivalents via Metaplex Creator Shares.

Royalty Distribution Flow:

1. Collector lists NFT for resale on marketplace
↓
2. Buyer purchases NFT — transaction initiated
↓
3. Smart contract intercepts the transfer
↓
4. royaltyInfo() called to calculate artist's cut
↓
5. Royalty amount automatically sent to artist wallet
↓
6. Remaining amount forwarded to the seller
↓
7. RoyaltyPaid event emitted — captured by RoyaltyTracker

4.11 Fan Engagement — Tipping
Fans can directly support artists and specific tracks using crypto tips, building stronger artist-fan relationships without platform intermediaries taking a cut.

Tip Targets:
•	Tip an artist directly (goes to artist wallet)
•	Tip on a specific song/NFT

Supported Currencies:
•	ETH — Ethereum mainnet
•	SOL — Solana mainnet
•	MATIC — Polygon network

Top Supporters Leaderboard: Publicly displays the most generous tippers per artist, rewarding fan loyalty with social recognition.

Tip Flow:

1. Fan clicks 'Tip Artist' button
↓
2. Tip amount input modal appears
↓
3. Fan enters amount and selects currency
↓
4. Wallet opens requesting transaction confirmation
↓
5. Fan confirms — crypto transferred on-chain
↓
6. Artist receives funds in wallet instantly
↓
7. Tip recorded in platform database
↓
8. Leaderboard updated in real-time

5. Technical Architecture
5.1 System Overview
NFTMusic uses a layered architecture separating the frontend, backend API, blockchain layer, and decentralized storage.

Layer	Technology	Responsibility
Frontend	Next.js 14 + React + TailwindCSS	User interface, wallet integration, audio playback
Backend API	Node.js + Express	Auth, business logic, data persistence
Blockchain	Ethereum / Solana / Polygon	NFT minting, ownership, royalties
Storage	IPFS (Pinata / Infura)	Audio files, images, metadata JSON
Database	PostgreSQL	Off-chain data: users, playlists, analytics

5.2 Frontend Stack
Category	Library / Tool	Version	Purpose
Framework	Next.js	14+	SSR, routing, API routes
UI Library	React	18+	Component architecture
Styling	TailwindCSS	3+	Utility-first CSS
Web3 (EVM)	Ethers.js	6+	Wallet connection, contract calls
Web3 (alt)	Web3.js	4+	Fallback EVM provider
Solana	@solana/web3.js	Latest	Solana RPC and transactions
Wallet	WalletConnect v2	Latest	Multi-wallet protocol
Audio	Howler.js	Latest	30-second previews
DnD	react-beautiful-dnd	Latest	Playlist drag-and-drop
State	Zustand	Latest	Global state management

5.3 Backend Stack & Services
The backend is a Node.js REST API organized into domain-specific services:

Service	Responsibilities	Key Endpoints
Auth Service	Wallet signature verification, JWT issuance/validation	POST /auth/verify, POST /auth/refresh
NFT Minting Service	IPFS upload orchestration, smart contract calls, metadata construction	POST /nft/mint, GET /nft/:id
Marketplace Service	Listing management, search, filtering, sorting	GET /marketplace, POST /marketplace/list
Playlist Service	CRUD for playlists, ownership validation	POST /playlist, GET /playlist/:id, PUT /playlist/:id
Royalty Tracking Service	Blockchain event indexing, royalty calculations, dashboard data	GET /royalties/:artistId
Tip Service	Tip transactions, leaderboard management	POST /tip, GET /leaderboard/:artistId

5.4 Storage Architecture
All media files and NFT metadata are stored on IPFS for immutability and decentralization. The platform uses Pinata as the primary pinning service.

Asset Type	IPFS Path	Notes
Music File (MP3/WAV)	ipfs://<audio-cid>	Uploaded first, CID embedded in metadata
Cover Image (JPG/PNG)	ipfs://<cover-cid>	AI-generated if not provided by artist
NFT Metadata JSON	ipfs://<metadata-cid>	ERC-721 compatible, references audio + cover CIDs
Artist Profile Image	ipfs://<avatar-cid>	Uploaded at profile creation

5.5 Smart Contract Architecture
Smart contracts are deployed on Ethereum (mainnet + Sepolia testnet), Polygon, and Solana. They handle all on-chain logic.

Key Contract Functions:
Function	Parameters	Description
mintNFT()	metadataCID, royaltyBPS	Mints new NFT, sets royalty receiver
buyNFT()	tokenId	Transfers ownership, distributes payment
resellNFT()	tokenId, price	Lists owned NFT for resale
transferNFT()	tokenId, toAddress	Direct wallet-to-wallet transfer
setRoyalty()	tokenId, royaltyBPS	Updates royalty rate (owner only)
tipArtist()	artistAddress	Sends ETH/token tip directly to artist
royaltyInfo()	tokenId, salePrice	ERC-2981: returns royalty amount

SECURITY: All contracts will be audited before mainnet deployment. Reentrancy guards via OpenZeppelin ReentrancyGuard. Access control via Ownable.

6. Database Schema
PostgreSQL stores all off-chain data. On-chain data is indexed via event listeners and cached for performance.

6.1 Users Table
Column	Type	Constraints	Description
user_id	UUID	PK, NOT NULL	Unique user identifier
wallet_address	VARCHAR(64)	UNIQUE, NOT NULL	Primary wallet address
name	VARCHAR(100)	NULL	Display name
email	VARCHAR(255)	NULL	Contact email
role	ENUM	NOT NULL, DEFAULT 'fan'	fan | artist | curator | admin
created_at	TIMESTAMP	NOT NULL	Account creation timestamp

6.2 Artists Table
Column	Type	Constraints	Description
artist_id	UUID	PK, FK → users.user_id	Links to users table
artist_name	VARCHAR(100)	UNIQUE, NOT NULL	Public display name
bio	TEXT	NULL	Artist biography
profile_image	VARCHAR(255)	NULL	IPFS hash of avatar
social_links	JSONB	NULL	{ twitter, instagram, ... }
verified	BOOLEAN	DEFAULT false	Platform verification status

6.3 NFTs Table
Column	Type	Constraints	Description
nft_id	UUID	PK	Internal NFT identifier
token_id	BIGINT	UNIQUE, NOT NULL	On-chain token ID
song_title	VARCHAR(200)	NOT NULL	Track name
artist_id	UUID	FK → artists.artist_id	Creator reference
price	NUMERIC(18,8)	NOT NULL	Current listing price
currency	VARCHAR(10)	NOT NULL	ETH | SOL | MATIC
royalty_percent	SMALLINT	CHECK (0-50)	Secondary sale royalty %
ipfs_audio_hash	VARCHAR(255)	NOT NULL	Audio file CID
ipfs_cover_hash	VARCHAR(255)	NOT NULL	Cover image CID
ipfs_metadata_hash	VARCHAR(255)	UNIQUE	Metadata JSON CID
chain	VARCHAR(20)	NOT NULL	ethereum | solana | polygon
minted_at	TIMESTAMP	NOT NULL	Mint timestamp
is_listed	BOOLEAN	DEFAULT true	Active marketplace listing

6.4 Transactions Table
Column	Type	Constraints	Description
tx_id	UUID	PK	Internal transaction ID
nft_id	UUID	FK → nfts.nft_id	NFT involved
tx_hash	VARCHAR(128)	UNIQUE	On-chain transaction hash
buyer_wallet	VARCHAR(64)	NOT NULL	Buyer's wallet address
seller_wallet	VARCHAR(64)	NOT NULL	Seller's wallet address
price	NUMERIC(18,8)	NOT NULL	Sale price
currency	VARCHAR(10)	NOT NULL	ETH | SOL | MATIC
tx_type	ENUM	NOT NULL	primary_sale | secondary_sale | transfer
timestamp	TIMESTAMP	NOT NULL	Transaction timestamp

6.5 Playlists Table
Column	Type	Constraints	Description
playlist_id	UUID	PK	Unique playlist ID
owner_wallet	VARCHAR(64)	NOT NULL	Playlist creator's address
playlist_name	VARCHAR(200)	NOT NULL	Display name
description	TEXT	NULL	Playlist description
nft_list	UUID[]	NOT NULL	Ordered array of nft_ids
visibility	ENUM	DEFAULT 'private'	public | private
created_at	TIMESTAMP	NOT NULL	Creation timestamp
updated_at	TIMESTAMP	NOT NULL	Last modification timestamp

7. Backend API Specification
All API endpoints are RESTful JSON. Authentication uses JWT Bearer tokens obtained via wallet signature verification.

7.1 Authentication Endpoints
Method	Endpoint	Auth	Description
GET	/api/auth/nonce	None	Get nonce for wallet to sign
POST	/api/auth/verify	None	Verify signature, receive JWT
POST	/api/auth/refresh	JWT	Refresh expired JWT token
DELETE	/api/auth/logout	JWT	Invalidate session

7.2 NFT Endpoints
Method	Endpoint	Auth	Description
POST	/api/nft/mint	JWT (Artist)	Upload to IPFS + mint NFT
GET	/api/nft/:id	None	Get single NFT details
GET	/api/nft/:id/history	None	Ownership history
PATCH	/api/nft/:id/price	JWT (Owner)	Update listing price
DELETE	/api/nft/:id/listing	JWT (Owner)	Remove from marketplace

7.3 Marketplace Endpoints
Method	Endpoint	Auth	Description
GET	/api/marketplace	None	List NFTs with filters/sort/pagination
POST	/api/marketplace/buy/:id	JWT	Purchase NFT — triggers on-chain tx
GET	/api/marketplace/trending	None	Trending NFTs (24h volume)
GET	/api/marketplace/search	None	Full-text search by title/artist

7.4 Artist & User Endpoints
Method	Endpoint	Auth	Description
GET	/api/artist/:id	None	Artist public profile
PUT	/api/artist/:id	JWT (Self)	Update artist profile
GET	/api/artist/:id/nfts	None	All NFTs by artist
GET	/api/artist/:id/royalties	JWT (Self)	Royalty dashboard data
POST	/api/user/:id/follow	JWT	Follow an artist
DELETE	/api/user/:id/follow	JWT	Unfollow an artist

7.5 Playlist Endpoints
Method	Endpoint	Auth	Description
POST	/api/playlist	JWT	Create new playlist
GET	/api/playlist/:id	Conditional	Get playlist (public or owner)
PUT	/api/playlist/:id	JWT (Owner)	Update playlist (name, tracks, order)
DELETE	/api/playlist/:id	JWT (Owner)	Delete playlist
GET	/api/user/:id/playlists	Conditional	All playlists by user

7.6 Tip Endpoints
Method	Endpoint	Auth	Description
POST	/api/tip/artist/:id	JWT	Record tip to artist (post on-chain tx)
POST	/api/tip/nft/:id	JWT	Record tip on specific NFT
GET	/api/tip/leaderboard/:artistId	None	Top supporters leaderboard

8. Security Architecture
Security Domain	Measure	Details
Authentication	Wallet Signature Auth	cryptographic proof, no passwords stored
API Authorization	JWT Bearer Tokens	Short-lived (24h), refreshable
Smart Contracts	OpenZeppelin Ownable	Role-based function access
Smart Contracts	ReentrancyGuard	Prevents reentrancy attacks on payable functions
Smart Contracts	Independent Audit	Required before mainnet deployment
Storage	IPFS Hash Verification	Content-addressed — any change invalidates CID
Frontend	Content Security Policy	Strict CSP headers on Next.js
Infrastructure	Rate Limiting	express-rate-limit on all endpoints
Infrastructure	HTTPS / TLS	Enforced on all endpoints

9. Future Enhancements
The following features are planned for future versions but are out of scope for v1.0:

Feature	Priority	Description
Fractional Ownership	High	Split NFT ownership across multiple fans
Fan DAO Governance	Medium	Token holders vote on platform decisions
Live Music Streaming	High	Stream music directly from NFT (not just preview)
AI Music Discovery	Medium	Personalized recommendations via ML
NFT Concert Tickets	Medium	Event ticketing tied to NFT ownership
Auction Mechanism	High	Time-based auctions with bid increments
Collab NFTs	Low	Multiple artists co-minting a single NFT
Mobile App	High	Native iOS/Android apps

10. Success Metrics
The following KPIs will be tracked from day one of public launch:

KPI	Target (6 months)	Measurement Method
Artists Onboarded	500+	User registrations with role = artist
NFTs Minted	5,000+	Smart contract mint events
Marketplace Volume	$500,000+ USD	Sum of all transaction values
Royalty Payouts	$50,000+ USD	Sum of all royalty distributions
Playlist Creations	1,000+	Database playlist count
Monthly Active Users	10,000+	Authenticated sessions per month
Average Session Duration	8+ minutes	Frontend analytics
Smart Contract Uptime	99.9%	On-chain availability monitoring

Document Information
Field	Value
Document Title	NFTMusic — Product Requirements Document
Version	1.0
Status	Draft
Date	March 2026
Owner	Product Team
Audience	Engineering, Design, Blockchain, QA
Next Review	April 2026

NOTE: This PRD is a living document. All sections will be updated as requirements evolve through stakeholder reviews and technical discovery.


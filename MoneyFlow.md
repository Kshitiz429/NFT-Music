Asset Creation / Listing
At the beginning, an NFT Asset is created or listed on the platform.
An Asset represents the digital item being traded on the marketplace (for example: digital art, music, collectibles, etc.).
When the asset is listed:
The creator/owner uploads the NFT
A selling price is set
A royalty percentage may also be defined
The asset becomes available for purchase on the marketplace.
2. First Purchase (Buyer 1)
When a Buyer purchases the asset from the creator or initial seller:
Money Flow:
Buyer → Platform → Creator/Seller
The total payment made by the buyer is split into two parts:
Platform Fee
Seller Amount
Platform Fee
The marketplace charges a platform fee for facilitating the transaction.
Example: 2–5% of the sale price.
Example:
Asset price = $100
Platform fee = 5% = $5
Seller receives = $95
So the platform earns revenue from each transaction.
3. Asset Resell (Secondary Market)
After Buyer 1 purchases the asset, they become the new owner of the NFT.
They can resell the asset to another buyer (Buyer 2).
This is called the secondary market sale.
Flow:
Buyer 1 → lists NFT again → Buyer 2 purchases
4. Money Flow During Resale
When the NFT is resold, the payment is divided into three parts.
Buyer 2 Payment → Split into:
Platform Fee
Royalty
Amount Received by Seller (Buyer 1)
4.1 Platform Fee
The platform again takes a transaction fee.
Example: Sale price = $200
Platform fee = 5% = $10
4.2 Royalty to Original Creator
A unique feature of NFTs is royalties.
Every time the NFT is resold:
A percentage automatically goes to the original creator.
Example: Royalty = 10%
Royalty amount = $20
This ensures the original creator continues earning from future sales.
4.3 Amount Received by Seller
After deducting platform fee and royalty:
The remaining amount goes to the current owner selling the NFT (Buyer 1).
Example breakdown:
Sale Price = $200
Platform Fee (5%) = $10
Royalty (10%) = $20
Amount received by Seller (Buyer 1):
$200 − $10 − $20 = $170
5. Final Flow Summary
First Sale
Copy code

Buyer → Platform
        ├ Platform Fee
        └ Remaining → Seller/Creator
Resale
Copy code

Buyer 2 → Platform
          ├ Platform Fee
          ├ Royalty → Original Creator
          └ Remaining → Current Seller (Buyer 1)
6. Why This System Works Well
This model is used in most NFT marketplaces because it provides benefits to everyone:
Creator Benefits
Earns royalties from every resale
Long-term income
Platform Benefits
Earns transaction fees from every trade
Buyer Benefits
Ability to resell NFTs for profit
7. Technical Implementation Idea (For Best Performance)
To make the system work efficiently:
Smart Contract Logic
The NFT smart contract should handle:
Ownership transfer
Royalty calculation
Payment distribution
Database Tracking
The platform should track:
Asset ID
Current owner
Transaction history
Royalty percentage
Platform fee
Payment Split Function
Each sale should automatically execute:
Copy code

Total Payment
   ├ Platform Fee
   ├ Royalty
   └ Seller Payment
This ensures transparent and automated money flow.
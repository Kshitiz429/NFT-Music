const fs = require('fs');
const path = require('path');

const files = [
  { name: 'Home.jsx', source: 'c:/Users/Kshitiz/Downloads/NFT/stitch/marketplace_homepage/code.html' },
  { name: 'ArtistProfile.jsx', source: 'c:/Users/Kshitiz/Downloads/NFT/stitch/artist_profile_dashboard/code.html' },
  { name: 'RoyaltyTracker.jsx', source: 'c:/Users/Kshitiz/Downloads/NFT/stitch/audience_royalty_tracker/code.html' },
  { name: 'MintMusic.jsx', source: 'c:/Users/Kshitiz/Downloads/NFT/stitch/upload_mint_music/code.html' }
];

const destDir = 'c:/Users/Kshitiz/Desktop/JKLU/NFTMusic/src/pages';
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

files.forEach(f => {
  let html = fs.readFileSync(f.source, 'utf-8');
  
  // Extract content between <body...> and </body>
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return;
  let bodyContent = bodyMatch[1];
  
  // Standard JSX replacements
  bodyContent = bodyContent.replace(/class="/g, 'className="');
  bodyContent = bodyContent.replace(/for="/g, 'htmlFor="');
  bodyContent = bodyContent.replace(/viewbox="/gi, 'viewBox="');
  bodyContent = bodyContent.replace(/stroke-width="/g, 'strokeWidth="');
  bodyContent = bodyContent.replace(/stroke-linecap="/g, 'strokeLinecap="');
  bodyContent = bodyContent.replace(/style="([^"]*)"/g, (match, styleStr) => {
    // Basic inline style object conversion for 'font-variation-settings' etc.
    // e.g. style="font-variation-settings: 'FILL' 1;" -> style={{ fontVariationSettings: "'FILL' 1" }}
    if (styleStr.includes('font-variation-settings')) {
       return `style={{ fontVariationSettings: "'FILL' 1" }}`; // simplified for this code
    }
    return match;
  });
  
  // Self closing input/img
  bodyContent = bodyContent.replace(/<input([^>]*[^\/])>/g, '<input$1 />');
  bodyContent = bodyContent.replace(/<img([^>]*[^\/])>/g, '<img$1 />');

  // SVG self closing and prop fixes
  bodyContent = bodyContent.replace(/<path([^>]*[^\/])>/g, '<path$1 />');
  bodyContent = bodyContent.replace(/<stop([^>]*[^\/])>/g, '<stop$1 />');
  bodyContent = bodyContent.replace(/stop-color/g, 'stopColor');
  bodyContent = bodyContent.replace(/stop-opacity/g, 'stopOpacity');
  bodyContent = bodyContent.replace(/lineargradient/gi, 'linearGradient');

  // Update navigation links to point to React Router
  // Home -> /
  // Explore -> /profile (just to map)
  // Marketplace -> /mint (just to map)
  // My Library -> /royalty (just to map)
  
  // We'll replace <a> with <Link> and update their to= props
  bodyContent = bodyContent.replace(/<a([^>]*?)href="[^"]*"([^>]*)>([\s\S]*?)<\/a>/gi, (match, p1, p2, inner) => {
    // detect inner text to determine route
    let toOpt = '"/"';
    if (inner.includes('Home')) toOpt = '"/"';
    else if (inner.includes('Explore') || inner.includes('Artist')) toOpt = '"/profile"';
    else if (inner.includes('Marketplace') || inner.includes('Mint')) toOpt = '"/mint"';
    else if (inner.includes('Library') || inner.includes('Royalty')) toOpt = '"/royalty"';
    else if (inner.includes('Playlists')) toOpt = '"/"';
    else return `<a${p1}href="#"${p2}>${inner}</a>`;
    
    return `<Link${p1}to=${toOpt}${p2}>${inner}</Link>`;
  });

  const componentName = f.name.replace('.jsx', '');
  
  const jsxCode = `import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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

export default function ${componentName}() {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full min-h-screen"
    >
      ${bodyContent}
    </motion.div>
  );
}
`;
  
  fs.writeFileSync(path.join(destDir, f.name), jsxCode);
  console.log('Converted', f.name);
});

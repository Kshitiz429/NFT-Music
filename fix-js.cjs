const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/Kshitiz/Desktop/JKLU/NFTMusic/src/pages';
const files = fs.readdirSync(srcDir);

files.forEach(file => {
  if (file.endsWith('.jsx')) {
    const fullPath = path.join(srcDir, file);
    let content = fs.readFileSync(fullPath, 'utf-8');
    
    // Replace HTML comments
    content = content.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

    // Replace unescaped & with &amp; except if it's already an entity
    // But honestly &amp; is fine.

    fs.writeFileSync(fullPath, content);
  }
});

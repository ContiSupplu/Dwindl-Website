const fs = require('fs');
let c = fs.readFileSync('build.js', 'utf-8');

// Replace escaped backticks with real backticks
c = c.replace(/\\`/g, '`');

// Replace escaped dollar signs with real dollar signs
c = c.replace(/\\\$/g, '$');

fs.writeFileSync('build.js', c);
console.log('Fixed build.js escapes');

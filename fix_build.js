const fs = require('fs');
let c = fs.readFileSync('build.js', 'utf-8');

// 1. Lower product file limit from 18000 down to 10000 to buy space for nested pages
c = c.replace(
  `const seoReadyProducts = db.products.sort((a, b) => b.percentage - a.percentage).slice(0, 18000);`,
  `const seoReadyProducts = db.products.sort((a, b) => b.percentage - a.percentage).slice(0, 10000);`
);

// 2. Cap Category file generation to top 2000
c = c.replace(
  `// ----------------- CATEGORIES -----------------\n  db.categories.forEach(c => {`,
  `// ----------------- CATEGORIES -----------------\n  const topCategories = db.categories.sort((a, b) => b.count - a.count).slice(0, 2000);\n  topCategories.forEach(c => {`
);

// 3. Cap Brand file generation to top 5000
c = c.replace(
  `// ----------------- BRANDS -----------------\n  db.brands.forEach(b => {`,
  `// ----------------- BRANDS -----------------\n  const topBrands = db.brands.sort((a, b) => b.count - a.count).slice(0, 5000);\n  topBrands.forEach(b => {`
);

fs.writeFileSync('build.js', c);
console.log('Fixed build.js limits');

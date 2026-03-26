const fs = require('fs');
const path = require('path');

const DIR_SRC = path.join(__dirname, 'src');
const DIR_DIST = path.join(__dirname, 'dist');
const FILE_DB = path.join(__dirname, 'data', 'db.json');

if (!fs.existsSync(DIR_DIST)) fs.mkdirSync(DIR_DIST, { recursive: true });
if (!fs.existsSync(path.join(DIR_DIST, 'brands'))) fs.mkdirSync(path.join(DIR_DIST, 'brands'), { recursive: true });
if (!fs.existsSync(path.join(DIR_DIST, 'blog'))) fs.mkdirSync(path.join(DIR_DIST, 'blog'), { recursive: true });
if (!fs.existsSync(path.join(DIR_DIST, 'app'))) fs.mkdirSync(path.join(DIR_DIST, 'app'), { recursive: true });

const todayDate = new Date().toISOString().split('T')[0];
const css = fs.readFileSync(path.join(DIR_SRC, 'styles.css'), 'utf-8');

const sitemap = [];
function addSitemapUrl(urlPath, lastMod) {
  sitemap.push({ url: `https://dwindl.ai${urlPath}`, lastMod });
}

function generatePage(templateHtml, options) {
  let html = templateHtml;
  html = html.replace(/<link rel="stylesheet" href="styles.css[^"]*">/, `<style>${css}</style>`);

  let headInjection = `
    <link rel="canonical" href="https://dwindl.ai${options.slug}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Dwindl">
    <meta property="og:title" content="${options.title || ''}">
    <meta property="og:description" content="${options.description || ''}">
    <meta property="og:url" content="https://dwindl.ai${options.slug}">
    ${options.ogImage ? `<meta property="og:image" content="${options.ogImage}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${options.title || ''}">
    <meta name="twitter:description" content="${options.description || ''}">
    <meta name="robots" content="index, follow">
    ${options.schema ? `<script type="application/ld+json">\n${options.schema}\n</script>` : ''}
  `;

  if (options.title) html = html.replace(/<title>.*<\/title>/, `<title>${options.title}</title>`).replace('{{META_TITLE}}', options.title);
  if (options.description) {
      if(html.includes('<meta name="description"')){
          html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${options.description}">`);
      } else {
          headInjection += `\n<meta name="description" content="${options.description}">`;
      }
      html = html.replace('{{META_DESCRIPTION}}', options.description);
  }

  html = html.replace('</head>', `${headInjection}\n</head>`);

  if (options.replacements) {
    for (const [key, value] of Object.entries(options.replacements)) {
      html = html.split(key).join(value);
    }
  }

  return html;
}

function writeHtml(slug, html) {
  const isIndex = slug === '/' || slug === '';
  let outPath;
  if (isIndex) {
    outPath = path.join(DIR_DIST, 'index.html');
  } else {
    // If slug has folders, ensure they exist
    const parts = slug.split('/');
    if (parts.length > 1) {
      const dirPath = path.join(DIR_DIST, ...parts.slice(0, -1));
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    }
    outPath = path.join(DIR_DIST, `${slug}.html`);
  }
  fs.writeFileSync(outPath, html);
  addSitemapUrl(isIndex ? '/' : `/${slug}`, todayDate);
}

// Data fetching configuration.
async function fetchDatabase() {
  // If an API environment variable is set in Cloudflare Pages, fetch from the real backend.
  // E.g., process.env.DWINDL_API_URL = "https://your-supabase-url.com/rest/v1/export"
  const API_URL = process.env.DWINDL_API_URL || null;

  if (API_URL) {
    console.log(`🟢 Fetching 10,000+ products dynamically from ${API_URL}...`);
    try {
      const response = await fetch(API_URL, {
        headers: {
          // If you have an API key, it would be passed as an ENV variable:
          // 'Authorization': `Bearer ${process.env.DWINDL_API_KEY}`
        }
      });
      if (!response.ok) throw new Error(`API returned status ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('🔴 API Fetch Failed:', error);
      process.exit(1); // Fail the Cloudflare build so it doesn't deploy a broken site!
    }
  }

  // Fallback to local files for testing and initial development.
  console.log('🟡 DWINDL_API_URL not set in environment. Falling back to local data/db.json...');
  return JSON.parse(fs.readFileSync(FILE_DB, 'utf-8'));
}


async function buildSite() {
  console.log('🚀 Starting Static Site Generation...');
  
  // 1. Fetch Dynamic Data!
  const db = await fetchDatabase();

  // ----------------- STATIC ASSETS -----------------
  ['app.js', 'robots.txt', 'privacy.html', 'terms.html', 'app.html', 'thank-you.html', '404.html'].forEach(file => {
    const srcPath = path.join(DIR_SRC, file);
    if (fs.existsSync(srcPath)) {
      if (file.endsWith('.html')) {
        const html = generatePage(fs.readFileSync(srcPath, 'utf-8'), { slug: `/${file.replace('.html','')}` });
        fs.writeFileSync(path.join(DIR_DIST, file), html);
      } else {
        fs.copyFileSync(srcPath, path.join(DIR_DIST, file));
      }
    }
  });

  // ----------------- INDEX -----------------
  let indexHtml = generatePage(fs.readFileSync(path.join(DIR_SRC, 'index.html'), 'utf-8'), {
    slug: '/',
    title: "Dwindl — See What You're Losing | Shrinkflation Tracker",
    description: "Scan any grocery product and see if it shrunk. Track shrinkflation with real data — size history, price fairness, and better alternatives. Free app coming soon.",
    schema: JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Dwindl",
        "url": "https://dwindl.ai",
        "logo": "https://dwindl.ai/logo.svg",
        "description": "Dwindl tracks shrinkflation and helps consumers make smarter grocery purchase decisions."
      }
    ])
  });
  writeHtml('/', indexHtml);

  const layoutTemplate = fs.readFileSync(path.join(DIR_SRC, 'layout.html'), 'utf-8');

  // ----------------- PRODUCTS -----------------
  db.products.forEach(p => {
    const brand = db.brands.find(b => b.id === p.brandId) || {name: p.brandId};
    const category = db.categories.find(c => c.id === p.categoryId) || {name: p.categoryId};
    
    const title = `${p.name} Shrinkflation — Size History & Score | Dwindl`;
    const description = p.hasShrunk 
      ? `${p.name} by ${brand.name} has shrunk from ${p.originalSize} to ${p.currentSize} since ${p.earliestYear} — a ${p.percentage}% reduction. Dwindl Score: ${p.score}/100. See the full size history, price analysis, and alternatives.`
      : `${p.name} by ${brand.name} has not been shrunk. Dwindl Score: ${p.score}/100. See the full size history, price analysis, and alternatives.`;

    let answerPara = p.hasShrunk
      ? `<p>${p.name} by ${brand.name} has been reduced in size ${p.numChanges} times since ${p.earliestYear}. The product went from ${p.originalSize} to ${p.currentSize} — a total reduction of ${p.percentage}%. The most recent size change was detected in ${p.latestYear}. Dwindl gives this product a score of ${p.score} out of 100, where 100 means no changes detected.</p>`
      : `<p>${p.name} by ${brand.name} has maintained its size of ${p.currentSize} since at least ${p.earliestYear}. No shrinkflation has been detected. Dwindl gives this product a score of ${p.score} out of 100.</p>`;

    const content = `
      <main class="container product-page" style="max-width: 800px; padding: 40px 24px;">
        <header class="product-header" style="margin-bottom: 32px;">
          <h1 style="font-size: 32px; font-weight: 800; letter-spacing: -0.02em;">${p.name} Shrinkflation Tracker</h1>
          <div style="color: var(--soft); font-size: 16px; margin-top: 8px;">
            <a href="/brands/${brand.id}" style="text-decoration: underline;">${brand.name}</a> &middot; ${p.currentSize} &middot; 
            <a href="/${category.id}" style="text-decoration: underline;">${category.name}</a>
          </div>
          <div style="color: var(--muted); font-size: 13px; margin-top: 16px;">Data last verified: ${p.lastVerified}</div>
        </header>
        
        <section class="answer-paragraph" style="font-size: 16px; line-height: 1.6; color: var(--ink); margin-bottom: 40px;">
          ${answerPara}
        </section>

        <section class="size-history" style="margin-bottom: 40px;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Size History</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--line); text-align: left;"><th style="padding: 12px 0;">Year</th><th style="padding: 12px 0;">Size</th></tr>
            </thead>
            <tbody>
              ${p.history.map(h => `<tr style="border-bottom: 1px solid var(--line);"><td style="padding: 12px 0; font-family: var(--font-mono);">${h.year}</td><td style="padding: 12px 0; font-family: var(--font-mono);">${h.size}</td></tr>`).join('')}
            </tbody>
          </table>
        </section>

        ${p.price ? `<section class="price-analysis" style="margin-bottom: 40px;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Price Analysis</h2>
          <p>Current avg price: ${p.price.avgPrice} (${p.price.unitPrice}). This is ${p.price.fairness} compared to similar products in the ${category.name} category.</p>
        </section>` : ''}

        <section class="alternatives" style="margin-bottom: 40px;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Alternatives</h2>
          <ul style="padding-left: 20px;">
            ${p.alternatives.length > 0 ? p.alternatives.map(a => `<li style="margin-bottom: 8px;"><strong>${a.name}</strong> — Score: ${a.score}/100 — ${a.price} — ${a.desc}</li>`).join('') : "<p>No alternatives found.</p>"}
          </ul>
        </section>

        <section class="faq" style="margin-bottom: 40px;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Frequently Asked Questions</h2>
          <div class="faq-item" style="margin-bottom: 16px;">
            <strong>Did ${p.name} get smaller?</strong>
            <p>${p.hasShrunk ? `Yes. It was reduced from ${p.originalSize} to ${p.currentSize}.` : `No. It has remained ${p.currentSize}.`}</p>
          </div>
        </section>
        
        ${p.related && p.related.length > 0 ? `<section class="related" style="margin-bottom: 40px; border-top: 1px solid var(--line); padding-top: 24px;">
          <strong>Also tracked:</strong><br>
          ${p.related.map(r => `<a href="/${r}" style="color: var(--red); text-decoration: underline; margin-right: 12px; display: inline-block; margin-top: 8px;">${r.replace(/-/g, ' ')}</a>`).join('')}
        </section>` : ''}
      </main>
    `;

    const schema = JSON.stringify([{
      "@context": "https://schema.org",
      "@type": "Product",
      "name": p.name,
      "brand": { "@type": "Brand", "name": brand.name },
      "category": category.name,
      "weight": p.currentSize,
      "url": `https://dwindl.ai/${p.id}`,
      "description": description,
      "additionalProperty": [
        { "@type": "PropertyValue", "name": "Dwindl Score", "value": p.score.toString() }
      ]
    }]);

    const phtml = generatePage(layoutTemplate, {
      slug: p.id, title, description,
      ogImage: `https://dwindl.ai/og/${p.id}.png`,
      schema, replacements: { '{{PRODUCT_CONTENT}}': content }
    });
    writeHtml(p.id, phtml);
  });

  // ----------------- CATEGORIES -----------------
  db.categories.forEach(c => {
    const catProducts = db.products.filter(p => p.categoryId === c.id).sort((a, b) => b.percentage - a.percentage);
    const title = `${c.name} Shrinkflation Tracker — Which ${c.name} Products Shrunk | Dwindl`;
    const desc = `Dwindl tracks ${c.count} ${c.name} products for shrinkflation. Of those, ${c.shrunkCount} have been reduced.`;
    
    const content = `
      <main class="container" style="max-width: 800px; padding: 40px 24px;">
        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px;">${c.name} Shrinkflation Tracker</h1>
        <p style="font-size: 16px; line-height: 1.6; color: var(--soft); margin-bottom: 40px;">
          Dwindl tracks ${c.count} ${c.name} products for shrinkflation. Of those, ${c.shrunkCount} have been reduced in size. The average size reduction in this category is ${c.avgPercentage}%. The most-shrunk ${c.name} product is ${c.worstProduct} at &minus;${c.worstPercentage}%.
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid var(--line); text-align: left;">
              <th style="padding: 12px 8px;">Product</th>
              <th style="padding: 12px 8px;">Original</th>
              <th style="padding: 12px 8px;">Current</th>
              <th style="padding: 12px 8px;">Change</th>
            </tr>
          </thead>
          <tbody>
            ${catProducts.map(p => `
            <tr style="border-bottom: 1px solid var(--line);">
              <td style="padding: 12px 8px;"><a href="/${p.id}" style="color: var(--ink); text-decoration: underline; font-weight: 700;">${p.name}</a></td>
              <td style="padding: 12px 8px; font-family: var(--font-mono);">${p.originalSize}</td>
              <td style="padding: 12px 8px; font-family: var(--font-mono);">${p.currentSize}</td>
              <td style="padding: 12px 8px; font-family: var(--font-mono); color: ${p.hasShrunk ? 'var(--red)' : 'var(--green)'};">${p.hasShrunk ? '-'+p.percentage+'%' : '0%'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </main>
    `;
    writeHtml(c.id, generatePage(layoutTemplate, { slug: c.id, title, description: desc, replacements: { '{{PRODUCT_CONTENT}}': content }}));
  });

  // ----------------- BRANDS -----------------
  db.brands.forEach(b => {
    const brandProducts = db.products.filter(p => p.brandId === b.id).sort((a, b) => b.percentage - a.percentage);
    const title = `${b.name} Shrinkflation Tracker — ${b.count} Products Tracked | Dwindl`;
    const desc = `Dwindl tracks ${b.count} ${b.name} products. Average reduction: ${b.avgPercentage}%.`;
    
    const content = `
      <main class="container" style="max-width: 800px; padding: 40px 24px;">
        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px;">${b.name} Shrinkflation Tracker</h1>
        <p style="font-size: 16px; line-height: 1.6; color: var(--soft); margin-bottom: 40px;">
          Dwindl tracks ${b.count} ${b.name} products for shrinkflation. Of those, ${b.shrunkCount} have been reduced in size. The average size reduction is ${b.avgPercentage}%. The most-shrunk ${b.name} product is ${b.worstProduct} at &minus;${b.worstPercentage}%.
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid var(--line); text-align: left;">
              <th style="padding: 12px 8px;">Product</th>
              <th style="padding: 12px 8px;">Original</th>
              <th style="padding: 12px 8px;">Current</th>
              <th style="padding: 12px 8px;">Change</th>
            </tr>
          </thead>
          <tbody>
            ${brandProducts.map(p => `
            <tr style="border-bottom: 1px solid var(--line);">
              <td style="padding: 12px 8px;"><a href="/${p.id}" style="color: var(--ink); text-decoration: underline; font-weight: 700;">${p.name}</a></td>
              <td style="padding: 12px 8px; font-family: var(--font-mono);">${p.originalSize}</td>
              <td style="padding: 12px 8px; font-family: var(--font-mono);">${p.currentSize}</td>
              <td style="padding: 12px 8px; font-family: var(--font-mono); color: ${p.hasShrunk ? 'var(--red)' : 'var(--green)'};">${p.hasShrunk ? '-'+p.percentage+'%' : '0%'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </main>
    `;
    writeHtml(`brands/${b.id}`, generatePage(layoutTemplate, { slug: `brands/${b.id}`, title, description: desc, replacements: { '{{PRODUCT_CONTENT}}': content }}));
  });

  // ----------------- DATA PAGE -----------------
  const dataTitle = "Shrinkflation Data & Statistics 2026 — Dwindl Database";
  const dataDesc = "A comprehensive database tracking product size changes (shrinkflation) across grocery, household, and personal care products in the United States.";
  const dataSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "Dwindl Shrinkflation Database",
    "description": dataDesc,
    "url": "https://dwindl.ai/data",
    "creator": { "@type": "Organization", "name": "Dwindl" },
    "dateModified": db.site.lastUpdated,
    "temporalCoverage": "2017/2026",
    "variableMeasured": "Product size changes over time"
  });
  const dataContent = `
    <main class="container" style="max-width: 800px; padding: 40px 24px;">
      <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px;">Shrinkflation Data &amp; Statistics 2026</h1>
      <p style="color: var(--muted); font-size: 13px; margin-bottom: 32px;">Last updated: ${db.site.lastUpdated}</p>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 40px;">
        <div style="background: var(--white); border: 1px solid var(--line); border-radius: 12px; padding: 24px;">
          <div style="font-size: 13px; color: var(--soft); margin-bottom: 8px;">Total Products Tracked</div>
          <div style="font-size: 32px; font-weight: 800; font-family: var(--font-mono);">${db.stats.totalTracked}</div>
        </div>
        <div style="background: var(--white); border: 1px solid var(--line); border-radius: 12px; padding: 24px;">
          <div style="font-size: 13px; color: var(--soft); margin-bottom: 8px;">Total Products Shrunk</div>
          <div style="font-size: 32px; font-weight: 800; font-family: var(--font-mono); color: var(--red);">${db.stats.totalShrunk}</div>
        </div>
        <div style="background: var(--white); border: 1px solid var(--line); border-radius: 12px; padding: 24px;">
          <div style="font-size: 13px; color: var(--soft); margin-bottom: 8px;">Average Reduction</div>
          <div style="font-size: 32px; font-weight: 800; font-family: var(--font-mono);">${db.stats.averageReduction}%</div>
        </div>
        <div style="background: var(--white); border: 1px solid var(--line); border-radius: 12px; padding: 24px;">
          <div style="font-size: 13px; color: var(--soft); margin-bottom: 8px;">Community Reports Verified</div>
          <div style="font-size: 32px; font-weight: 800; font-family: var(--font-mono);">${db.stats.communityReports}</div>
        </div>
      </div>
    </main>
  `;
  writeHtml('data', generatePage(layoutTemplate, { slug: 'data', title: dataTitle, description: dataDesc, schema: dataSchema, replacements: { '{{PRODUCT_CONTENT}}': dataContent }}));

  // ----------------- BLOG PAGE -----------------
  db.blog.forEach(post => {
    const schema = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "datePublished": post.date,
      "dateModified": post.lastModified,
      "author": { "@type": "Organization", "name": "Dwindl" },
      "publisher": { "@type": "Organization", "name": "Dwindl", "logo": { "@type": "ImageObject", "url": "https://dwindl.ai/logo.svg" } },
      "description": post.desc,
      "mainEntityOfPage": `https://dwindl.ai/blog/${post.id}`
    });
    
    const content = `
      <main class="container" style="max-width: 800px; padding: 40px 24px;">
        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 16px;">${post.title}</h1>
        <p style="color: var(--muted); font-size: 13px; margin-bottom: 32px;">Published: ${post.date} &middot; Updated: ${post.lastModified}</p>
        <div class="blog-content" style="font-size: 16px; line-height: 1.6; color: var(--ink);">
          ${post.content}
        </div>
      </main>
    `;
    writeHtml(`blog/${post.id}`, generatePage(layoutTemplate, { slug: `blog/${post.id}`, title: post.title + " | Dwindl Blog", description: post.desc, schema, replacements: { '{{PRODUCT_CONTENT}}': content }}));
  });

  // Blog Index
  const blogIndexContent = `
    <main class="container" style="max-width: 800px; padding: 40px 24px;">
      <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px;">Dwindl Analysis &amp; Data Deep-Dives</h1>
      ${db.blog.map(b => `
        <div style="margin-bottom: 32px; border-bottom: 1px solid var(--line); padding-bottom: 24px;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;"><a href="/blog/${b.id}" style="text-decoration: underline;">${b.title}</a></h2>
          <p style="color: var(--soft); margin-bottom: 8px;">${b.desc}</p>
          <p style="color: var(--muted); font-size: 13px;">${b.date}</p>
        </div>
      `).join('')}
    </main>
  `;
  writeHtml('blog', generatePage(layoutTemplate, { slug: 'blog', title: "Dwindl Blog — Shrinkflation Data & Analysis", description: "Read the latest deep-dives into grocery shrinkflation data from the Dwindl database.", replacements: { '{{PRODUCT_CONTENT}}': blogIndexContent }}));

  // Build Sitemaps
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map(e => `  <url>\n    <loc>${e.url}</loc>\n    <lastmod>${e.lastMod}</lastmod>\n  </url>`).join('\n')}\n</urlset>`;
  fs.writeFileSync(path.join(DIR_DIST, 'sitemap.xml'), xml);
  console.log('✅ Build seamlessly compiled all pages + Sitemaps to dist directory!');
}

// Execute the async builder
buildSite().catch(err => {
  console.error('Fatal Build Error:', err);
  process.exit(1);
});

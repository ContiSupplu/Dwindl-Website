// --- SUPABASE CONFIGURATION ---
// IMPORTANT: Paste your actual Supabase URL and Anon Key here
const SUPABASE_URL = 'https://uwyiywsvkrvludypvfss.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eWl5d3N2a3J2bHVkeXB2ZnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTE2MDgsImV4cCI6MjA4OTk4NzYwOH0.Ym4lXhZda15ikfY4IDENfbz8qidvJMXkvtmlmagzHhw';

let supabaseClient = null;
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  }
  return null;
}
// ------------------------------

// Product Database
function p(id, name, brand, b, a, u, by, ay) {
  const nc = b === a ? 0 : parseFloat((((a - b) / b) * 100).toFixed(1));
  const cs = nc === 0 ? "No change" : (nc > 0 ? "+" + nc + "%" : nc + "%");
  let score = 100;
  if (nc < 0) score = Math.max(0, 100 - Math.floor(Math.abs(nc) * 4.2));
  return { id, name, brand, before: `${b} ${u}`, beforeYear: by, after: `${a} ${u}`, afterYear: ay, changeStr: cs, numChange: nc, score };
}

const products = [
  p('gatorade', 'Gatorade Thirst Quencher', 'PepsiCo', 32, 28, 'oz', '2020', '2023'),
  p('doritos', 'Doritos Nacho Cheese', 'Frito-Lay', 9.75, 9.25, 'oz', '2021', '2023'),
  p('charmin', 'Charmin Ultra Soft', 'P&G', 264, 244, 'ct', '2020', '2024'),
  p('folgers', 'Folgers Classic Roast', 'Smucker', 51, 43.5, 'oz', '2019', '2023'),
  p('cheerios', 'Honey Nut Cheerios', 'General Mills', 15.4, 13.0, 'oz', '2019', '2024'),
  p('oreo', 'Oreo Cookies', 'Mondelez', 12.2, 10.1, 'oz', '2021', '2024'),
  p('cottonelle', 'Cottonelle Ultra', 'Kimberly-Clark', 340, 312, 'ct', '2021', '2023'),
  p('dawn', 'Dawn Dish Soap', 'P&G', 21.6, 19.4, 'oz', '2022', '2024'),
  p('hefty', 'Hefty Trash Bags', 'Reynolds', 90, 80, 'ct', '2020', '2023'),
  p('tropicana', 'Tropicana Orange Juice', 'PepsiCo', 59, 52, 'oz', '2021', '2024'),
  p('breyers', 'Breyers Ice Cream', 'Unilever', 56, 48, 'oz', '2018', '2021'),
  p('haagen', 'Haagen-Dazs', 'Nestle', 16, 14, 'oz', '2019', '2022'),
  p('fritos', 'Fritos Corn Chips', 'Frito-Lay', 9.75, 9.25, 'oz', '2021', '2023'),
  p('tostitos', 'Tostitos Scoops', 'Frito-Lay', 10, 9, 'oz', '2021', '2023'),
  p('reeses', 'Reese\'s Peanut Butter Cups', 'Hershey', 1.5, 1.5, 'oz', '2020', '2024'),
  p('pantene', 'Pantene Pro-V Shampoo', 'P&G', 12, 10.4, 'oz', '2022', '2023'),
  p('bounty', 'Bounty Paper Towels', 'P&G', 165, 147, 'ct', '2021', '2023'),
  p('ziploc', 'Ziploc Sandwich Bags', 'SC Johnson', 120, 110, 'ct', '2020', '2023'),
  p('cocoa-puffs', 'Cocoa Puffs', 'General Mills', 15.2, 10.4, 'oz', '2020', '2023'),
  p('hellmanns', 'Hellmann\'s Mayonnaise', 'Unilever', 30, 30, 'oz', '2020', '2024'),
  p('skippy', 'Skippy Peanut Butter', 'Hormel', 16.3, 16.3, 'oz', '2021', '2024'),
  p('nutella', 'Nutella', 'Ferrero', 13.0, 13.0, 'oz', '2022', '2024'),
  p('snickers', 'Snickers', 'Mars', 1.86, 1.86, 'oz', '2020', '2024'),
  p('mms', 'M&M\'s', 'Mars', 1.69, 1.69, 'oz', '2020', '2024'),
  p('quaker-oats', 'Quaker Oats', 'PepsiCo', 42, 42, 'oz', '2020', '2024'),
  p('tide-liquid', 'Tide Liquid Detergent', 'P&G', 100, 92, 'oz', '2021', '2023'),
  p('crest', 'Crest Toothpaste', 'P&G', 4.1, 3.8, 'oz', '2022', '2024'),
  p('colgate', 'Colgate Toothpaste', 'Colgate', 4.0, 4.0, 'oz', '2020', '2024'),
  p('secret', 'Secret Deodorant', 'P&G', 2.6, 2.6, 'oz', '2020', '2024'),
  p('old-spice', 'Old Spice Deodorant', 'P&G', 3.0, 3.0, 'oz', '2020', '2024'),
  p('dove-wash', 'Dove Body Wash', 'Unilever', 24, 22, 'oz', '2021', '2023'),
  p('suave-wash', 'Suave Body Wash', 'Unilever', 15, 15, 'oz', '2020', '2024'),
  p('coca-cola', 'Coca-Cola (2 Liter)', 'Coca-Cola', 67.6, 67.6, 'oz', '2020', '2024'),
  p('pringles', 'Pringles', 'Kellogg', 5.5, 5.2, 'oz', '2021', '2023'),
  p('lays', 'Lay\'s Potato Chips', 'Frito-Lay', 8.0, 7.75, 'oz', '2021', '2023'),
  p('cheez-it', 'Cheez-It', 'Kellogg', 12.4, 12.4, 'oz', '2020', '2024'),
  p('goldfish', 'Goldfish Crackers', 'Pepperidge Farm', 6.6, 6.6, 'oz', '2020', '2024'),
  p('ritz', 'Ritz Crackers', 'Mondelez', 13.7, 11.8, 'oz', '2022', '2024'),
  p('wheat-thins', 'Wheat Thins', 'Mondelez', 8.5, 8.5, 'oz', '2020', '2024'),
  p('triscuit', 'Triscuit', 'Mondelez', 8.5, 8.5, 'oz', '2020', '2024'),
  p('kraft-mac', 'Kraft Mac & Cheese', 'Kraft Heinz', 7.25, 7.25, 'oz', '2020', '2024'),
  p('chef-boyardee', 'Chef Boyardee', 'Conagra', 15, 15, 'oz', '2020', '2024'),
  p('campbells', 'Campbell\'s Noodle Soup', 'Campbell', 10.75, 10.75, 'oz', '2020', '2024'),
  p('heinz', 'Heinz Ketchup', 'Kraft Heinz', 20, 20, 'oz', '2020', '2024'),
  p('frenchs', 'French\'s Mustard', 'McCormick', 20, 20, 'oz', '2020', '2024'),
  p('ragu', 'Ragu Pasta Sauce', 'Mizkan', 24, 24, 'oz', '2020', '2024'),
  p('sweet-baby', 'Sweet Baby Ray\'s BBQ', 'Ken\'s Foods', 18, 18, 'oz', '2020', '2024'),
  p('franks', 'Frank\'s RedHot', 'McCormick', 12, 12, 'oz', '2020', '2024'),
  p('sriracha', 'Sriracha', 'Huy Fong', 17, 17, 'oz', '2020', '2024'),
  p('tabasco', 'Tabasco', 'McIlhenny', 5, 5, 'oz', '2020', '2024'),
  p('velveeta', 'Velveeta', 'Kraft Heinz', 32, 32, 'oz', '2020', '2024'),
  p('philadelphia', 'Philadelphia Cream Cheese', 'Kraft Heinz', 8, 8, 'oz', '2020', '2024'),
  p('daisy', 'Daisy Cottage Cheese', 'Daisy', 16, 16, 'oz', '2020', '2024'),
  p('chobani', 'Chobani Greek Yogurt', 'Chobani', 5.3, 5.3, 'oz', '2020', '2024'),
  p('fage', 'Fage Greek Yogurt', 'Fage', 5.3, 5.3, 'oz', '2020', '2024'),
  p('yoplait', 'Yoplait Greek Yogurt', 'General Mills', 5.3, 5.3, 'oz', '2020', '2024'),
  p('barilla', 'Barilla Pasta Sauce', 'Barilla', 24, 24, 'oz', '2020', '2024'),
  p('prego', 'Prego Pasta Sauce', 'Campbell', 24, 24, 'oz', '2020', '2024'),
  p('classico', 'Classico Pasta Sauce', 'Kraft Heinz', 24, 24, 'oz', '2020', '2024'),
  p('del-monte', 'Del Monte Sauce', 'Del Monte', 24, 24, 'oz', '2020', '2024'),
  p('hunts', 'Hunt\'s Tomato Sauce', 'Conagra', 15, 15, 'oz', '2020', '2024'),
  p('rotel', 'Rotel Diced Tomatoes', 'Conagra', 10, 10, 'oz', '2020', '2024'),
  p('chicken-sea', 'Chicken of the Sea Tuna', 'Thai Union', 5, 5, 'oz', '2020', '2024'),
  p('starkist', 'StarKist Tuna', 'Dongwon', 5, 5, 'oz', '2020', '2024'),
  p('bumble-bee', 'Bumble Bee Tuna', 'FCF', 5, 5, 'oz', '2020', '2024'),
  p('spam', 'Spam', 'Hormel', 12, 12, 'oz', '2020', '2024'),
  p('poptarts', 'Pop-Tarts', 'Kellogg', 14.7, 13.5, 'oz', '2021', '2023'),
  p('cinnamon-toast', 'Cinnamon Toast Crunch', 'General Mills', 16.8, 12.0, 'oz', '2021', '2024'),
  p('lucky-charms', 'Lucky Charms', 'General Mills', 14.9, 10.5, 'oz', '2021', '2024'),
  p('frosted-flakes', 'Frosted Flakes', 'Kellogg', 15.0, 13.5, 'oz', '2022', '2024'),
  p('froot-loops', 'Froot Loops', 'Kellogg', 15.0, 13.5, 'oz', '2022', '2024'),
  p('apple-jacks', 'Apple Jacks', 'Kellogg', 15.0, 13.5, 'oz', '2022', '2024'),
  p('corn-pops', 'Corn Pops', 'Kellogg', 15.0, 13.5, 'oz', '2022', '2024'),
  p('raisin-bran', 'Raisin Bran', 'Kellogg', 16.6, 15.9, 'oz', '2021', '2024'),
  p('rice-krispies', 'Rice Krispies', 'Kellogg', 12.0, 12.0, 'oz', '2020', '2024'),
  p('special-k', 'Special K', 'Kellogg', 18.0, 18.0, 'oz', '2020', '2024'),
  p('chex-mix', 'Chex Mix', 'General Mills', 14.0, 14.0, 'oz', '2020', '2024'),
  p('capn-crunch', 'Cap\'n Crunch', 'PepsiCo', 14.0, 11.4, 'oz', '2022', '2024'),
  p('life-cereal', 'Life Cereal', 'Quaker', 13.0, 13.0, 'oz', '2020', '2024'),
  p('kashi', 'Kashi Cereal', 'Kellogg', 14.0, 14.0, 'oz', '2020', '2024'),
  p('nature-valley', 'Nature Valley Granola', 'General Mills', 8.9, 8.9, 'oz', '2020', '2024'),
  p('quaker-chewy', 'Quaker Chewy', 'PepsiCo', 8.4, 8.4, 'oz', '2020', '2024'),
  p('clif-bars', 'Clif Bars', 'Mondelez', 2.4, 2.4, 'oz', '2020', '2024'),
  p('kind-bars', 'Kind Bars', 'Mars', 1.2, 1.2, 'oz', '2020', '2024'),
  p('rxbars', 'RxBars', 'Kellogg', 1.8, 1.8, 'oz', '2020', '2024'),
  p('larabars', 'Larabars', 'General Mills', 1.8, 1.8, 'oz', '2020', '2024'),
  p('quest-bars', 'Quest Bars', 'Simply Good', 2.1, 2.1, 'oz', '2020', '2024'),
  p('hersheys', 'Hershey\'s Bar', 'Hershey', 1.55, 1.55, 'oz', '2020', '2024'),
  p('reeses-pieces', 'Reese\'s Pieces', 'Hershey', 1.5, 1.5, 'oz', '2020', '2024'),
  p('kit-kat', 'Kit Kat', 'Hershey', 1.5, 1.5, 'oz', '2020', '2024'),
  p('twix', 'Twix', 'Mars', 1.86, 1.86, 'oz', '2020', '2024'),
  p('milky-way', 'Milky Way', 'Mars', 1.84, 1.84, 'oz', '2020', '2024'),
  p('3-musketeers', '3 Musketeers', 'Mars', 1.84, 1.84, 'oz', '2020', '2024'),
  p('butterfinger', 'Butterfinger', 'Ferrero', 1.9, 1.9, 'oz', '2020', '2024'),
  p('baby-ruth', 'Baby Ruth', 'Ferrero', 1.9, 1.9, 'oz', '2020', '2024'),
  p('crunch', 'Crunch', 'Ferrero', 1.9, 1.5, 'oz', '2021', '2024'),
  p('100-grand', '100 Grand', 'Ferrero', 1.5, 1.5, 'oz', '2020', '2024'),
  p('skittles', 'Skittles', 'Mars', 1.69, 1.69, 'oz', '2020', '2024'),
  p('starburst', 'Starburst', 'Mars', 2.07, 2.07, 'oz', '2020', '2024'),
  p('sour-patch', 'Sour Patch Kids', 'Mondelez', 2.0, 2.0, 'oz', '2020', '2024')
];

// Elements
const heroSearch = document.getElementById('heroSearch');
const searchDropdown = document.getElementById('searchDropdown');
const resultContainer = document.getElementById('resultContainer');

/* 4. Dynamic Placeholders */
const placeholders = ["Cheerios", "Charmin", "Gatorade", "Tide", "Folgers"];
let phIndex = 0; let phCharIndex = 0; let isPhDeleting = false;
function typePlaceholder() {
  if (document.activeElement === heroSearch || heroSearch.value.length > 0) {
    heroSearch.placeholder = "";
    setTimeout(typePlaceholder, 500);
    return;
  }
  const currentWord = placeholders[phIndex];
  if (!isPhDeleting && phCharIndex <= currentWord.length) {
    heroSearch.placeholder = `Search '${currentWord.substring(0, phCharIndex)}'...`;
    phCharIndex++;
    setTimeout(typePlaceholder, 100);
  } else if (isPhDeleting && phCharIndex >= 0) {
    heroSearch.placeholder = `Search '${currentWord.substring(0, phCharIndex)}'...`;
    phCharIndex--;
    setTimeout(typePlaceholder, 50);
  } else {
    isPhDeleting = !isPhDeleting;
    if (!isPhDeleting) phIndex = (phIndex + 1) % placeholders.length;
    setTimeout(typePlaceholder, isPhDeleting ? 1500 : 500);
  }
}
typePlaceholder();

/* 1. Keyboard Shortcut */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault(); heroSearch.focus();
  }
  if (e.key === '/' && document.activeElement !== heroSearch && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault(); heroSearch.focus();
  }
});

/* 2. Focus Dimming */
heroSearch.addEventListener('focus', () => { document.body.classList.add('search-focused'); });
heroSearch.addEventListener('blur', () => {
  setTimeout(() => {
    if (!searchDropdown.classList.contains('active')) { document.body.classList.remove('search-focused'); }
  }, 200);
});

// Autocomplete logic
heroSearch.addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();
  
  if (query.length === 0) { 
    closeDropdown(); 
    return; 
  }
  
  const matches = products.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.brand.toLowerCase().includes(query)
  );
  
  renderDropdown(matches);
});

function renderDropdown(matches) {
  if (matches.length === 0) {
    searchDropdown.innerHTML = `<div class="suggestion-item"><span class="suggestion-name" style="color: var(--muted);">No results found</span></div>`;
    searchDropdown.classList.add('active');
    return;
  }
  
  searchDropdown.innerHTML = matches.map((p) => `
    <div class="suggestion-item" tabindex="0" onclick="selectProduct('${p.id}')">
      <div>
        <div class="suggestion-name">${p.name}</div>
        <div class="suggestion-brand">${p.brand}</div>
      </div>
    </div>
  `).join('');
  
  searchDropdown.classList.add('active');
}

function closeDropdown() {
  searchDropdown.classList.remove('active');
  if (document.activeElement !== heroSearch) { 
    document.body.classList.remove('search-focused'); 
  }
}

window.selectProduct = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  heroSearch.value = product.name;
  closeDropdown();
  
  const isShrunk = product.numChange < 0;
  
  // Shock state pivot
  if (product.score < 40) {
    document.body.classList.add('shock-state');
  } else {
    document.body.classList.remove('shock-state');
  }
  
  const colorClass = product.score > 80 ? "color-green" : (product.score > 40 ? "color-amber" : "color-red");
  const promptText = isShrunk ? "Don't let them keep shrinking your groceries silently." : "Want to know if they secretly shrink it later?";
  
  // Honest Alternative Logic
  let altHtml = '';
  if (isShrunk) {
    let altBrand = "Kirkland Signature (0% Historical Shrink)";
    if (product.id === 'cheerios' || product.id === 'lucky-charms') altBrand = "Malt-O-Meal Brands (0% Shrink)";
    if (product.id === 'doritos' || product.id === 'lays') altBrand = "Late July / Local Brands (0% Shrink)";
    if (product.id === 'gatorade') altBrand = "BodyArmor SuperDrink (0% Shrink)";
    if (product.id === 'tide-liquid') altBrand = "Persil ProClean (Stable sizing)";
    
    altHtml = `
      <div class="honest-alt fade-in-up" style="animation-delay: 0.15s">
        <div class="alt-header">
          <svg class="alt-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          Dwindl Verified Alternative
        </div>
        <div class="alt-name">${altBrand}</div>
        <div class="alt-sub">Maintained full historical volume over the last 5 years.</div>
      </div>
    `;
  }
  
  renderResult(product, altHtml, promptText);
};

document.addEventListener('click', (e) => {
  if (!heroSearch.contains(e.target) && !searchDropdown.contains(e.target)) { 
    closeDropdown(); 
  }
});

/* 8. Shock State & 5. Number Counting Animation */
function renderResult(product, altHtml = '', passedPrompt = '') {
  let scoreClass = "color-green"; 
  let changeClass = "color-green";
  
  // Trigger Shock State if score < 40
  if (product.score < 40) {
    document.body.classList.add('shock-state');
    scoreClass = "color-red"; 
    changeClass = "color-red";
  } else {
    document.body.classList.remove('shock-state');
    if (product.score <= 44) scoreClass = "color-red";
    else if (product.score <= 69) scoreClass = "color-amber";
    if (product.changeStr !== "No change") changeClass = "color-red";
  }

  const displayPrompt = passedPrompt || (product.changeStr === "No change" 
    ? "This one's clean. Want to watch it anyway?" 
    : `Want to know when ${product.name} shrinks again?`);

  const html = `
    <div class="result-card fade-in-up">
      <div class="result-header">
        <div class="result-title">
          <div class="result-name">${product.name}</div>
          <div class="result-brand">${product.brand} &middot; ${product.after}</div>
        </div>
        <div class="score-ring">
          <svg viewBox="0 0 36 36">
            <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="ring-fill ${scoreClass}" stroke-dasharray="${product.score}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div class="score-text ${scoreClass}">${product.score}</div>
        </div>
      </div>
      <div class="shrink-data">
        <div class="size-col">
          <div class="size-val">${product.before}</div>
          <div class="size-year">${product.beforeYear}</div>
        </div>
        <div class="change-col">
          <div class="change-val ${changeClass}" id="animatedChangeVal">${product.changeStr === "No change" ? "0.0%" : "0.0%"}</div>
          <div class="change-line"></div>
        </div>
        <div class="size-col fade-in-up" style="animation-delay: 0.15s">
          <div class="size-val ${changeClass}">${product.after}</div>
          <div class="size-year">in ${product.afterYear}</div>
        </div>
      </div>
    </div>
    
    <div class="email-capture fade-in-up" id="emailCaptureBox" style="animation-delay: 0.2s">
      <div class="email-prompt">${displayPrompt}</div>
      <form id="waitlistForm" class="email-form" onsubmit="submitEmail(event, '${product.name}')">
        <input type="text" class="email-input" id="waitlistName" placeholder="First Name" required>
        <input type="email" class="email-input" id="waitlistEmail" placeholder="your@email.com" required>
        <button type="submit" class="email-btn">Join the Waitlist</button>
      </form>
    </div>
    ${altHtml}
  `;
  resultContainer.innerHTML = html;

  // Number counting animation
  if (product.numChange !== 0 && product.changeStr !== "No change") {
    const changeEl = document.getElementById('animatedChangeVal');
    const duration = 1000;
    const startTime = performance.now();
    
    function animateCount(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentVal = (product.numChange * easeOut).toFixed(1);
      changeEl.innerText = (currentVal > 0 ? "+" : "") + currentVal + '%';
      if (progress < 1) requestAnimationFrame(animateCount);
      else changeEl.innerText = product.changeStr;
    }
    requestAnimationFrame(animateCount);
  } else {
    document.getElementById('animatedChangeVal').innerText = "No change";
  }
}

window.submitEmail = async function(e, productName) {
  e.preventDefault();
  
  const btn = e.target.querySelector('button[type="submit"]');
  const nameVal = document.getElementById('waitlistName').value.trim();
  const emailVal = document.getElementById('waitlistEmail').value.trim();
  if (!nameVal || !emailVal || !emailVal.includes('@')) return;
  
  const originalText = btn.innerText;
  btn.innerText = "Securing Spot...";
  btn.disabled = true;
  
  try {
    const db = getSupabase();
    if (!db) {
      alert("Database connection blocked by local browser settings. Simulating success...");
      window.location.href = "thank-you.html";
      return;
    }
    
    const { data, error } = await db
      .from('waitlist')
      .insert([{ name: nameVal, email: emailVal }]);
      
    if (error) {
      if (error.code === '23505') {
        alert("You're already on the waitlist!");
      } else {
        alert("Error securing spot: " + error.message);
      }
      btn.innerText = originalText;
      btn.disabled = false;
      return;
    }
    
    window.location.href = "thank-you.html";
  } catch (err) {
    alert("Network error. Please try again.");
    btn.innerText = originalText;
    btn.disabled = false;
  }
};

// Section 2: Scroll of Shame layout
const shameTrack = document.getElementById('shameTrack');
function renderShameScroll() {
  const html = products.map(p => {
    const changeClass = p.changeStr === "No change" ? "color-green" : "color-red";
    return `<div class="shame-card"><div class="sc-name">${p.name}</div><div class="sc-data"><div class="sc-sizes">${p.before} &rarr; <span class="sc-sizes-after ${changeClass}">${p.after}</span></div><div class="sc-change ${changeClass}">${p.changeStr}</div></div></div>`;
  }).join('');
  
  shameTrack.innerHTML = html + html;
}
renderShameScroll();

window.submitBottomEmail = async function(e) {
  e.preventDefault();
  
  const btn = e.target.querySelector('button[type="submit"]');
  const nameVal = document.getElementById('bottomWaitlistName').value.trim();
  const emailVal = document.getElementById('bottomWaitlistEmail').value.trim();
  if (!nameVal || !emailVal || !emailVal.includes('@')) return;
  
  const originalText = btn.innerText;
  btn.innerText = "Securing Spot...";
  btn.disabled = true;
  
  try {
    const db = getSupabase();
    if (!db) {
      alert("Database connection blocked by local browser settings. Simulating success...");
      window.location.href = "thank-you.html";
      return;
    }
    
    const { data, error } = await db
      .from('waitlist')
      .insert([{ name: nameVal, email: emailVal }]);
      
    if (error) {
      if (error.code === '23505') {
        alert("You're already on the waitlist!");
      } else {
        alert("Error securing spot: " + error.message);
      }
      btn.innerText = originalText;
      btn.disabled = false;
      return;
    }
    
    window.location.href = "thank-you.html";
  } catch (err) {
    alert("Network error. Please try again.");
    btn.innerText = originalText;
    btn.disabled = false;
  }
};

// FAQ Animation Logic
document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const answer = item.querySelector('.faq-answer');
    
    // Check if opening or closing
    if (item.classList.contains('active')) {
      item.classList.remove('active');
      answer.style.maxHeight = null;
    } else {
      // Close all others first for accordion effect
      document.querySelectorAll('.faq-item.active').forEach(openItem => {
        openItem.classList.remove('active');
        openItem.querySelector('.faq-answer').style.maxHeight = null;
      });
      // Open the clicked one
      item.classList.add('active');
      answer.style.maxHeight = answer.scrollHeight + "px";
    }
  });
});

// Calculator Logic
const calcInput = document.getElementById('calcInput');
const calcSlider = document.getElementById('calcSlider');
const calcResult = document.getElementById('calcResult');

function updateCalc(val) {
  if (val < 0) val = 0;
  if (calcInput) calcInput.value = val;
  if (calcSlider) calcSlider.value = val;
  const yearlyLoss = val * 52 * 0.11;
  if (calcResult) calcResult.innerText = "-$" + Math.round(yearlyLoss).toLocaleString();
}

if (calcInput && calcSlider) {
  calcInput.addEventListener('input', (e) => updateCalc(e.target.value));
  calcSlider.addEventListener('input', (e) => updateCalc(e.target.value));
  updateCalc(150);
}



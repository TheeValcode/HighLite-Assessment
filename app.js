/**
 * HighLite Crypto Tracker logic
 */

const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false';

// State management
let assets = [];
let displayAssets = [];
let sortOrder = 'default'; // 'default', 'asc', 'desc'

// DOM Elements
const assetGrid = document.getElementById('asset-grid');
const minPriceInput = document.getElementById('min-price');
const maxPriceInput = document.getElementById('max-price');
const clearBtn = document.getElementById('clear-btn');
const sortBtn = document.getElementById('sort-btn');
const sortLabel = document.getElementById('sort-label');
const themeToggle = document.getElementById('theme-toggle');
const loader = document.getElementById('loader');
const errorContainer = document.getElementById('error-container');
const errorText = document.getElementById('error-text');
const body = document.body;
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

/**
 * Fetch data from CoinGecko API
 */
async function fetchAssets() {
    showLoader();
    hideError();

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        assets = data;
        applyFiltersAndSort();
    } catch (err) {
        console.error('Fetch error:', err);
        showError('Could not fetch crypto data. Please check your connection or try again later.');
    } finally {
        hideLoader();
    }
}

/**
 * Apply both price range filtering and sorting
 */
function applyFiltersAndSort() {
    // 1. Filter by Price Range
    const min = parseFloat(minPriceInput.value) || 0;
    const max = parseFloat(maxPriceInput.value) || Infinity;

    displayAssets = assets.filter(asset =>
        asset.current_price >= min && asset.current_price <= max
    );

    // 2. Sort
    if (sortOrder === 'asc') {
        displayAssets.sort((a, b) => a.current_price - b.current_price);
    } else if (sortOrder === 'desc') {
        displayAssets.sort((a, b) => b.current_price - a.current_price);
    } else {
        // Default sort (by market cap as returned by API)
        // We revert to the filtered subset of original assets maintaining their relative order
        displayAssets = assets.filter(asset =>
            asset.current_price >= min && asset.current_price <= max
        );
    }

    renderAssets();
}

/**
 * Cycle through sort orders: Default -> High-to-Low -> Low-to-High
 */
function cycleSort() {
    if (sortOrder === 'default') {
        sortOrder = 'desc';
        sortLabel.textContent = 'Sort: High to Low';
    } else if (sortOrder === 'desc') {
        sortOrder = 'asc';
        sortLabel.textContent = 'Sort: Low to High';
    } else {
        sortOrder = 'default';
        sortLabel.textContent = 'Sort: Default';
    }

    applyFiltersAndSort();
}

/**
 * Render asset cards to the grid
 */
function renderAssets() {
    assetGrid.innerHTML = '';

    if (displayAssets.length === 0) {
        assetGrid.innerHTML = '<p style="text-align: center; width: 100%; color: var(--secondary-text); padding: 4rem;">No assets found in this price range.</p>';
        return;
    }

    displayAssets.forEach(asset => {
        const card = document.createElement('div');
        card.className = 'asset-card';

        const priceChange = asset.price_change_percentage_24h;
        const colorClass = priceChange >= 0 ? 'positive' : 'negative';
        const sign = priceChange >= 0 ? '+' : '';

        card.innerHTML = `
            <img src="${asset.image}" alt="${asset.name}" class="asset-icon">
            <div class="asset-info">
                <div class="asset-name">${asset.name}</div>
                <div class="asset-symbol">${asset.symbol}</div>
            </div>
            <div class="asset-price">
                <div>$${asset.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style="font-size: 0.8rem; font-weight: 500; color: var(--${colorClass})">${sign}${priceChange.toFixed(2)}%</div>
            </div>
        `;

        assetGrid.appendChild(card);
    });
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('highlite-theme', newTheme);

    if (newTheme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

/**
 * Reset all filters and sort order
 */
function clearFilters() {
    minPriceInput.value = '';
    maxPriceInput.value = '';
    sortOrder = 'default';
    sortLabel.textContent = 'Sort: Default';
    applyFiltersAndSort();
}

// UI Helpers
function showLoader() { loader.classList.remove('hidden'); assetGrid.classList.add('hidden'); }
function hideLoader() { loader.classList.add('hidden'); assetGrid.classList.remove('hidden'); }
function showError(msg) { errorText.textContent = msg; errorContainer.classList.remove('hidden'); }
function hideError() { errorContainer.classList.add('hidden'); }

// Event Listeners
minPriceInput.addEventListener('input', applyFiltersAndSort);
maxPriceInput.addEventListener('input', applyFiltersAndSort);
clearBtn.addEventListener('click', clearFilters);
sortBtn.addEventListener('click', cycleSort);
themeToggle.addEventListener('click', toggleTheme);

// Initialize
function init() {
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('highlite-theme');
    if (savedTheme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }

    fetchAssets();
}

document.addEventListener('DOMContentLoaded', init);

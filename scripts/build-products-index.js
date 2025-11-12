#!/usr/bin/env node
/**
 * Build script to merge individual product JSON entries into the legacy
 * data/products.json structure consumed by the menu frontend.
 */
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(process.cwd(), 'content', 'products');
const OUTPUT_FILE = path.join(process.cwd(), 'data', 'products.json');

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function sortProducts(products) {
  return products.sort((a, b) => {
    if (a.available !== b.available) {
      return a.available ? -1 : 1;
    }
    const categoryCompare = (a.category_ar || '').localeCompare(b.category_ar || '', 'ar');
    if (categoryCompare !== 0) {
      return categoryCompare;
    }
    return (a.name_ar || '').localeCompare(b.name_ar || '', 'ar');
  });
}

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function buildIndex() {
  ensureDataDir();
  if (!fs.existsSync(CONTENT_DIR)) {
    throw new Error(`Content directory not found: ${CONTENT_DIR}`);
  }
  const files = fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.json'));
  const products = files.map((file) => readJSON(path.join(CONTENT_DIR, file)));
  const sorted = sortProducts(products);
  const payload = { products: sorted };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${sorted.length} products to ${OUTPUT_FILE}`);
}

buildIndex();

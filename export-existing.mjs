/**
 * Export existing data.ts establishments to JSON for seeding into DB.
 * This script reads the TypeScript file and extracts the data using regex/parsing.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const dataPath = resolve("./client/src/lib/data.ts");
const content = readFileSync(dataPath, "utf-8");

// We need to extract the categories array from the TypeScript file
// The categories export starts with "export const categories: Category[] = ["
const catStart = content.indexOf("export const categories: Category[] = [");
if (catStart === -1) {
  console.error("Could not find categories export");
  process.exit(1);
}

// Find the matching closing bracket
let depth = 0;
let start = content.indexOf("[", catStart);
let end = start;
for (let i = start; i < content.length; i++) {
  if (content[i] === "[") depth++;
  if (content[i] === "]") depth--;
  if (depth === 0) {
    end = i + 1;
    break;
  }
}

// Extract the array content and convert to valid JSON-like format
let arrayStr = content.slice(start, end);

// Replace TypeScript-specific syntax to make it parseable
// Remove type assertions and "as const"
arrayStr = arrayStr.replace(/\s*as\s+const/g, "");
// Convert property names without quotes to quoted
// This is tricky with JS object literals - let's use Function constructor instead

// Actually, let's use a simpler approach: eval with a mock environment
// Since the data is just literals, we can use Function
const fn = new Function(`
  return ${arrayStr};
`);

let categories;
try {
  categories = fn();
} catch (e) {
  console.error("Failed to parse categories:", e.message);
  // Try alternative: strip the content more aggressively
  process.exit(1);
}

console.log(`Parsed ${categories.length} categories`);

// Map category IDs to our slug format
const categorySlugMap = {
  "bar-lanchonete": "bar-lanchonete",
  "cozinha-brasileira": "cozinha-brasileira",
  "autoral-contemporaneo": "autoral-contemporaneo",
  "boteco-tradicional": "boteco-tradicional",
  "boteco-moderno": "boteco-moderno",
  "pub": "pub",
  "coquetelaria": "coquetelaria",
  "cafeteria": "cafeteria",
  "padaria": "padaria",
  "balada": "balada",
  "bar-balada": "balada",
  "confeitaria": "confeitaria",
  "bar-musical": "bar-musical",
  "cervejaria": "cervejaria",
  "pizzaria": "pizzaria",
  "saudavel": "saudavel",
  "hamburgueria": "hamburgueria",
  "cozinha-internacional": "cozinha-internacional",
};

const output = {
  categories: [],
  establishments: [],
  menuItems: []
};

for (const cat of categories) {
  const catSlug = categorySlugMap[cat.id] || cat.id;
  
  output.categories.push({
    originalId: cat.id,
    slug: catSlug,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    active: cat.active
  });
  
  if (cat.establishments) {
    for (const est of cat.establishments) {
      output.establishments.push({
        originalId: est.id,
        slug: est.id,
        name: est.name,
        address: est.address,
        neighborhood: est.neighborhood,
        lat: est.lat,
        lng: est.lng,
        rating: est.rating,
        reviewCount: est.reviewCount,
        image: est.image,
        hours: est.hours,
        phone: est.phone,
        instagram: est.instagram || null,
        categorySlug: catSlug,
        hasMenu: est.menu && est.menu.length > 0,
        source: 'original'
      });
      
      if (est.menu) {
        for (const item of est.menu) {
          output.menuItems.push({
            establishmentSlug: est.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category
          });
        }
      }
    }
  }
}

console.log(`Establishments: ${output.establishments.length}`);
console.log(`Menu items: ${output.menuItems.length}`);

writeFileSync("/home/ubuntu/existing_data.json", JSON.stringify(output, null, 0), "utf-8");
console.log("✅ Exported to /home/ubuntu/existing_data.json");

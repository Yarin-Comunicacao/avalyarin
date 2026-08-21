import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const dataPath = resolve("./client/src/lib/data.ts");
const content = readFileSync(dataPath, "utf-8");

const catMatch = content.match(/export\s+const\s+categories:\s+Category\[\]\s*=\s*\[/);
if (!catMatch) process.exit(1);

// The first [ is part of Category[], the second [ is the array start
const firstBracket = content.indexOf("[", catMatch.index);
const start = content.indexOf("[", firstBracket + 1);

let depth = 0;
let end = -1;
let inString = false;
let quoteChar = "";

for (let i = start; i < content.length; i++) {
  const char = content[i];
  if ((char === '"' || char === "'") && content[i-1] !== '\\') {
    if (!inString) {
      inString = true;
      quoteChar = char;
    } else if (char === quoteChar) {
      inString = false;
    }
  }
  if (!inString) {
    if (char === "[") depth++;
    else if (char === "]") depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}

let arrayStr = content.slice(start, end).replace(/\s*as\s+const/g, "");

const menus = {};
const menuRegex = /const\s+(\w+Menu):\s+MenuItem\[\]\s*=\s*(\[[\s\S]*?\]);/g;
let match;
while ((match = menuRegex.exec(content)) !== null) {
  const menuName = match[1];
  let menuStr = match[2].replace(/\s*as\s+const/g, "");
  try {
    menus[menuName] = new Function(`return ${menuStr};`)();
  } catch (e) {}
}

const context = { ...menus };
const criteriaRegex = /export\s+const\s+(\w+):\s+RatingCriterion\[\]\s*=\s*(\[[\s\S]*?\]);/g;
while ((match = criteriaRegex.exec(content)) !== null) {
  try {
    context[match[1]] = new Function(`return ${match[2]};`)();
  } catch (e) {}
}

const bonusRegex = /export\s+const\s+BONUS_CRITERIA\s*=\s*(\[[\s\S]*?\]);/g;
match = bonusRegex.exec(content);
if (match) {
  try {
    context['BONUS_CRITERIA'] = new Function(`return ${match[1]};`)();
  } catch (e) {}
}

let categories;
try {
  const keys = Object.keys(context);
  const values = Object.values(context);
  const fn = new Function(...keys, `return ${arrayStr};`);
  categories = fn(...values);
} catch (e) {
  console.error("Parse error:", e.message);
  process.exit(1);
}

const output = {
  categories: [],
  establishments: [],
  menuItems: []
};

for (const cat of categories) {
  output.categories.push({
    slug: cat.id,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    active: cat.active
  });
  
  if (cat.establishments) {
    for (const est of cat.establishments) {
      output.establishments.push({
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
        categorySlug: cat.id,
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

console.log(`Parsed ${output.categories.length} categories`);
console.log(`Establishments: ${output.establishments.length}`);
console.log(`Menu items: ${output.menuItems.length}`);

writeFileSync("/home/ubuntu/existing_data.json", JSON.stringify(output, null, 2), "utf-8");
console.log("✅ Exported to /home/ubuntu/existing_data.json");

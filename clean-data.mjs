import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const url = new URL(DATABASE_URL);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true }
  });

  // Valid logradouro prefixes
  const validLogradouros = ['Rua', 'Avenida', 'Alameda', 'Praça', 'Travessa', 'Largo', 'Estrada', 'Rodovia', 'Viela'];
  const logradouroRegex = new RegExp(`^(${validLogradouros.join('|')})`);

  // Complement prefixes that should be extracted from address
  const complementPrefixes = [
    'Shopping', 'Edifício', 'Condomínio', 'Galeria', 'Hotel', 'Espaço',
    'Brascam', 'Térreo', 'Sobreloja', 'Pão de Açúcar', 'Instagram',
    'Bar & Boteco', 'em frente', 'Esquina com'
  ];

  // Fetch all establishments
  const [rows] = await conn.execute(
    'SELECT id, name, address, neighborhood, complement, addressNumber, description FROM establishments WHERE address IS NOT NULL AND address != ""'
  );

  console.log(`Processing ${rows.length} establishments...`);

  let updatedCount = 0;
  let complementExtracted = 0;
  let numberExtracted = 0;
  let descriptionExtracted = 0;

  for (const row of rows) {
    let address = row.address || '';
    let complement = row.complement || '';
    let addressNumber = row.addressNumber || '';
    let description = row.description || '';
    let name = row.name;
    let changed = false;

    // === STEP 1: Extract number from address ===
    // Pattern: "Rua Xxx, 1234 - Bairro, São Paulo..."
    const numMatch = address.match(/^([^,]+),\s*(\d+|s\/n|s\/nº|S\/N)\s*(.*)$/);
    if (numMatch && !addressNumber) {
      const streetPart = numMatch[1];
      addressNumber = numMatch[2];
      const rest = numMatch[3];
      // Rebuild address without number
      address = streetPart + (rest ? rest : '');
      numberExtracted++;
      changed = true;
    }

    // === STEP 2: Extract complement prefix from address ===
    // Pattern: "Shopping X - Rua Y, 123 - Bairro..."
    for (const prefix of complementPrefixes) {
      if (address.startsWith(prefix) && !logradouroRegex.test(address)) {
        // Find where the actual logradouro starts
        const logMatch = address.match(new RegExp(`-\\s*(${validLogradouros.join('|')})\\s`));
        if (logMatch) {
          const idx = address.indexOf(logMatch[0]);
          const extractedComplement = address.substring(0, idx).trim().replace(/\s*-\s*$/, '');
          address = address.substring(idx + 2).trim(); // skip "- "
          complement = complement ? `${extractedComplement}; ${complement}` : extractedComplement;
          complementExtracted++;
          changed = true;
        }
        break;
      }
    }

    // === STEP 3: Extract "Loja X", "Andar X", "Piso X" from address to complement ===
    const lojaMatch = address.match(/\s*-\s*(Loja\s+\d+[A-Za-z]?|Piso\s+\w+|Térreo|Subsolo|\d+[ºª°]\s*andar|Conjunto\s+\d+)/i);
    if (lojaMatch && !complement.includes(lojaMatch[1])) {
      complement = complement ? `${complement}; ${lojaMatch[1]}` : lojaMatch[1];
      address = address.replace(lojaMatch[0], '');
      complementExtracted++;
      changed = true;
    }

    // === STEP 4: Clean trailing "São Paulo - SP, CEP, Brasil" ===
    address = address.replace(/,?\s*São Paulo\s*-\s*SP,?\s*\d{5}-?\d{3}?,?\s*Brasil\s*$/i, '').trim();
    // Also remove trailing " - Bairro" since we have neighborhood field
    const trailingBairro = address.match(/\s*-\s*([^-,]+)$/);
    if (trailingBairro) {
      const possibleBairro = trailingBairro[1].trim();
      // Only remove if it looks like a neighborhood (not a street continuation)
      if (possibleBairro.length < 40 && !logradouroRegex.test(possibleBairro)) {
        address = address.replace(trailingBairro[0], '').trim();
        changed = true;
      }
    }

    // === STEP 5: Re-extract number if still embedded ===
    if (!addressNumber) {
      const numMatch2 = address.match(/^([^,]+),\s*(\d+|s\/n|s\/nº|S\/N)\s*$/);
      if (numMatch2) {
        address = numMatch2[1];
        addressNumber = numMatch2[2];
        numberExtracted++;
        changed = true;
      }
    }

    // === STEP 6: Clean name - extract descriptions ===
    // Patterns like "BOALI - Alimentação Saudável - Restaurante de Saladas, Wraps..."
    // or "PILOTTO - Restaurante de frutos do mar e bar de ostras"
    const descPatterns = [
      /^(.+?)\s*[-–]\s*(Restaurante\s+de\s+.+)$/i,
      /^(.+?)\s*[-–]\s*(Bar\s+de\s+.+)$/i,
      /^(.+?)\s*[-–]\s*(Culinária\s+.+)$/i,
      /^(.+?)\s*[-–]\s*(Comida\s+.+)$/i,
      /^(.+?)\s*[-–]\s*(Sorvete\s+.+)$/i,
      /^(.+?)\s*[-–]\s*(Delivery\s+.+)$/i,
    ];

    if (!description) {
      for (const pat of descPatterns) {
        const m = name.match(pat);
        if (m && m[2].length > 15) {
          name = m[1].trim();
          description = m[2].trim();
          descriptionExtracted++;
          changed = true;
          break;
        }
      }
    }

    // Also handle pipe separator: "Bolinho Verde | Restaurante Israelense Kasher"
    if (!description && name.includes(' | ')) {
      const parts = name.split(' | ');
      if (parts.length === 2 && parts[1].length > 10) {
        name = parts[0].trim();
        description = parts[1].trim();
        descriptionExtracted++;
        changed = true;
      }
    }

    // Handle colon separator: "Temperani Trattoria: Restaurante italiano Itaim Bibi - SP"
    if (!description && name.includes(': ')) {
      const colonIdx = name.indexOf(': ');
      const afterColon = name.substring(colonIdx + 2);
      if (afterColon.length > 15 && /^(Restaurante|Bar|Culinária|Comida|Lanchonete|Cafeteria|Padaria|Pizzaria)/i.test(afterColon)) {
        description = afterColon.replace(/\s*-\s*SP$/, '').trim();
        name = name.substring(0, colonIdx).trim();
        descriptionExtracted++;
        changed = true;
      }
    }

    if (changed) {
      await conn.execute(
        'UPDATE establishments SET name = ?, address = ?, complement = ?, addressNumber = ?, description = ? WHERE id = ?',
        [name, address, complement || null, addressNumber || null, description || null, row.id]
      );
      updatedCount++;
    }
  }

  console.log(`\nResults:`);
  console.log(`  Total processed: ${rows.length}`);
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Numbers extracted: ${numberExtracted}`);
  console.log(`  Complements extracted: ${complementExtracted}`);
  console.log(`  Descriptions extracted: ${descriptionExtracted}`);

  // Count how many still don't start with valid logradouro
  const [invalid] = await conn.execute(
    `SELECT COUNT(*) as total FROM establishments WHERE address IS NOT NULL AND address != '' AND address NOT REGEXP '^(Rua|Avenida|Alameda|Praça|Travessa|Largo|Estrada|Rodovia|Viela)'`
  );
  console.log(`  Still invalid logradouro: ${invalid[0].total}`);

  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });

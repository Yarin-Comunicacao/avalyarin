/**
 * Validações de endereço para estabelecimentos
 * 
 * Regras:
 * - Endereço deve começar com logradouro padrão
 * - Número deve ser de 1 a 15000 ou "s/n"
 * - Complemento: Shopping, galeria, sala, loja, conjunto, edifício, etc.
 * - Bairro: deve ser o bairro exato (não subprefeitura)
 */

// Logradouros válidos que podem iniciar um endereço
export const VALID_LOGRADOUROS = [
  'Rua',
  'Avenida',
  'Alameda',
  'Praça',
  'Travessa',
  'Largo',
  'Estrada',
  'Rodovia',
  'Viela',
  'Beco',
  'Viaduto',
  'Passagem',
  'Vila',
  'Ladeira',
  'Parque',
  'Ponte',
  'Marginal',
  'Acesso',
] as const;

// Regex para validar que endereço começa com logradouro válido
export const ADDRESS_REGEX = new RegExp(
  `^(${VALID_LOGRADOUROS.join('|')})\\s+.+`,
  'i'
);

// Validar endereço
export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address || address.trim() === '') {
    return { valid: false, error: 'Endereço é obrigatório' };
  }
  
  const trimmed = address.trim();
  
  if (!ADDRESS_REGEX.test(trimmed)) {
    return { 
      valid: false, 
      error: `Endereço deve começar com um logradouro válido: ${VALID_LOGRADOUROS.slice(0, 8).join(', ')}...` 
    };
  }
  
  return { valid: true };
}

// Validar número do endereço
export function validateAddressNumber(number: string): { valid: boolean; error?: string } {
  if (!number || number.trim() === '') {
    return { valid: true }; // Número é opcional (pode ser s/n)
  }
  
  const trimmed = number.trim().toLowerCase();
  
  // Aceita "s/n" ou "S/N"
  if (trimmed === 's/n' || trimmed === 'sn') {
    return { valid: true };
  }
  
  // Aceita números de 1 a 15000
  const num = parseInt(trimmed, 10);
  if (isNaN(num) || num < 1 || num > 15000 || String(num) !== trimmed) {
    return { valid: false, error: 'Número deve ser de 1 a 15000 ou "s/n"' };
  }
  
  return { valid: true };
}

// Tipos de complemento válidos
export const COMPLEMENT_TYPES = [
  'Shopping',
  'Galeria',
  'Sala',
  'Loja',
  'Conjunto',
  'Edifício',
  'Bloco',
  'Andar',
  'Piso',
  'Torre',
  'Casa',
  'Sobreloja',
  'Mezanino',
  'Subsolo',
  'Mercado',
  'Centro Comercial',
  'Mall',
  'Pavilhão',
  'Galpão',
  'Box',
  'Stand',
  'Quiosque',
  'Espaço',
] as const;

// Validar complemento (não obrigatório, mas se preenchido deve fazer sentido)
export function validateComplement(complement: string): { valid: boolean; error?: string } {
  if (!complement || complement.trim() === '') {
    return { valid: true }; // Complemento é opcional
  }
  
  // Complemento pode ser qualquer texto descritivo
  if (complement.trim().length > 200) {
    return { valid: false, error: 'Complemento deve ter no máximo 200 caracteres' };
  }
  
  return { valid: true };
}

// Extrair número do endereço (útil para migração de dados)
export function extractNumberFromAddress(address: string): { address: string; number: string } {
  // Padrão: "Rua Exemplo, 123" ou "Rua Exemplo 123"
  const match = address.match(/^(.+?),?\s+(\d{1,5})\s*$/);
  if (match) {
    return { address: match[1].trim(), number: match[2] };
  }
  
  // Padrão: "Rua Exemplo, 123 - Complemento"
  const matchWithComplement = address.match(/^(.+?),?\s+(\d{1,5})\s*[-–]\s*.+$/);
  if (matchWithComplement) {
    return { address: matchWithComplement[1].trim(), number: matchWithComplement[2] };
  }
  
  return { address, number: '' };
}

// Extrair complemento do endereço
export function extractComplementFromAddress(address: string): { address: string; complement: string } {
  // Padrão: "Rua Exemplo, 123 - Shopping XYZ"
  const match = address.match(/^(.+?)\s*[-–]\s*(Shopping|Galeria|Loja|Sala|Conj|Edif|Bloco|Torre|Piso|Andar|Centro Comercial|Mall|Mercado|Pavilhão|Galpão|Box|Stand|Quiosque|Espaço).+$/i);
  if (match) {
    return { address: match[1].trim(), complement: address.slice(match[1].length).replace(/^\s*[-–]\s*/, '').trim() };
  }
  
  return { address, complement: '' };
}

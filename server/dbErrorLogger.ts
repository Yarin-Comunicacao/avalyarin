/**
 * Database Error Logger — Detects and logs schema mismatches, missing columns,
 * and other database issues with actionable error messages.
 * 
 * Errors are logged to console.error with structured format for GitHub/Render logs.
 */

interface DbErrorContext {
  operation: string;
  table?: string;
  params?: any;
}

/**
 * Parse MySQL/TiDB error messages to detect common schema issues
 */
function parseDbError(error: any, context: DbErrorContext): string {
  const msg = error?.message || error?.sqlMessage || String(error);
  const code = error?.code || error?.errno;
  
  // Column not found / Unknown column
  if (msg.includes("Unknown column") || msg.includes("doesn't have a default value")) {
    const colMatch = msg.match(/Unknown column '([^']+)'/);
    const defaultMatch = msg.match(/Field '([^']+)' doesn't have a default value/);
    const column = colMatch?.[1] || defaultMatch?.[1] || "unknown";
    
    return `[DB_SCHEMA_ERROR] Coluna '${column}' não encontrada na tabela.
  Operação: ${context.operation}
  Tabela: ${context.table || "desconhecida"}
  Causa provável: A coluna no TiDB está com nome diferente do schema (case sensitivity).
  Solução: Execute ALTER TABLE para renomear a coluna para camelCase.
  Exemplo: ALTER TABLE \`${context.table}\` CHANGE \`${column.toLowerCase()}\` \`${column}\` <TYPE>;
  Referência: Consulte o arquivo schema-colunas-completo.md para os nomes corretos.`;
  }
  
  // Table not found
  if (msg.includes("doesn't exist") || msg.includes("Table") && msg.includes("not found")) {
    const tableMatch = msg.match(/Table '([^']+)'/);
    const table = tableMatch?.[1] || context.table || "unknown";
    
    return `[DB_SCHEMA_ERROR] Tabela '${table}' não existe no banco de dados.
  Operação: ${context.operation}
  Causa provável: A tabela ainda não foi criada no TiDB.
  Solução: Execute pnpm db:push ou crie a tabela manualmente com CREATE TABLE.`;
  }
  
  // Duplicate entry
  if (msg.includes("Duplicate entry") || code === "ER_DUP_ENTRY") {
    return `[DB_CONSTRAINT_ERROR] Entrada duplicada detectada.
  Operação: ${context.operation}
  Tabela: ${context.table || "desconhecida"}
  Erro: ${msg}
  Causa provável: Tentativa de inserir registro com chave única já existente.`;
  }
  
  // Foreign key constraint
  if (msg.includes("foreign key constraint") || msg.includes("FOREIGN KEY")) {
    return `[DB_CONSTRAINT_ERROR] Violação de chave estrangeira.
  Operação: ${context.operation}
  Tabela: ${context.table || "desconhecida"}
  Erro: ${msg}
  Causa provável: Referência a registro inexistente em tabela relacionada.`;
  }
  
  // Data too long
  if (msg.includes("Data too long") || msg.includes("Data truncated")) {
    return `[DB_DATA_ERROR] Dados excedem o tamanho da coluna.
  Operação: ${context.operation}
  Tabela: ${context.table || "desconhecida"}
  Erro: ${msg}
  Causa provável: Valor inserido é maior que o VARCHAR/TEXT definido na coluna.`;
  }
  
  // Connection errors
  if (msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT") || msg.includes("Connection lost")) {
    return `[DB_CONNECTION_ERROR] Falha na conexão com o banco de dados.
  Operação: ${context.operation}
  Erro: ${msg}
  Causa provável: DATABASE_URL incorreto, banco offline, ou problema de rede/SSL.`;
  }
  
  // Failed query (generic Drizzle error)
  if (msg.includes("Failed query")) {
    // Extract table and column info from the query
    const selectMatch = msg.match(/select .+ from `(\w+)`/);
    const insertMatch = msg.match(/insert into `(\w+)`/);
    const updateMatch = msg.match(/update `(\w+)`/);
    const table = selectMatch?.[1] || insertMatch?.[1] || updateMatch?.[1] || context.table;
    
    return `[DB_QUERY_ERROR] Query falhou no banco de dados.
  Operação: ${context.operation}
  Tabela: ${table || "desconhecida"}
  Erro completo: ${msg}
  Causa provável: Divergência entre schema do código e colunas no TiDB.
  Solução: Compare as colunas do TiDB (DESCRIBE ${table}) com o schema-colunas-completo.md.
  Verifique especialmente: camelCase vs lowercase (ex: createdAt vs createdat).`;
  }
  
  // Generic fallback
  return `[DB_ERROR] Erro não categorizado no banco de dados.
  Operação: ${context.operation}
  Tabela: ${context.table || "desconhecida"}
  Código: ${code || "N/A"}
  Erro: ${msg}
  Params: ${context.params ? JSON.stringify(context.params).slice(0, 200) : "N/A"}`;
}

/**
 * Log a database error with full context and actionable information.
 * Call this in every catch block that handles DB operations.
 */
export function logDbError(error: any, context: DbErrorContext): void {
  const timestamp = new Date().toISOString();
  const parsed = parseDbError(error, context);
  
  console.error(`\n${"=".repeat(70)}`);
  console.error(`[${timestamp}] [DB_ALERT] 🚨 DATABASE ERROR DETECTED`);
  console.error(`${"=".repeat(70)}`);
  console.error(parsed);
  console.error(`${"=".repeat(70)}\n`);

  // Tentar gravar o alerta na tabela system_logs de forma assíncrona para rastreabilidade
  try {
    // Importação dinâmica para evitar dependência circular
    import('./db').then(async ({ getDb }) => {
      const db = await getDb();
      if (db) {
        const { systemLogs } = await import('../drizzle/schema');
        const [maxRes] = await db.select({ maxId: import('drizzle-orm').sql<number>`MAX(id)` }).from(systemLogs);
        const nextId = (maxRes?.maxId || 0) + 1;
        
        await db.insert(systemLogs).values({
          id: nextId,
          action: `DB_ERROR_${context.operation.toUpperCase()}`,
          entity: context.table || 'database',
          description: parsed.slice(0, 500),
          metadata: {
            error: error?.message || String(error),
            code: error?.code || error?.errno,
            stack: error?.stack,
            params: context.params ? JSON.stringify(context.params).slice(0, 200) : null
          },
          createdAt: new Date()
        });
      }
    }).catch(err => {
      console.error("[DB_ALERT_FAIL] Falha ao gravar log de erro na tabela system_logs:", err.message);
    });
  } catch (e) {
    // Silenciar erro secundário de log
  }
}

/**
 * Wrap a database operation with error logging.
 * Usage: const result = await withDbLogging("getUserByOpenId", "users", () => db.select()...);
 */
export async function withDbLogging<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>,
  params?: any
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logDbError(error, { operation, table, params });
    throw error;
  }
}

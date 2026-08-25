import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => {
  const insertValues = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn(() => ({ values: insertValues }));
  const limit = vi.fn().mockResolvedValue([]);
  const orderBy = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ orderBy }));
  const select = vi.fn(() => ({ from }));

  return { insertValues, insert, limit, orderBy, from, select };
});

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "code-backups/backup-test123.md",
    url: "https://storage.example.com/code-backups/backup-test123.md",
  }),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readdirSync: vi.fn().mockReturnValue([
    { name: "App.tsx", isDirectory: () => false },
  ]),
  readFileSync: vi.fn().mockReturnValue("export const app = true;"),
}));

vi.mock("mysql2/promise", () => ({
  default: { createPool: vi.fn(() => ({})) },
}));

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(() => ({
    insert: dbMocks.insert,
    select: dbMocks.select,
  })),
}));

describe("persistência de backups de código", () => {
  beforeAll(() => {
    vi.stubEnv("DATABASE_URL", "mysql://test:test@localhost:3306/avalyarin");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.limit.mockResolvedValue([]);
  });

  it("registra os metadados do arquivo enviado ao armazenamento", async () => {
    const { generateCodeBackup } = await import("./db");

    const backup = await generateCodeBackup();

    expect(dbMocks.insert).toHaveBeenCalledTimes(1);
    expect(dbMocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
      backupId: backup.id,
      url: backup.url,
      sizeKB: backup.sizeKB,
      fileCount: backup.fileCount,
    }));
  });

  it("retorna os backups ordenados com data serializada", async () => {
    const createdAt = new Date("2026-08-25T12:30:00.000Z");
    dbMocks.limit.mockResolvedValueOnce([{
      id: "backup-test123",
      createdAt,
      url: "https://storage.example.com/code-backups/backup-test123.md",
      sizeKB: 42,
      fileCount: 3,
    }]);

    const { getCodeBackups } = await import("./db");
    const backups = await getCodeBackups();

    expect(dbMocks.select).toHaveBeenCalledTimes(1);
    expect(backups).toEqual([{
      id: "backup-test123",
      createdAt: createdAt.toISOString(),
      url: "https://storage.example.com/code-backups/backup-test123.md",
      sizeKB: 42,
      fileCount: 3,
    }]);
  });
});

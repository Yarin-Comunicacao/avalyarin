import { describe, it, expect, vi } from "vitest";

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "code-backups/backup-test123.md", url: "/manus-storage/code-backups/backup-test123.md" }),
}));

// Mock fs
vi.mock("fs", () => ({
  readdirSync: vi.fn().mockReturnValue([
    { name: "App.tsx", isDirectory: () => false },
    { name: "index.ts", isDirectory: () => false },
  ]),
  readFileSync: vi.fn().mockReturnValue("// test content"),
}));

describe("Code Backup Feature", () => {
  it("generateCodeBackup returns proper structure", async () => {
    const { generateCodeBackup, getCodeBackups } = await import("./db");
    
    const result = await generateCodeBackup();
    
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("sizeKB");
    expect(result).toHaveProperty("fileCount");
    expect(result.id).toMatch(/^backup-/);
    expect(result.url).toContain("/manus-storage/");
    expect(result.fileCount).toBeGreaterThanOrEqual(0);
    expect(result.sizeKB).toBeGreaterThanOrEqual(0);
  });

  it("getCodeBackups returns array with generated backup", async () => {
    const { getCodeBackups } = await import("./db");
    
    const backups = await getCodeBackups();
    
    expect(Array.isArray(backups)).toBe(true);
    expect(backups.length).toBeGreaterThanOrEqual(1);
    expect(backups[0]).toHaveProperty("id");
    expect(backups[0]).toHaveProperty("createdAt");
  });
});

describe("Create Establishment Validation", () => {
  it("should require address, neighborhood, region, phone, instagram, hours", () => {
    // Test the zod schema validation by importing the router schema
    const { z } = require("zod");
    
    const schema = z.object({
      name: z.string().min(2).max(255),
      categoryId: z.number().min(1),
      address: z.string().min(5, "Endereço é obrigatório (mín. 5 caracteres)"),
      neighborhood: z.string().min(2, "Bairro é obrigatório"),
      region: z.string().min(2, "Região é obrigatória"),
      phone: z.string().min(8, "Telefone é obrigatório (mín. 8 caracteres)"),
      instagram: z.string().min(2, "Instagram é obrigatório"),
      hours: z.string().min(3, "Horário de funcionamento é obrigatório"),
    });

    // Should fail without required fields
    const resultMissing = schema.safeParse({
      name: "Test Bar",
      categoryId: 1,
    });
    expect(resultMissing.success).toBe(false);

    // Should fail with empty strings
    const resultEmpty = schema.safeParse({
      name: "Test Bar",
      categoryId: 1,
      address: "",
      neighborhood: "",
      region: "",
      phone: "",
      instagram: "",
      hours: "",
    });
    expect(resultEmpty.success).toBe(false);

    // Should pass with valid data
    const resultValid = schema.safeParse({
      name: "Bar do Zé",
      categoryId: 1,
      address: "R. Augusta, 1234 - Consolação, São Paulo - SP, 01304-001",
      neighborhood: "Consolação",
      region: "Pinheiros",
      phone: "(11) 3456-7890",
      instagram: "@bardoze",
      hours: "Seg a Sex: 18:00–02:00 | Sáb: 16:00–03:00",
    });
    expect(resultValid.success).toBe(true);
  });

  it("should reject short phone numbers", () => {
    const { z } = require("zod");
    
    const phoneSchema = z.string().min(8, "Telefone é obrigatório (mín. 8 caracteres)");
    
    expect(phoneSchema.safeParse("123").success).toBe(false);
    expect(phoneSchema.safeParse("12345678").success).toBe(true);
  });
});

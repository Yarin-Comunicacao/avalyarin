/**
 * Tests for neighborhood preposition logic in insígnias
 * Validates that titles are correctly formed with de/do/da + neighborhood name
 */
import { describe, it, expect } from "vitest";
import { getNeighborhoodPreposition } from "./db-nobility";

describe("getNeighborhoodPreposition", () => {
  // "de" — default, no article
  it("should use 'de' for Pinheiros", () => {
    expect(getNeighborhoodPreposition("Pinheiros")).toBe("de Pinheiros");
  });

  it("should use 'de' for Perdizes", () => {
    expect(getNeighborhoodPreposition("Perdizes")).toBe("de Perdizes");
  });

  it("should use 'de' for Moema", () => {
    expect(getNeighborhoodPreposition("Moema")).toBe("de Moema");
  });

  it("should use 'de' for Itaim Bibi", () => {
    expect(getNeighborhoodPreposition("Itaim Bibi")).toBe("de Itaim Bibi");
  });

  it("should use 'de' for Jardins", () => {
    expect(getNeighborhoodPreposition("Jardins")).toBe("de Jardins");
  });

  // "do" — masculine with article
  it("should use 'do' for Butantã", () => {
    expect(getNeighborhoodPreposition("Butantã")).toBe("do Butantã");
  });

  it("should use 'do' for Cambuci", () => {
    expect(getNeighborhoodPreposition("Cambuci")).toBe("do Cambuci");
  });

  it("should use 'do' for Ipiranga", () => {
    expect(getNeighborhoodPreposition("Ipiranga")).toBe("do Ipiranga");
  });

  // "da" — feminine with article
  it("should use 'da' for Vila Madalena", () => {
    expect(getNeighborhoodPreposition("Vila Madalena")).toBe("da Vila Madalena");
  });

  it("should use 'da' for Vila Mariana", () => {
    expect(getNeighborhoodPreposition("Vila Mariana")).toBe("da Vila Mariana");
  });

  it("should use 'da' for Bela Vista", () => {
    expect(getNeighborhoodPreposition("Bela Vista")).toBe("da Bela Vista");
  });

  it("should use 'da' for Lapa", () => {
    expect(getNeighborhoodPreposition("Lapa")).toBe("da Lapa");
  });

  it("should use 'da' for Consolação", () => {
    expect(getNeighborhoodPreposition("Consolação")).toBe("da Consolação");
  });

  it("should use 'da' for Liberdade", () => {
    expect(getNeighborhoodPreposition("Liberdade")).toBe("da Liberdade");
  });

  it("should use 'da' for República", () => {
    expect(getNeighborhoodPreposition("República")).toBe("da República");
  });

  it("should use 'da' for Santa Cecília", () => {
    expect(getNeighborhoodPreposition("Santa Cecília")).toBe("da Santa Cecília");
  });

  it("should use 'da' for Barra Funda", () => {
    expect(getNeighborhoodPreposition("Barra Funda")).toBe("da Barra Funda");
  });

  it("should use 'da' for Saúde", () => {
    expect(getNeighborhoodPreposition("Saúde")).toBe("da Saúde");
  });

  it("should use 'da' for Sé", () => {
    expect(getNeighborhoodPreposition("Sé")).toBe("da Sé");
  });
});

describe("Full insígnia title formation", () => {
  it("forms 'Desbravador de Pinheiros' correctly", () => {
    const prep = getNeighborhoodPreposition("Pinheiros");
    expect(`Desbravador ${prep}`).toBe("Desbravador de Pinheiros");
  });

  it("forms 'Desbravador do Butantã' correctly", () => {
    const prep = getNeighborhoodPreposition("Butantã");
    expect(`Desbravador ${prep}`).toBe("Desbravador do Butantã");
  });

  it("forms 'Desbravadora da Vila Mariana' correctly", () => {
    const prep = getNeighborhoodPreposition("Vila Mariana");
    expect(`Desbravadora ${prep}`).toBe("Desbravadora da Vila Mariana");
  });

  it("forms 'Cartógrafo de Pinheiros' correctly", () => {
    const prep = getNeighborhoodPreposition("Pinheiros");
    expect(`Cartógrafo ${prep}`).toBe("Cartógrafo de Pinheiros");
  });

  it("forms 'Embaixador da Lapa' correctly", () => {
    const prep = getNeighborhoodPreposition("Lapa");
    expect(`Embaixador ${prep}`).toBe("Embaixador da Lapa");
  });

  it("forms 'Lenda Urbana do Ipiranga' correctly", () => {
    const prep = getNeighborhoodPreposition("Ipiranga");
    expect(`Lenda Urbana ${prep}`).toBe("Lenda Urbana do Ipiranga");
  });
});

import { describe, expect, it } from "vitest";
import { extractCoordinatesFromGoogleMapsUrl, extractNameFromGoogleMapsUrl } from "./googleMapsUrl";

describe("extractCoordinatesFromGoogleMapsUrl", () => {
  it("extrai o nome presente no caminho do local", () => {
    expect(extractNameFromGoogleMapsUrl("https://www.google.com/maps/place/Estrela+Bar/@-23.5444746,-46.656189,12z"))
      .toBe("Estrela Bar");
  });

  it("extrai as coordenadas de um link compartilhado com marcador de mapa", () => {
    expect(extractCoordinatesFromGoogleMapsUrl("https://www.google.com/maps/place/Estrela+Bar/@-23.5444746,-46.656189,12z"))
      .toEqual({ lat: -23.5444746, lng: -46.656189 });
  });

  it("extrai as coordenadas do formato place com !3d e !4d", () => {
    expect(extractCoordinatesFromGoogleMapsUrl("https://www.google.com/maps/place/x!3d-23.5612463!4d-46.5697117"))
      .toEqual({ lat: -23.5612463, lng: -46.5697117 });
  });

  it("não inventa coordenadas quando o link não as expõe", () => {
    expect(extractCoordinatesFromGoogleMapsUrl("https://maps.app.goo.gl/encurtado"))
      .toBeNull();
  });
});

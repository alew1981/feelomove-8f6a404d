import { describe, it, expect } from "vitest";
import {
  detectLocaleFromPath,
  localePath,
  toCanonicalPath,
  getAlternateUrl,
  stripLocalePrefix,
  translateSegment,
} from "@/lib/i18nRoutes";

// ============================================
// detectLocaleFromPath
// ============================================
describe("detectLocaleFromPath", () => {
  it("returns 'es' for root path", () => {
    expect(detectLocaleFromPath("/")).toBe("es");
  });

  it("returns 'es' for Spanish routes", () => {
    expect(detectLocaleFromPath("/conciertos")).toBe("es");
    expect(detectLocaleFromPath("/conciertos/coldplay-madrid")).toBe("es");
    expect(detectLocaleFromPath("/festivales")).toBe("es");
    expect(detectLocaleFromPath("/destinos/barcelona")).toBe("es");
    expect(detectLocaleFromPath("/politica-privacidad")).toBe("es");
    expect(detectLocaleFromPath("/terminos-uso")).toBe("es");
  });

  it("returns 'en' for English routes", () => {
    expect(detectLocaleFromPath("/en")).toBe("en");
    expect(detectLocaleFromPath("/en/tickets")).toBe("en");
    expect(detectLocaleFromPath("/en/tickets/coldplay-madrid")).toBe("en");
    expect(detectLocaleFromPath("/en/festivals")).toBe("en");
    expect(detectLocaleFromPath("/en/destinations/barcelona")).toBe("en");
    expect(detectLocaleFromPath("/en/privacy-policy")).toBe("en");
    expect(detectLocaleFromPath("/en/terms-of-use")).toBe("en");
  });

  it("does not misdetect paths starting with 'en' but not /en/", () => {
    expect(detectLocaleFromPath("/entradas")).toBe("es");
    expect(detectLocaleFromPath("/energy-festival")).toBe("es");
  });
});

// ============================================
// translateSegment
// ============================================
describe("translateSegment", () => {
  const pairs = [
    ["conciertos", "tickets"],
    ["festivales", "festivals"],
    ["destinos", "destinations"],
    ["artistas", "artists"],
    ["favoritos", "favorites"],
    ["politica-privacidad", "privacy-policy"],
    ["terminos-uso", "terms-of-use"],
  ];

  pairs.forEach(([es, en]) => {
    it(`translates '${es}' → '${en}' (ES→EN)`, () => {
      expect(translateSegment(es, "en")).toBe(en);
    });
    it(`translates '${en}' → '${es}' (EN→ES)`, () => {
      expect(translateSegment(en, "es")).toBe(es);
    });
  });

  it("returns unknown segments unchanged", () => {
    expect(translateSegment("unknown-page", "en")).toBe("unknown-page");
    expect(translateSegment("unknown-page", "es")).toBe("unknown-page");
  });
});

// ============================================
// localePath
// ============================================
describe("localePath", () => {
  it("returns ES path unchanged for locale 'es'", () => {
    expect(localePath("/conciertos", "es")).toBe("/conciertos");
    expect(localePath("/conciertos/slug", "es")).toBe("/conciertos/slug");
    expect(localePath("/", "es")).toBe("/");
  });

  it("translates first segment for locale 'en'", () => {
    expect(localePath("/conciertos", "en")).toBe("/en/tickets");
    expect(localePath("/conciertos/coldplay-madrid", "en")).toBe("/en/tickets/coldplay-madrid");
    expect(localePath("/festivales", "en")).toBe("/en/festivals");
    expect(localePath("/festivales/primavera-sound", "en")).toBe("/en/festivals/primavera-sound");
    expect(localePath("/destinos/madrid", "en")).toBe("/en/destinations/madrid");
    expect(localePath("/artistas", "en")).toBe("/en/artists");
    expect(localePath("/politica-privacidad", "en")).toBe("/en/privacy-policy");
    expect(localePath("/terminos-uso", "en")).toBe("/en/terms-of-use");
  });

  it("translates home path to /en/", () => {
    expect(localePath("/", "en")).toBe("/en/");
  });

  it("preserves slug portions (second+ segments)", () => {
    expect(localePath("/conciertos/my-artist/extra", "en")).toBe("/en/tickets/my-artist/extra");
  });
});

// ============================================
// stripLocalePrefix
// ============================================
describe("stripLocalePrefix", () => {
  it("strips /en/ prefix", () => {
    expect(stripLocalePrefix("/en/tickets")).toBe("/tickets");
    expect(stripLocalePrefix("/en/tickets/slug")).toBe("/tickets/slug");
  });

  it("strips /en to /", () => {
    expect(stripLocalePrefix("/en")).toBe("/");
  });

  it("returns ES paths unchanged", () => {
    expect(stripLocalePrefix("/conciertos")).toBe("/conciertos");
    expect(stripLocalePrefix("/")).toBe("/");
  });
});

// ============================================
// toCanonicalPath
// ============================================
describe("toCanonicalPath", () => {
  it("converts EN paths to ES canonical", () => {
    expect(toCanonicalPath("/en/tickets")).toBe("/conciertos");
    expect(toCanonicalPath("/en/tickets/coldplay")).toBe("/conciertos/coldplay");
    expect(toCanonicalPath("/en/festivals/primavera")).toBe("/festivales/primavera");
    expect(toCanonicalPath("/en/destinations/madrid")).toBe("/destinos/madrid");
    expect(toCanonicalPath("/en/privacy-policy")).toBe("/politica-privacidad");
    expect(toCanonicalPath("/en/terms-of-use")).toBe("/terminos-uso");
  });

  it("returns ES paths unchanged", () => {
    expect(toCanonicalPath("/conciertos")).toBe("/conciertos");
    expect(toCanonicalPath("/conciertos/coldplay")).toBe("/conciertos/coldplay");
    expect(toCanonicalPath("/")).toBe("/");
  });

  it("converts /en to /", () => {
    expect(toCanonicalPath("/en")).toBe("/");
  });
});

// ============================================
// getAlternateUrl (hreflang)
// ============================================
describe("getAlternateUrl", () => {
  const base = "https://feelomove.com";

  it("generates EN alternate from ES path", () => {
    expect(getAlternateUrl("/conciertos", "en", base)).toBe(`${base}/en/tickets`);
    expect(getAlternateUrl("/conciertos/coldplay", "en", base)).toBe(`${base}/en/tickets/coldplay`);
    expect(getAlternateUrl("/festivales/primavera", "en", base)).toBe(`${base}/en/festivals/primavera`);
    expect(getAlternateUrl("/politica-privacidad", "en", base)).toBe(`${base}/en/privacy-policy`);
  });

  it("generates ES alternate from EN path", () => {
    expect(getAlternateUrl("/en/tickets", "es", base)).toBe(`${base}/conciertos`);
    expect(getAlternateUrl("/en/tickets/coldplay", "es", base)).toBe(`${base}/conciertos/coldplay`);
    expect(getAlternateUrl("/en/privacy-policy", "es", base)).toBe(`${base}/politica-privacidad`);
  });

  it("generates correct home alternates", () => {
    expect(getAlternateUrl("/", "en", base)).toBe(`${base}/en/`);
    expect(getAlternateUrl("/en", "es", base)).toBe(`${base}/`);
  });

  it("round-trips correctly (ES→EN→ES)", () => {
    const esPath = "/conciertos/coldplay-madrid";
    const enUrl = getAlternateUrl(esPath, "en", base);
    const enPath = enUrl.replace(base, "");
    const backToEs = getAlternateUrl(enPath, "es", base);
    expect(backToEs).toBe(`${base}${esPath}`);
  });
});

import { describe, it, expect } from "vitest";
import {
  normalizeToSlug,
  generateSeoSlug,
  isCleanSeoUrl,
  hasNoisePatterns,
  isFestivalSlug,
  extractCityFromSlug,
  isValidSeoSlug,
  cleanSlug,
} from "@/lib/slugUtils";

// ============================================
// normalizeToSlug
// ============================================
describe("normalizeToSlug", () => {
  it("lowercases and removes accents", () => {
    expect(normalizeToSlug("Córdoba")).toBe("cordoba");
    expect(normalizeToSlug("José González")).toBe("jose-gonzalez");
    expect(normalizeToSlug("Ñoño")).toBe("nono");
  });

  it("replaces spaces with hyphens", () => {
    expect(normalizeToSlug("Bad Bunny")).toBe("bad-bunny");
  });

  it("removes special characters", () => {
    expect(normalizeToSlug("AC/DC")).toBe("acdc");
    expect(normalizeToSlug("Guns N' Roses")).toBe("guns-n-roses");
  });

  it("collapses multiple hyphens", () => {
    expect(normalizeToSlug("a - - b")).toBe("a-b");
  });
});

// ============================================
// generateSeoSlug
// ============================================
describe("generateSeoSlug", () => {
  it("generates slug with Spanish date format", () => {
    const slug = generateSeoSlug("Coldplay", "Madrid", "2026-06-15");
    expect(slug).toBe("coldplay-madrid-15-junio-2026");
  });

  it("generates fallback slug when no date", () => {
    const slug = generateSeoSlug("Coldplay", "Barcelona", null);
    expect(slug).toMatch(/^coldplay-barcelona-\d{4}$/);
  });

  it("handles placeholder year 9999", () => {
    const slug = generateSeoSlug("Coldplay", "Valencia", "9999-01-01");
    expect(slug).not.toContain("9999");
    expect(slug).toMatch(/^coldplay-valencia-\d{4}$/);
  });

  it("normalizes accents in artist and city", () => {
    const slug = generateSeoSlug("Rosalía", "Córdoba", "2026-03-10");
    expect(slug).toBe("rosalia-cordoba-10-marzo-2026");
  });
});

// ============================================
// isCleanSeoUrl
// ============================================
describe("isCleanSeoUrl", () => {
  it("accepts valid SEO slugs with year", () => {
    expect(isCleanSeoUrl("coldplay-madrid-2026")).toBe(true);
  });

  it("accepts valid SEO slugs with Spanish date", () => {
    expect(isCleanSeoUrl("coldplay-madrid-15-junio-2026")).toBe(true);
  });

  it("rejects uppercase slugs", () => {
    expect(isCleanSeoUrl("Coldplay-Madrid-2026")).toBe(false);
  });

  it("rejects double hyphens", () => {
    expect(isCleanSeoUrl("coldplay--madrid-2026")).toBe(false);
  });

  it("rejects noise patterns", () => {
    expect(isCleanSeoUrl("coldplay-madrid-paquetes-vip-2026")).toBe(false);
    expect(isCleanSeoUrl("coldplay-madrid-tickets-2026")).toBe(false);
  });

  it("rejects placeholder years", () => {
    expect(isCleanSeoUrl("coldplay-madrid-9999")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isCleanSeoUrl("")).toBe(false);
  });
});

// ============================================
// hasNoisePatterns
// ============================================
describe("hasNoisePatterns", () => {
  it("detects VIP packages", () => {
    expect(hasNoisePatterns("coldplay-paquetes-vip")).toBe(true);
  });

  it("detects transport", () => {
    expect(hasNoisePatterns("festival-parking")).toBe(true);
    expect(hasNoisePatterns("festival-shuttle")).toBe(true);
  });

  it("detects numeric suffixes (not years)", () => {
    expect(hasNoisePatterns("coldplay-madrid-2")).toBe(true);
  });

  it("does not flag years as noise", () => {
    expect(hasNoisePatterns("coldplay-madrid-2026")).toBe(false);
  });

  it("does not flag clean slugs", () => {
    expect(hasNoisePatterns("coldplay-madrid-15-junio-2026")).toBe(false);
  });
});

// ============================================
// isFestivalSlug
// ============================================
describe("isFestivalSlug", () => {
  it("detects festival keywords", () => {
    expect(isFestivalSlug("primavera-sound-barcelona-2026")).toBe(true);
    expect(isFestivalSlug("mad-cool-madrid-2026")).toBe(true);
    expect(isFestivalSlug("sonorama-2026")).toBe(true);
  });

  it("does not flag regular concerts", () => {
    expect(isFestivalSlug("coldplay-madrid-2026")).toBe(false);
  });
});

// ============================================
// extractCityFromSlug
// ============================================
describe("extractCityFromSlug", () => {
  it("extracts single-word cities", () => {
    expect(extractCityFromSlug("coldplay-madrid-15-junio-2026")).toBe("madrid");
    expect(extractCityFromSlug("rosalia-barcelona-2026")).toBe("barcelona");
  });

  it("extracts multi-word cities", () => {
    expect(extractCityFromSlug("artist-san-sebastian-2026")).toBe("san-sebastian");
  });

  it("returns null when no city found", () => {
    expect(extractCityFromSlug("unknown-place-2026")).toBe(null);
  });
});

// ============================================
// isValidSeoSlug
// ============================================
describe("isValidSeoSlug", () => {
  it("accepts clean slugs", () => {
    expect(isValidSeoSlug("coldplay-madrid-15-junio-2026")).toBe(true);
    expect(isValidSeoSlug("coldplay-madrid-2026")).toBe(true);
  });

  it("rejects uppercase", () => {
    expect(isValidSeoSlug("Coldplay-Madrid-2026")).toBe(false);
  });

  it("rejects numeric suffixes", () => {
    expect(isValidSeoSlug("coldplay-madrid-1")).toBe(false);
  });

  it("rejects placeholder years", () => {
    expect(isValidSeoSlug("coldplay-madrid-9999")).toBe(false);
  });

  it("rejects double hyphens", () => {
    expect(isValidSeoSlug("coldplay--madrid")).toBe(false);
  });
});

// ============================================
// cleanSlug
// ============================================
describe("cleanSlug", () => {
  it("removes numeric suffixes", () => {
    expect(cleanSlug("coldplay-madrid-1")).toBe("coldplay-madrid");
  });

  it("removes placeholder years", () => {
    expect(cleanSlug("coldplay-madrid-9999")).toBe("coldplay-madrid");
    expect(cleanSlug("coldplay-madrid-9999-01-01")).toBe("coldplay-madrid");
  });

  it("collapses double hyphens", () => {
    expect(cleanSlug("cold--play")).toBe("cold-play");
  });

  it("lowercases", () => {
    expect(cleanSlug("COLDPLAY")).toBe("coldplay");
  });
});

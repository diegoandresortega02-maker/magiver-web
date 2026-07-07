import { describe, it, expect } from "vitest";
import { distanceKm, estimateEtaMinutes } from "./geo";

describe("distanceKm", () => {
  it("returns 0 for the same point", () => {
    const p = { lat: -17.7863, lng: -63.1812 };
    expect(distanceKm(p, p)).toBeCloseTo(0, 6);
  });

  it("matches the known distance between two Santa Cruz landmarks", () => {
    // Equipetrol -> Plan 3000, ~8km en línea recta
    const equipetrol = { lat: -17.7863, lng: -63.1812 };
    const plan3000 = { lat: -17.828, lng: -63.1503 };
    const km = distanceKm(equipetrol, plan3000);
    expect(km).toBeGreaterThan(4);
    expect(km).toBeLessThan(10);
  });

  it("is symmetric", () => {
    const a = { lat: -17.78, lng: -63.18 };
    const b = { lat: -17.80, lng: -63.20 };
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 9);
  });
});

describe("estimateEtaMinutes", () => {
  it("estimates more minutes for longer distances at the same speed", () => {
    expect(estimateEtaMinutes(10)).toBeGreaterThan(estimateEtaMinutes(5));
  });

  it("uses the default average city speed of 25 km/h", () => {
    expect(estimateEtaMinutes(25)).toBe(60);
  });
});

import { describe, expect, it } from "vitest";
import { locateSources, locateTargets } from "./validate-alignment.ts";

describe("locateSources", () => {
  it("parçaları sırayla yerleştirir", () => {
    expect(locateSources("I am here", ["I am", " here"])).toEqual([0, 4]);
  });

  it("toleranslı modda parça arasındaki boşluğu atlar", () => {
    expect(locateSources("I am here", ["I am", "here"], true)).toEqual([0, 5]);
  });

  it("kaplama yoksa null döner", () => {
    expect(locateSources("I am here", ["I am"])).toBeNull();
    expect(locateSources("I am here", ["I am", "here"])).toBeNull();
  });
});

describe("locateTargets", () => {
  it("sırasız parçaları asıl konumlarına yerleştirir", () => {
    expect(locateTargets("hayatımın en mutlu günü", ["en mutlu ", "günü", "hayatımın "])).toEqual([10, 19, 0]);
  });

  it("tekrarlı ifadeyi liste sırasıyla ayrı konumlara yerleştirir", () => {
    expect(locateTargets("bugün ve bugün", ["bugün", " ve ", "bugün"])).toEqual([0, 5, 9]);
  });

  it("toleranslı modda boşlukları atlar", () => {
    expect(locateTargets("bugün çok güzel", ["güzel", "bugün", "çok"], true)).toEqual([10, 0, 6]);
  });

  it("aynı konuma iki parça sığmazsa null döner", () => {
    expect(locateTargets("bugün", ["bugün", "bugün"])).toBeNull();
  });

  it("eksik kaplamada null döner", () => {
    expect(locateTargets("bugün güzel", ["bugün"])).toBeNull();
  });
});

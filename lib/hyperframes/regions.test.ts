import { describe, expect, it } from "vitest";
import { regionToBox, regionToCssInline } from "./regions.ts";

describe("regionToBox", () => {
  it("returns a centered fallback when region is undefined", () => {
    expect(regionToBox(undefined)).toEqual({ top: "20%", left: "20%", width: "60%", height: "60%" });
  });

  it("maps known regions to specific boxes", () => {
    expect(regionToBox("top-left")).toEqual({ top: "0%", left: "0%", width: "50%", height: "50%" });
    expect(regionToBox("bottom-right")).toEqual({ top: "50%", left: "50%", width: "50%", height: "50%" });
    expect(regionToBox("left-half")).toEqual({ top: "0%", left: "0%", width: "50%", height: "100%" });
    expect(regionToBox("center")).toEqual({ top: "20%", left: "20%", width: "60%", height: "60%" });
  });

  it("is case-insensitive", () => {
    expect(regionToBox("TOP-LEFT")).toEqual(regionToBox("top-left"));
    expect(regionToBox("Right-Half")).toEqual(regionToBox("right-half"));
  });

  it("treats synonyms as the same region", () => {
    expect(regionToBox("center")).toEqual(regionToBox("middle"));
    expect(regionToBox("top")).toEqual(regionToBox("top-center"));
  });

  it("falls back to a 90% canvas for unknown regions", () => {
    expect(regionToBox("nonexistent-region")).toEqual({
      top: "5%",
      left: "5%",
      width: "90%",
      height: "90%",
    });
  });
});

describe("regionToCssInline", () => {
  it("produces percentage CSS for a known region", () => {
    expect(regionToCssInline("top-left")).toBe("top: 0%; left: 0%; width: 50%; height: 50%;");
  });

  it("produces fallback CSS for an unknown region", () => {
    expect(regionToCssInline("???")).toBe("top: 5%; left: 5%; width: 90%; height: 90%;");
  });
});

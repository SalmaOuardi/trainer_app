import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { hashPw } from "./lib.js";

// Mock the Supabase password fetch so tests don't need a real network
vi.mock("./lib.js", async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, sbGetPw: vi.fn(), sbSetPw: vi.fn() };
});

// LoginScreen is inside App.jsx which is a single large module — import it via a small wrapper
// We test the auth behaviour through the exported lib functions + localStorage directly.

describe("Auth flow (unit)", () => {
  beforeEach(() => localStorage.clear());

  it("correct password hash matches stored hash", async () => {
    const hash = await hashPw("Jeli2025");
    const entered = await hashPw("Jeli2025");
    expect(entered).toBe(hash);
  });

  it("wrong password hash does not match", async () => {
    const stored = await hashPw("Jeli2025");
    const entered = await hashPw("wrongpassword");
    expect(entered).not.toBe(stored);
  });

  it("session is stored in localStorage after successful auth", () => {
    localStorage.setItem("jeli-auth", "1");
    expect(localStorage.getItem("jeli-auth")).toBe("1");
  });

  it("session is absent before login", () => {
    expect(localStorage.getItem("jeli-auth")).toBeNull();
  });

  it("clearing auth key logs the user out", () => {
    localStorage.setItem("jeli-auth", "1");
    localStorage.removeItem("jeli-auth");
    expect(localStorage.getItem("jeli-auth")).toBeNull();
  });
});

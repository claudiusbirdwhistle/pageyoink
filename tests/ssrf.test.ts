import { describe, it, expect } from "vitest";
import { isPrivateIP, checkSsrf } from "../src/utils/ssrf.js";

describe("SSRF Protection", () => {
  describe("isPrivateIP", () => {
    it("blocks loopback addresses", () => {
      expect(isPrivateIP("127.0.0.1")).toBe(true);
      expect(isPrivateIP("127.0.0.2")).toBe(true);
      expect(isPrivateIP("127.255.255.255")).toBe(true);
    });

    it("blocks 10.x.x.x private range", () => {
      expect(isPrivateIP("10.0.0.1")).toBe(true);
      expect(isPrivateIP("10.255.255.255")).toBe(true);
    });

    it("blocks 172.16-31.x.x private range", () => {
      expect(isPrivateIP("172.16.0.1")).toBe(true);
      expect(isPrivateIP("172.31.255.255")).toBe(true);
    });

    it("allows 172.32.x.x (not private)", () => {
      expect(isPrivateIP("172.32.0.1")).toBe(false);
    });

    it("blocks 192.168.x.x private range", () => {
      expect(isPrivateIP("192.168.0.1")).toBe(true);
      expect(isPrivateIP("192.168.1.100")).toBe(true);
    });

    it("blocks link-local / cloud metadata range (169.254.x.x)", () => {
      expect(isPrivateIP("169.254.169.254")).toBe(true);
      expect(isPrivateIP("169.254.0.1")).toBe(true);
    });

    it("blocks 0.0.0.0", () => {
      expect(isPrivateIP("0.0.0.0")).toBe(true);
    });

    it("allows public IPs", () => {
      expect(isPrivateIP("8.8.8.8")).toBe(false);
      expect(isPrivateIP("1.1.1.1")).toBe(false);
      expect(isPrivateIP("93.184.216.34")).toBe(false); // example.com
    });

    it("blocks IPv6 loopback", () => {
      expect(isPrivateIP("::1")).toBe(true);
    });

    it("blocks IPv6 link-local", () => {
      expect(isPrivateIP("fe80::1")).toBe(true);
    });

    it("blocks IPv4-mapped IPv6 private addresses", () => {
      expect(isPrivateIP("::ffff:127.0.0.1")).toBe(true);
      expect(isPrivateIP("::ffff:10.0.0.1")).toBe(true);
      expect(isPrivateIP("::ffff:169.254.169.254")).toBe(true);
    });
  });

  describe("checkSsrf", () => {
    it("blocks private IP URLs", async () => {
      const result = await checkSsrf("http://127.0.0.1/admin");
      expect(result).toContain("private");
    });

    it("blocks cloud metadata endpoint by IP", async () => {
      const result = await checkSsrf("http://169.254.169.254/computeMetadata/v1/");
      expect(result).toContain("private");
    });

    it("blocks metadata.google.internal by hostname", async () => {
      const result = await checkSsrf("http://metadata.google.internal/computeMetadata/v1/");
      expect(result).toContain("internal");
    });

    it("blocks localhost hostname", async () => {
      const result = await checkSsrf("http://localhost:8080/");
      expect(result).toContain("internal");
    });

    it("blocks private IP in URL", async () => {
      const result = await checkSsrf("http://10.0.0.1/secret");
      expect(result).toContain("private");
    });

    it("blocks non-http protocols", async () => {
      const result = await checkSsrf("file:///etc/passwd");
      expect(result).toContain("http");
    });

    it("allows public URLs", async () => {
      const result = await checkSsrf("https://example.com");
      expect(result).toBeNull();
    });

    it("allows public URLs with paths", async () => {
      const result = await checkSsrf("https://www.google.com/search?q=test");
      expect(result).toBeNull();
    });
  });
});

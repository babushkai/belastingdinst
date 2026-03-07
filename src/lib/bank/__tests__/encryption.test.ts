import { describe, it, expect, beforeEach } from "vitest";

// Set encryption key before importing module
beforeEach(() => {
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("encryption", () => {
  it("round-trips encrypt/decrypt", async () => {
    const { encrypt, decrypt } = await import("../encryption");
    const plaintext = "my-secret-token-value";
    const ciphertext = encrypt(plaintext);

    expect(ciphertext).not.toBe(plaintext);
    expect(ciphertext.split(":").length).toBe(3);

    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for same plaintext (random IV)", async () => {
    const { encrypt } = await import("../encryption");
    const plaintext = "same-value";
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);
    expect(c1).not.toBe(c2);
  });

  it("throws on invalid ciphertext format", async () => {
    const { decrypt } = await import("../encryption");
    expect(() => decrypt("invalid")).toThrow();
  });
});

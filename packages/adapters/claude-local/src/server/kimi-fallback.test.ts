import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readKimiFallbackConfig, buildKimiFallbackEnv } from "./kimi-fallback.js";

describe("readKimiFallbackConfig", () => {
  const ORIGINAL_ENV = { ...process.env };
  beforeEach(() => {
    delete process.env.PAPERCLIP_KIMI_API_KEY;
    delete process.env.MOONSHOT_API_KEY;
    delete process.env.KIMI_API_KEY;
    delete process.env.MY_CUSTOM_KIMI_KEY;
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns null when fallback block is absent", () => {
    expect(readKimiFallbackConfig({})).toBeNull();
  });

  it("returns null when fallback.enabled is false", () => {
    expect(readKimiFallbackConfig({ fallback: { enabled: false, provider: "moonshot_kimi" } })).toBeNull();
  });

  it("returns null when provider is not moonshot_kimi", () => {
    expect(
      readKimiFallbackConfig({ fallback: { enabled: true, provider: "openai" } }),
    ).toBeNull();
  });

  it("resolves apiKey from inline value", () => {
    const cfg = readKimiFallbackConfig({
      fallback: { enabled: true, provider: "moonshot_kimi", apiKey: "sk-kimi-INLINE" },
    });
    expect(cfg).not.toBeNull();
    expect(cfg!.apiKey).toBe("sk-kimi-INLINE");
    expect(cfg!.baseUrl).toBe("https://api.kimi.com/coding/v1");
    expect(cfg!.model).toBe("kimi-for-coding");
  });

  it("resolves apiKey from apiKeyEnvVar", () => {
    process.env.MY_CUSTOM_KIMI_KEY = "sk-kimi-FROM-CUSTOM";
    const cfg = readKimiFallbackConfig({
      fallback: { enabled: true, provider: "moonshot_kimi", apiKeyEnvVar: "MY_CUSTOM_KIMI_KEY" },
    });
    expect(cfg!.apiKey).toBe("sk-kimi-FROM-CUSTOM");
  });

  it("falls back to default env var names in priority order", () => {
    process.env.PAPERCLIP_KIMI_API_KEY = "sk-kimi-PAPERCLIP";
    process.env.MOONSHOT_API_KEY = "sk-kimi-MOONSHOT";
    const cfg = readKimiFallbackConfig({
      fallback: { enabled: true, provider: "moonshot_kimi" },
    });
    expect(cfg!.apiKey).toBe("sk-kimi-PAPERCLIP");
  });

  it("returns config with apiKey=null when no key is resolvable", () => {
    const cfg = readKimiFallbackConfig({
      fallback: { enabled: true, provider: "moonshot_kimi" },
    });
    expect(cfg!.apiKey).toBeNull();
  });

  it("uses custom baseUrl and model overrides", () => {
    const cfg = readKimiFallbackConfig({
      fallback: {
        enabled: true,
        provider: "moonshot_kimi",
        apiKey: "sk-kimi-x",
        baseUrl: "https://example.test/v1",
        model: "kimi-foo",
        smallFastModel: "kimi-foo-fast",
      },
    });
    expect(cfg!.baseUrl).toBe("https://example.test/v1");
    expect(cfg!.model).toBe("kimi-foo");
    expect(cfg!.smallFastModel).toBe("kimi-foo-fast");
  });
});

describe("buildKimiFallbackEnv", () => {
  it("throws when apiKey is missing", () => {
    expect(() =>
      buildKimiFallbackEnv({
        enabled: true,
        provider: "moonshot_kimi",
        baseUrl: "https://api.kimi.com/coding/v1",
        apiKey: null,
        apiKeyEnvVar: null,
        model: "kimi-for-coding",
        smallFastModel: "kimi-for-coding",
      }),
    ).toThrow(/no API key resolved/);
  });

  it("produces env-var override map with both API_KEY and AUTH_TOKEN set", () => {
    const env = buildKimiFallbackEnv({
      enabled: true,
      provider: "moonshot_kimi",
      baseUrl: "https://api.kimi.com/coding/v1",
      apiKey: "sk-kimi-x",
      apiKeyEnvVar: null,
      model: "kimi-for-coding",
      smallFastModel: "kimi-for-coding",
    });
    expect(env.ANTHROPIC_BASE_URL).toBe("https://api.kimi.com/coding/v1");
    expect(env.ANTHROPIC_API_KEY).toBe("sk-kimi-x");
    expect(env.ANTHROPIC_AUTH_TOKEN).toBe("sk-kimi-x");
    expect(env.ANTHROPIC_MODEL).toBe("kimi-for-coding");
    expect(env.ANTHROPIC_SMALL_FAST_MODEL).toBe("kimi-for-coding");
    // Empty-string sentinels for caller to delete inherited values:
    expect(env.CLAUDE_CODE_USE_BEDROCK).toBe("");
    expect(env.ANTHROPIC_BEDROCK_BASE_URL).toBe("");
  });
});

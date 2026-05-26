import { asBoolean, asString, parseObject } from "@paperclipai/adapter-utils/server-utils";

const DEFAULT_BASE_URL = "https://api.kimi.com/coding/v1";
const DEFAULT_MODEL = "kimi-for-coding";

export interface KimiFallbackConfig {
  enabled: boolean;
  provider: "moonshot_kimi";
  baseUrl: string;
  apiKey: string | null;
  apiKeyEnvVar: string | null;
  model: string;
  smallFastModel: string;
}

function pickEnv(names: ReadonlyArray<string>): { name: string; value: string } | null {
  for (const name of names) {
    const raw = process.env[name];
    if (typeof raw === "string" && raw.trim().length > 0) {
      return { name, value: raw.trim() };
    }
  }
  return null;
}

/**
 * Parse the agent.adapterConfig.fallback block. Returns null if disabled or absent.
 * Returns a resolved config (with apiKey filled from env if not set inline) if enabled.
 *
 * Expected shape under adapter_config:
 *   {
 *     "fallback": {
 *       "enabled": true,
 *       "provider": "moonshot_kimi",       // only this value is supported in this PR
 *       "baseUrl":  "https://api.kimi.com/coding/v1",
 *       "apiKey":   "sk-kimi-...",         // OPTIONAL — prefer apiKeyEnvVar
 *       "apiKeyEnvVar": "PAPERCLIP_KIMI_API_KEY",  // OPTIONAL — env var to read from
 *       "model":    "kimi-for-coding",
 *       "smallFastModel": "kimi-for-coding"
 *     }
 *   }
 *
 * If neither apiKey nor apiKeyEnvVar resolves to a non-empty value, defaults to
 * looking up PAPERCLIP_KIMI_API_KEY, MOONSHOT_API_KEY, KIMI_API_KEY (in that order).
 */
export function readKimiFallbackConfig(rawConfig: Record<string, unknown>): KimiFallbackConfig | null {
  const block = parseObject(rawConfig.fallback);
  if (!block || Object.keys(block).length === 0) return null;

  const enabled = asBoolean(block.enabled, false);
  if (!enabled) return null;

  const provider = asString(block.provider, "moonshot_kimi");
  if (provider !== "moonshot_kimi") return null;

  const inlineKey = asString(block.apiKey, "").trim() || null;
  const envVarName = asString(block.apiKeyEnvVar, "").trim() || null;

  let resolvedKey: string | null = inlineKey;
  if (!resolvedKey && envVarName) {
    const fromConfigVar = pickEnv([envVarName]);
    if (fromConfigVar) resolvedKey = fromConfigVar.value;
  }
  if (!resolvedKey) {
    const fromDefault = pickEnv(["PAPERCLIP_KIMI_API_KEY", "MOONSHOT_API_KEY", "KIMI_API_KEY"]);
    if (fromDefault) resolvedKey = fromDefault.value;
  }

  return {
    enabled: true,
    provider: "moonshot_kimi",
    baseUrl: asString(block.baseUrl, DEFAULT_BASE_URL),
    apiKey: resolvedKey,
    apiKeyEnvVar: envVarName,
    model: asString(block.model, DEFAULT_MODEL),
    smallFastModel: asString(block.smallFastModel, DEFAULT_MODEL),
  };
}

/**
 * Build the env-var override map that re-aims the `claude` CLI at the Kimi
 * Anthropic-compatible endpoint. Returns an object mergeable into spawnEnv.
 *
 * Keys with empty-string value indicate the caller should DELETE them from the
 * spawn env (so any inherited ANTHROPIC_* values from the original Claude run
 * do not survive into the fallback attempt).
 */
export function buildKimiFallbackEnv(cfg: KimiFallbackConfig): Record<string, string> {
  if (!cfg.apiKey) {
    throw new Error(
      "Kimi fallback enabled but no API key resolved (set adapterConfig.fallback.apiKey, .apiKeyEnvVar, or env PAPERCLIP_KIMI_API_KEY / MOONSHOT_API_KEY / KIMI_API_KEY)",
    );
  }
  return {
    ANTHROPIC_BASE_URL: cfg.baseUrl,
    ANTHROPIC_API_KEY: cfg.apiKey,
    ANTHROPIC_AUTH_TOKEN: cfg.apiKey,
    ANTHROPIC_MODEL: cfg.model,
    ANTHROPIC_SMALL_FAST_MODEL: cfg.smallFastModel,
    CLAUDE_CODE_USE_BEDROCK: "",
    ANTHROPIC_BEDROCK_BASE_URL: "",
  };
}

/** Pretty-printable description for logs. Does not include the API key. */
export function describeKimiFallback(cfg: KimiFallbackConfig): string {
  return `provider=${cfg.provider} baseUrl=${cfg.baseUrl} model=${cfg.model}`;
}

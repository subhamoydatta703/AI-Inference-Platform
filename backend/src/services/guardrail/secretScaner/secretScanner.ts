export interface SecretFinding {
  type: string;
  matched: string;
}

export interface SecretScanResult {
  hasSecrets: boolean;
  findings: SecretFinding[];
}

const SECRET_PATTERNS: Array<{ type: string; pattern: RegExp }> = [
  // OpenAI API Key
  { type: "OpenAI API Key", pattern: /\bsk-[a-zA-Z0-9_-]{20,}\b/g },
  // Anthropic API Key
  { type: "Anthropic API Key", pattern: /\bsk-ant-[a-zA-Z0-9_-]{20,}\b/g },
  // Groq API Key
  { type: "Groq API Key", pattern: /\bgsk_[a-zA-Z0-9]{20,}\b/g },
  // GitHub Personal Access Token / Fine-grained token
  { type: "GitHub Token", pattern: /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}\b/g },
  { type: "GitHub Fine-Grained Token", pattern: /\bgithub_pat_[a-zA-Z0-9_]{50,}\b/g },
  // Slack Tokens
  { type: "Slack Token", pattern: /\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9_-]*\b/g },
  // Google API Key / AI Studio
  { type: "Google API Key", pattern: /\bAIza[0-9A-Za-z-_]{35}\b/g },
  // AWS Access Key ID
  { type: "AWS Access Key", pattern: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g },
  // Generic Private Key blocks
  { type: "Private Key", pattern: /-----BEGIN (RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED)?\s*PRIVATE KEY-----[\s\S]*?-----END (RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED)?\s*PRIVATE KEY-----/g },
  // Database connection strings containing passwords
  { type: "Database Connection String", pattern: /\b(?:postgres|postgresql|mysql|mongodb|redis|sqlserver):\/\/[^\s:]+:[^\s@]+@[^\s:]+:\d+[^\s]*/gi },
  // Generic JWT token
  { type: "JSON Web Token (JWT)", pattern: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g }
];

export function scanForSecrets(text: string): SecretScanResult {
  if (!text || typeof text !== "string") {
    return { hasSecrets: false, findings: [] };
  }

  const findings: SecretFinding[] = [];

  for (const { type, pattern } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        findings.push({
          type,
          matched: m.length > 8 ? `${m.slice(0, 4)}...${m.slice(-4)}` : "[REDACTED]"
        });
      }
    }
  }

  return {
    hasSecrets: findings.length > 0,
    findings,
  };
}


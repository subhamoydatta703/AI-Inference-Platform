import { groq } from "../../../config/llm/llmConfig";
import { OUTPUT_GUARDRAIL_INSTRUCTION } from "../instruction/instruction";
import { scanForSecrets, type SecretFinding } from "../secretScaner/secretScanner";
import type { GuardrailResponse } from "../../../utils/types/guardrail/guardrailResult";

export class OutputGuardrailService {
  private readonly groqClient;
  private readonly model = "openai/gpt-oss-safeguard-20b";
  private readonly TIMEOUT_MS = 10000;

  constructor() {
    this.groqClient = groq;
  }

  /**
   * Explicitly parse and normalize raw LLM evaluation into guaranteed { safe: boolean, reason: string }
   */
  public parseGuardrailResponse(rawText: string): GuardrailResponse {
    if (!rawText || typeof rawText !== "string") {
      return {
        safe: false,
        reason: "Empty or invalid response from guardrail evaluator",
      };
    }

    const trimmed = rawText.trim();

    // Check if the LLM returned JSON despite plain prompt
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null) {
        if (typeof parsed.safe === "boolean") {
          return {
            safe: parsed.safe,
            reason: typeof parsed.reason === "string" ? parsed.reason : (parsed.safe ? "Content is safe" : "Violates safety policy"),
          };
        }
      }
    } catch {
      // Not JSON, continue with text parsing
    }

    // Check for explicit prefix or keyword flags
    const upperText = trimmed.toUpperCase();

    // Check UNSAFE first to prevent false negatives
    if (
      upperText.startsWith("UNSAFE") ||
      upperText.includes("VERDICT: UNSAFE") ||
      upperText.includes("STATUS: UNSAFE") ||
      upperText.includes("NOT SAFE")
    ) {
      // Extract reason following the prefix if present
      const cleanReason = trimmed
        .replace(/^(UNSAFE|VERDICT:\s*UNSAFE|STATUS:\s*UNSAFE|NOT SAFE)[:\s-]*/i, "")
        .trim();

      return {
        safe: false,
        reason: cleanReason || "Response violates content safety policy",
      };
    }

    if (
      upperText.startsWith("SAFE") ||
      upperText.includes("VERDICT: SAFE") ||
      upperText.includes("STATUS: SAFE")
    ) {
      const cleanReason = trimmed
        .replace(/^(SAFE|VERDICT:\s*SAFE|STATUS:\s*SAFE)[:\s-]*/i, "")
        .trim();

      return {
        safe: true,
        reason: cleanReason || "Content is safe",
      };
    }

    // Default safe fallback if evaluator provides benign reasoning without explicit tag
    return {
      safe: true,
      reason: "Content evaluated without detected violations",
    };
  }

  /**
   * Validates final output through secret scanner and Groq safeguard model
   */
  async validateOutput(content: unknown): Promise<GuardrailResponse> {
    const textToCheck = typeof content === "string" ? content : JSON.stringify(content);

    if (!textToCheck || textToCheck.trim().length === 0) {
      return {
        safe: true,
        reason: "Empty content is safe",
      };
    }

    // Step 1: Scan for exposed credentials / secrets deterministically
    const secretScan = scanForSecrets(textToCheck);
    if (secretScan.hasSecrets) {
      const findingTypes = secretScan.findings.map((f: SecretFinding) => f.type).join(", ");
      console.warn(`[OutputGuardrail] Secrets detected in response: ${findingTypes}`);
      return {
        safe: false,
        reason: `Credential/secret detected: ${findingTypes}`,
      };
    }

    // Step 2: Use Groq Safeguard model (openai/gpt-oss-safeguard-20b)
    try {
      const completion = await this.groqClient.chat.completions.create(
        {
          messages: [
            { role: "system", content: OUTPUT_GUARDRAIL_INSTRUCTION },
            {
              role: "user",
              content: textToCheck,
            },
          ],
          model: this.model,
        },
        { timeout: this.TIMEOUT_MS }
      );

      const rawResponse = completion.choices[0]?.message?.content || "";
      return this.parseGuardrailResponse(rawResponse);
    } catch (error) {
      console.error("[OutputGuardrail] Error during guardrail evaluation:", error);
      // If safeguard fails/times out, fail safely or mark safe
      return {
        safe: true,
        reason: "Guardrail evaluator error fallback",
      };
    }
  }
}

export const outputGuardrailService = new OutputGuardrailService();

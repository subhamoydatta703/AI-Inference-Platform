import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";

// Run separately from the HTTP tests, which mock the service module:
// RUN_DATABASE_TESTS=1 bun test integration/apiKeyLifecycle.test.ts
test.skipIf(process.env.RUN_DATABASE_TESTS !== "1")("stored keys release a slot after revocation", async () => {
  const { prisma } = await import("../src/config/db/db");
  const { createApiKeyService, deleteApiKeyService, listApiKeysService, verifyApiKeyService } = await import("../src/services/apiKey/apiKeyService");
  const userId = randomUUID();
  try {
    await prisma.user.create({ data: { id: userId, email: `${userId}@api-key-test.invalid` } });
    let first: { id: string; key: string } | undefined;
    for (let index = 0; index < 5; index++) {
      const created = await createApiKeyService(userId);
      expect(created.success).toBe(true);
      if (index === 0 && created.data) first = created.data;
    }
    expect((await listApiKeysService(userId)).data?.length).toBe(5);
    expect((await createApiKeyService(userId)).success).toBe(false);
    if (!first) throw new Error("Missing initial key");
    expect((await deleteApiKeyService(randomUUID(), first.id)).success).toBe(false);
    expect((await verifyApiKeyService(first.key)).success).toBe(true);
    expect((await deleteApiKeyService(userId, first.id)).success).toBe(true);
    const stored = await listApiKeysService(userId);
    expect(stored.data?.length).toBe(4);
    expect(stored.data?.some((key) => key.id === first!.id)).toBe(false);
    expect(stored.data?.every((key) => !('hashedKey' in key) && !('key' in key))).toBe(true);
    expect((await verifyApiKeyService(first.key)).success).toBe(false);
    expect((await createApiKeyService(userId)).success).toBe(true);
    expect((await listApiKeysService(userId)).data?.length).toBe(5);
  } finally {
    // Cascade deletes only the temporary account and keys created by this test.
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
}, 30000);

import { describe, expect, test } from "bun:test";
import { CreatedUserSchema } from "./userValidation";

describe("Clerk user synchronization payload", () => {
  test("accepts the id and email supplied by authMiddleware without an API-key count", () => {
    const user = { id: "user_clerk123", email: "developer@example.com" };
    expect(CreatedUserSchema.parse(user)).toEqual(user);
  });

  test("rejects an empty user id or invalid email", () => {
    expect(CreatedUserSchema.safeParse({ id: "", email: "developer@example.com" }).success).toBe(false);
    expect(CreatedUserSchema.safeParse({ id: "user_clerk123", email: "invalid" }).success).toBe(false);
  });
});

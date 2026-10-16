import { expect, test } from "@playwright/test";

test("Clerk sign-in opens with a publishable key and no frontend secret", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .click({ timeout: 45000 });
  await expect(page.locator(".cl-signIn-root")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".cl-signIn-root input").first()).toBeVisible();
  await page.screenshot({ path: "test-results/clerk-sign-in.png" });
  await page.getByRole("link", { name: "Sign up", exact: true }).click();
  await expect(page.locator(".cl-signUp-root")).toBeVisible();
});

test("account settings offers real sign-in without a frontend secret", async ({
  page,
}) => {
  await page.goto("/console#settings");
  await expect(
    page.getByRole("heading", {
      name: "Your workspace starts here",
      exact: true,
    }),
  ).toBeVisible({ timeout: 45000 });
  await page
    .getByRole("button", { name: "Sign in to your account", exact: true })
    .click();
  await expect(page.locator(".cl-signIn-root")).toBeVisible();
});

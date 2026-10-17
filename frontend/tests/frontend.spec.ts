import { expect, test, type Page } from "@playwright/test";

async function openNavigation(page: Page) {
  const button = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await button.isVisible()) await button.click();
}

async function expectFitsViewport(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
}

test("landing explains the API integration and leads to documentation", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "One evaluated insight",
  );
  await page.getByText("Do I need to choose a model?", { exact: true }).click();
  await expect(
    page.getByText("No. The orchestration layer", { exact: false }),
  ).toBeVisible();
  await expectFitsViewport(page);
  const preview = await page.locator(".product-preview-frame").boundingBox();
  const stage = await page.locator(".hero-product-stage").boundingBox();
  expect(preview).not.toBeNull();
  expect(stage).not.toBeNull();
  expect(preview!.x).toBeGreaterThanOrEqual(stage!.x);
  expect(preview!.x + preview!.width).toBeLessThanOrEqual(
    stage!.x + stage!.width,
  );
  expect(preview!.y).toBeGreaterThanOrEqual(stage!.y);
  expect(preview!.y + preview!.height).toBeLessThanOrEqual(
    stage!.y + stage!.height,
  );
  await page.screenshot({
    path: `test-results/landing-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .locator(".hero-actions")
    .getByRole("link", { name: "Read integration docs", exact: true })
    .click();
  await expect(page).toHaveURL(/\/console#docs$/);
  await expect(
    page.getByRole("heading", {
      name: "Integration docs",
      level: 1,
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expectFitsViewport(page);
  await page.screenshot({
    path: `test-results/console-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("API keys ignore old demo records and require sign-in for creation", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "inference-preview-keys-v1",
      JSON.stringify([
        {
          id: "old-demo",
          name: "Fake production key",
          prefix: "demo_fake",
          created: "Oct 12, 2026",
          count: 999,
        },
      ]),
    ),
  );
  await page.goto("/console#keys");
  await expect(
    page.getByRole("button", { name: "Create API key", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "No key data available", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Fake production key", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("main")
    .getByRole("button", { name: "Read integration docs", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Integration docs", level: 1 }),
  ).toBeVisible();
  await expectFitsViewport(page);
});

test("docs contain only Python and TypeScript and copy the proposed backend contract", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/console#docs");
  await expect(
    page.getByRole("tab", { name: "Python", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab")).toHaveCount(2);
  await expect(page.getByRole("tabpanel")).toContainText("urllib.request");
  await page.getByRole("tab", { name: "TypeScript", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "process.env.INFERENCE_API_KEY",
  );
  await expect(page.getByRole("tabpanel")).toContainText("/api/v1/queries");
  await expect(page.getByRole("tabpanel")).not.toContainText("model:");
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  const code = await page.evaluate(() => navigator.clipboard.readText());
  expect(code).toContain("await fetch");
  expect(code).toContain("not available yet");
  expect(code).toContain("Authorization");
  await expect(
    page.getByText("Proposed API contract — not available yet", {
      exact: true,
    }),
  ).toBeVisible();
  await expectFitsViewport(page);
  await page.screenshot({
    path: `test-results/docs-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("models and history are honest unavailable states with working account navigation", async ({
  page,
}, testInfo) => {
  await page.goto("/console#models");
  await expect(
    page.getByRole("heading", { name: "No models reported yet", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Open playground|Select model/ }),
  ).toHaveCount(0);
  await openNavigation(page);
  await page
    .getByRole("link", { name: "Usage & history", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "No history data available",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await openNavigation(page);
  await page.getByRole("link", { name: "Account", exact: true }).click();
  await expect(
    page.getByText("Account connection is not configured", { exact: true }),
  ).toBeVisible();
  await page.goto("/console#overview");
  await expect(
    page.getByRole("heading", { name: "Overview", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("21,064", { exact: true })).toHaveCount(0);
  await expectFitsViewport(page);
  await page.screenshot({
    path: `test-results/overview-${testInfo.project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
});

test("retired query links open docs and no query form remains", async ({
  page,
}) => {
  await page.goto("/console#playground");
  await expect(
    page.getByRole("heading", { name: "Integration docs", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Your query", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Evaluate query", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Query workspace", exact: true }),
  ).toHaveCount(0);
  await page.goto("/console#workspace");
  await expect(
    page.getByRole("heading", { name: "Integration docs", level: 1 }),
  ).toBeVisible();
  await page.goto("/console#settings");
  await expect(
    page.getByRole("heading", { name: "Account", level: 1 }),
  ).toBeVisible();
});

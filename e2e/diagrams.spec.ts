import { expect, test } from "@playwright/test"

test("схема множин: число підсвічує всі свої множини", async ({ page }) => {
  await page.goto("/theory/number-sets")
  const set = (id: string) => page.locator(`[data-set=${id}]`)

  // клік до гідрації React нічого не робить — повторюємо, доки схема не відреагує
  await expect(async () => {
    await page.getByRole("button", { name: "−1", exact: true }).click()
    await expect(set("Z")).toHaveAttribute("data-state", "member", { timeout: 1_000 })
  }).toPass()

  await expect(set("Q")).toHaveAttribute("data-state", "member")
  await expect(set("R")).toHaveAttribute("data-state", "member")
  await expect(set("N")).toHaveAttribute("data-state", "outside")
  await expect(set("I")).toHaveAttribute("data-state", "outside")

  await page.getByRole("button", { name: "√2", exact: true }).click()
  await expect(set("I")).toHaveAttribute("data-state", "member")
  await expect(set("Q")).toHaveAttribute("data-state", "outside")
})

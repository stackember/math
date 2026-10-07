import { expect, test } from "@playwright/test"

test("схема множин: число підсвічує всі свої множини", async ({ page }) => {
  await page.goto("/math/numbers/number-sets")
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

test("схема множин: мишкою підсвітка йде за курсором і знімається на порожньому місці", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "наведення — лише для мишки")
  await page.goto("/math/numbers/number-sets")
  const set = (id: string) => page.locator(`[data-set=${id}]`)

  await expect(async () => {
    await page.mouse.move(0, 0)
    await page.getByRole("button", { name: "1", exact: true }).hover()
    await expect(set("N")).toHaveAttribute("data-state", "member", { timeout: 1_000 })
  }).toPass()

  await page.getByRole("button", { name: "√5", exact: true }).hover()
  await expect(set("I")).toHaveAttribute("data-state", "member")
  await expect(set("N")).toHaveAttribute("data-state", "outside")

  // порожнє місце в блоці R (лівий нижній кут) — підсвітка має зникнути
  const r = await set("R").boundingBox()
  if (!r) throw new Error("немає блоку R")
  await page.mouse.move(r.x + 8, r.y + r.height - 8)
  await expect(set("R")).toHaveAttribute("data-state", "idle")
})

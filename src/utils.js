import { page } from './puppeteerPage'

export function waitAsync (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function emulateClickAsync (selector) {
  if (selector) {
    await page.click(selector, { delay: 50 + Math.random() * 100 })
  } else {
    await page.mouse.down()
    await waitAsync(50 + Math.random() * 100)
    await page.mouse.up()
  }
}

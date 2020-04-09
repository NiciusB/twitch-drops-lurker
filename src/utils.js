module.exports.waitAsync = waitAsync
function waitAsync (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports.emulateClickAsync = emulateClickAsync
async function emulateClickAsync (page, selector) {
  return await page.click(selector, { delay: 50 + Math.random() * 100 })
}

const puppeteer = require('puppeteer-extra')
const fs = require('fs')
const path = require('path')
const { waitAsync } = require('./utils')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const cookiesPath = path.join(__dirname, '..', 'cookies.json')
const localStoragePath = path.join(__dirname, '..', 'localStorage.json')
if (!fs.existsSync(cookiesPath) || !fs.existsSync(localStoragePath)) {
  throw new Error('cookies.json or localStorage.json not found. Please check README for installation instructions')
}

const savedCookies = require(cookiesPath)
const savedLocalStorage = require(localStoragePath)

module.exports.getPreparedTwitchPage = getPreparedTwitchPage
async function getPreparedTwitchPage () {
  // Prepare browser
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_EXEC_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list'
    ],
    headless: true,
    userDataDir: './puppeteer_tmp',
    dumpio: false,
    defaultViewport: {
      width: 1080,
      height: 720
    }
  })
  const page = await browser.newPage()
  await page.setCookie(...savedCookies)

  // Setup localStorage for twitch.tv
  await page.goto('https://twitch.tv/')
  await waitAsync(100)
  await page.evaluate((_savedLocalStorage) => {
    JSON.parse(_savedLocalStorage).forEach(([key, value]) => {
      window.localStorage.setItem(key, value)
    })
    // Override important values
    window.localStorage.setItem('mature', 'true')
    window.localStorage.setItem('video-quality', '{"default":"160p30"}')
  }, [JSON.stringify(savedLocalStorage)])
  await waitAsync(500)

  return page
}

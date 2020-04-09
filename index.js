require('dotenv').config()
const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const savedCookies = require('./cookies.json')
const savedLocalStorage = require('./localStorage.json')

const game = process.env.GAME
const dropsEnabledTagID = 'c2542d6d-cd10-4532-919b-3d19f30a768b'

main()

async function goToRandomLiveStreamer(page) {
  const streamsDirectoryUrl = `https://www.twitch.tv/directory/game/${game}?tl=${dropsEnabledTagID}`
  await page.goto(streamsDirectoryUrl, { waitUntil: 'networkidle2' });

  const streamHrefs = await page.$$eval('.tw-tower a[data-a-target="preview-card-image-link"]', links => links.map(link => link.href))

  if (!streamHrefs.length) {
    console.warn('No live streams found!')
    return
  }

  const streamerLink = streamHrefs[Math.floor(Math.random() * streamHrefs.length)]
  console.debug(`Watching ${streamerLink.split('/').pop()} ✨`)

  await page.goto(streamerLink)

  await waitAsync(2000)
  // Sometimes it shows a click to unmute overlay. TODO: Investigate a better way to fix, maybe with cookies or localStorage
  await emulateClickAsync(page, '[data-a-target="player-overlay-click-handler"]')
}

async function isPageOnValidStreamer(page) {
  const viewersCountElm = await page.$('[data-a-target="channel-viewers-count"]')
  if (!viewersCountElm) return false

  const gameCategoryHref = await page.$eval('[data-test-selector="labeled-link-title"]', elm => elm.href)
  if (!gameCategoryHref) return false

  return gameCategoryHref === `https://www.twitch.tv/directory/game/${game}`
}

async function main() {
  // Prepare browser
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_EXEC_PATH,
    headless: true,
    userDataDir: './puppeteer_tmp',
    dumpio: false,
    defaultViewport: {
      width: 1080,
      height: 720
    }
  });
  const page = await browser.newPage();
  await page.setCookie(...savedCookies)

  // Setup localStorage for twitch.tv
  await page.goto('https://twitch.tv/');
  await waitAsync(100)
  await page.evaluate((_savedLocalStorage) => {
    JSON.parse(_savedLocalStorage).forEach(([key, value]) => {
      localStorage.setItem(key, value)
    })
    // Override important values
    localStorage.setItem('mature', 'true')
    localStorage.setItem('video-quality', "{\"default\":\"160p30\"}")
  }, [JSON.stringify(savedLocalStorage)]);
  await waitAsync(500)

  // Go watch a streamer
  await goToRandomLiveStreamer(page)

  // Watch for live status, and go to another streamer if needed
  setInterval(async () => {
    if (!(await isPageOnValidStreamer(page))) {
      await goToRandomLiveStreamer(page)
    }
  }, 1000 * 6)

  // For debugging, take a pic every other second
  setInterval(() => {
    page.screenshot({path: './status.jpg'});
  }, 2000)
}

function waitAsync(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
async function emulateClickAsync(page, selector) {
  return await page.click(selector, { delay: 50 + Math.random() * 100 })
}
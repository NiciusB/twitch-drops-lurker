require('dotenv').config()
const puppeteer = require('puppeteer-core');

const game = process.env.GAME
const dropsEnabledTagID = 'c2542d6d-cd10-4532-919b-3d19f30a768b'
const savedCookies = require('./cookies.json')
const savedLocalStorage = require('./localStorage.json')

const streamsUrl = `https://www.twitch.tv/directory/game/${game}?tl=${dropsEnabledTagID}`
main()

async function goToRandomLiveStreamer(page) {
  await page.goto(streamsUrl, { waitUntil: 'networkidle2' });

  const streamHrefs = await page.$$eval('.tw-tower a[data-a-target="preview-card-image-link"]', links => links.map(link => link.href))

  if (!streamHrefs.length) {
    console.warn('No live streams found!')
    return
  }

  await page.goto(streamHrefs[Math.floor(Math.random() * streamHrefs.length)])

  await waitAsync(2000)
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
    args: ['--no-sandbox'],
    dumpio: false,
    defaultViewport: {
      width: 1080,
      height: 720
    }
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36');
  await page.setCookie(...savedCookies)
  await page.goto('https://twitch.tv/');
  await waitAsync(100)
  await page.evaluate((_savedLocalStorage) => {
    JSON.parse(_savedLocalStorage).forEach(([key, value]) => {
      localStorage.setItem(key, value)
    })
  }, [JSON.stringify(savedLocalStorage)]);
  await waitAsync(500)

  // Go to twitch
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
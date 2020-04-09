require('dotenv').config()
const { getPreparedTwitchPage } = require('./puppeteer')
require('./webserver')
const { waitAsync, emulateClickAsync } = require('./utils')
const logger = require('./logger')

const game = process.env.GAME
const dropsEnabledTagID = 'c2542d6d-cd10-4532-919b-3d19f30a768b'

main()

let activeStreamerName = null
let activeStreamerTimestamp = 0
async function goToRandomLiveStreamer (page) {
  activeStreamerName = null
  const streamsDirectoryUrl = `https://www.twitch.tv/directory/game/${game}?tl=${dropsEnabledTagID}`
  await page.goto(streamsDirectoryUrl, { waitUntil: 'networkidle2' })

  const streamHrefs = await page.$$eval('.tw-tower a[data-a-target="preview-card-image-link"]', links => links.map(link => link.href))

  if (!streamHrefs.length) {
    logger.updateStatus('😥 No live streams found!')
    return
  }

  const streamerLink = streamHrefs[Math.floor(Math.random() * streamHrefs.length)]
  activeStreamerName = streamerLink.split('/').pop()
  activeStreamerTimestamp = Date.now()
  logger.updateStatus(`✨ Started watching ${activeStreamerName}`)

  await page.goto(streamerLink)

  await waitAsync(2000)
  // Sometimes it shows a click to unmute overlay. TODO: Investigate a better way to fix, maybe with cookies or localStorage
  await emulateClickAsync(page, '[data-a-target="player-overlay-click-handler"]')
}

async function isPageOnValidStreamer (page) {
  if (!activeStreamerName) return false // We're currently navigating to a streamer, so no

  const liveIndicatorElm = await page.$('.channel-header__user .live-indicator')
  if (!liveIndicatorElm) {
    logger.updateStatus(`⚠️ ${activeStreamerName} is no longer live`)
    return false
  }

  const gameCategoryHref = await page.$eval('[data-test-selector="labeled-link-title"]', elm => elm.href)
  if (!gameCategoryHref || gameCategoryHref !== `https://www.twitch.tv/directory/game/${game}`) {
    logger.updateStatus(`⚠️ ${activeStreamerName} is no longer playing ${game}`)
    return false
  }

  const dropsActivatedCategoryHrefs = await page.$$eval('.channel-info-bar__info-container a.tw-border-radius-rounded', links => links.map(link => link.href))
  if (!dropsActivatedCategoryHrefs.some(href => href === `https://www.twitch.tv/directory/all/tags/${dropsEnabledTagID}`)) {
    logger.updateStatus(`⚠️ ${activeStreamerName} is no longer having drops for ${game}`)
    return false
  }

  return true
}

async function main () {
  const page = await getPreparedTwitchPage()

  // Go watch a streamer
  await goToRandomLiveStreamer(page)

  // Watch for live status, and go to another streamer if needed
  setInterval(async () => {
    if (!(await isPageOnValidStreamer(page))) {
      await goToRandomLiveStreamer(page)
    }
  }, 1000 * 60)

  // Reload page every hour to avoid watching X streamer status going away if the user navigates twitch
  setInterval(async () => {
    if (activeStreamerName === null) return
    const msElapsed = Date.now() - activeStreamerTimestamp
    if (msElapsed < 1000 * 60 * 60) return
    await goToRandomLiveStreamer(page)
  }, 1000 * 60)

  // For debugging, take a pic every other second
  setInterval(() => {
    page.screenshot({ path: './public/status.jpg' })
  }, process.env.SCREENSHOT_INTERVAL * 1000)
}

import { preparePage, page } from './puppeteerPage'
import './webserver'
import { waitAsync, emulateClickAsync } from './utils'
import logger from './logger'

const game = process.env.GAME
const dropsEnabledTagID = 'c2542d6d-cd10-4532-919b-3d19f30a768b'

main()

let activeStreamerName = null
let activeStreamerTimestamp = 0
async function goToRandomLiveStreamer () {
  logger.updateStatus('🔍 Looking for a streamer to watch')

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
  await emulateClickAsync('[data-a-target="player-overlay-click-handler"]')
}

async function isPageOnValidStreamer () {
  if (!activeStreamerName) return false // We're currently navigating to a streamer, so no

  const liveIndicatorElm = await page.$('.live-indicator-container')
  if (!liveIndicatorElm) {
    logger.updateStatus(`⚠️ ${activeStreamerName} is no longer live`)
    return false
  }

  const gameCategoryHref = await page.$eval('[data-a-target="stream-game-link"]', elm => elm.href)
  if (!gameCategoryHref || gameCategoryHref !== `https://www.twitch.tv/directory/game/${game}`) {
    logger.updateStatus(`⚠️ ${activeStreamerName} is no longer playing ${game}`)
    return false
  }

  const dropsActivatedCategory = await page.$('[data-a-target="Drops Enabled"]')
  if (!dropsActivatedCategory) {
    logger.updateStatus(`⚠️ ${activeStreamerName} is no longer having drops for ${game}`)
    return false
  }
  return true
}

async function main () {
  await preparePage()

  // Go watch a streamer
  await goToRandomLiveStreamer()

  // Watch for live status, and go to another streamer if needed
  setInterval(async () => {
    if (!(await isPageOnValidStreamer())) {
      await goToRandomLiveStreamer()
    }
  }, 1000 * 60)

  // Reload page every hour to avoid watching X streamer status going away if the user navigates twitch
  setInterval(async () => {
    if (activeStreamerName === null) return
    const msElapsed = Date.now() - activeStreamerTimestamp
    if (msElapsed < 1000 * 60 * 60) return
    await goToRandomLiveStreamer()
  }, 1000 * 60)

  // Move mouse to random location every 10 sec. Does this do anything? Probably not
  setInterval(async () => {
    const randomScreenPos = (max) => Math.floor(Math.random() * max)
    await page.mouse.move(randomScreenPos(1080), randomScreenPos(720))
  }, 1000 * 10)

  // For debugging, take a pic every other second
  setInterval(() => {
    page.screenshot({ path: './public/status.jpg' })
  }, process.env.SCREENSHOT_INTERVAL * 1000)
}

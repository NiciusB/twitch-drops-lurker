import express from 'express'
import logger from './logger'
import bodyParser from 'body-parser'
import { page } from './puppeteerPage'
import { emulateClickAsync } from './utils'

const app = express()
app.use(bodyParser.json())

app.use(express.static('public'))

app.get('/health', (req, res) => res.status(200).send('ok'))
app.get('/logs', (req, res) => res.status(200).json(logger.statuses))

app.post('/mouseClick', (req, res) => {
  const posX = parseInt(req.body.x) || 0
  const posY = parseInt(req.body.y) || 0
  res.status(200).send('ok')
  logger.updateStatus(`🐭 Mouse click request received for ${posX},${posY}`)
  page.mouse.move(posX, posY).then(() => emulateClickAsync()).catch(() => {})
})

app.post('/kill', (req, res) => {
  res.status(200).send('ok')
  logger.updateStatus('Kill request received. Note that you\'ll need something like pm2 to recover the process. If using vanilla node, it will just end')
  process.kill(process.pid, 'SIGINT')
})
app.get('/', (req, res) => {
  const html = `
    <title>twitch-drops-lurker Monitoring</title>
    <style>
    body, html {
      margin: 0;
    }
    #statusLog {
      display: inline-block;
      margin: 0;
      max-height: 720px;
      overflow: auto;
      vertical-align: top;
      background: lightyellow;
    }
    #killButton {
      display: block;
      vertical-align: top;
      background-color: #e06868;
    }
    </style>
    <img id="statusImage" width="1080" height="720" />
    <pre id="statusLog"></pre>
    <button id="killButton">Kill twitch-drops-lurker</button>
    <script>
      window.env = ${JSON.stringify(process.env)}
    </script>
    <script type="text/javascript" src="monitor.js"></script>
  `
  res.status(200).send(html)
})

const port = process.env.PORT
app.listen(port, () => console.log(`Monitoring webserver listening at http://localhost:${port}`))

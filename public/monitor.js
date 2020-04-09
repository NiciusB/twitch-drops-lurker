/* eslint-env browser */

setInterval(() => {
  updateImage()
  updateLogs()
}, Math.min(window.env.SCREENSHOT_INTERVAL * 1000, 5000))

updateImage()
updateLogs()

document.getElementById('killButton').addEventListener('click', () => {
  fetch('kill', { method: 'POST' }).then(() => {
    setTimeout(window.location.reload, 2000)
  }).catch(err => alert(err.message))
})

function updateImage () {
  document.getElementById('statusImage').src = './status.jpg?t=' + Date.now()
}

function updateLogs () {
  fetch('logs').then(r => r.json()).then(res => {
    document.getElementById('statusLog').innerHTML = JSON.stringify(res, null, 2)
  }).catch(() => {})
}

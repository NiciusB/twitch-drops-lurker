/* eslint-env browser */

setInterval(() => {
  updateImage()
  updateLogs()
}, Math.min(window.env.SCREENSHOT_INTERVAL * 1000, 5000))

updateImage()
updateLogs()

function updateImage () {
  document.getElementById('statusImage').src = './status.jpg?t=' + Date.now()
}

function updateLogs () {
  fetch('logs').then(r => r.json()).then(res => {
    document.getElementById('statusLog').innerHTML = JSON.stringify(res, null, 2)
  }).catch(() => {})
}

function sendMouseClick (x, y) {
  fetch('mouseClick', {
    method: 'POST',
    body: JSON.stringify({ x, y }), // data can be `string` or {object}!
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

document.getElementById('statusImage').addEventListener('click', e => {
  var rect = e.currentTarget.getBoundingClientRect()
  const offsetX = e.clientX - rect.left
  const offsetY = e.clientY - rect.top
  sendMouseClick(offsetX, offsetY)
})

document.getElementById('killButton').addEventListener('click', () => {
  fetch('kill', { method: 'POST' }).then(() => {
    setTimeout(window.location.reload, 2000)
  }).catch(err => alert(err.message))
})

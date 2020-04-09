const statuses = []
function updateStatus (status) {
  console.debug(status)
  statuses.push(status)
  if (statuses.length > 100) statuses.shift()
}

module.exports = {
  updateStatus,
  statuses
}

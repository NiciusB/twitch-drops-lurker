const statuses = []
function updateStatus (status) {
  console.debug(status)
  statuses.unshift(status)
  if (statuses.length > 100) statuses.pop()
}

export default {
  updateStatus,
  statuses
}

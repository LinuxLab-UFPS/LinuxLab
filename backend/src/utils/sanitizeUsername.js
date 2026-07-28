function sanitizeUsername(email) {
  return email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .substring(0, 32)
}

module.exports = { sanitizeUsername }

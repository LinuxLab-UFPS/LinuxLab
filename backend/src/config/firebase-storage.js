const { getStorage } = require("firebase-admin/storage")
const firebaseApp = require("./firebase-admin")
const config = require("./env")

const bucket = firebaseApp
  ? getStorage(firebaseApp).bucket(config.firebase.storageBucket)
  : null

module.exports = bucket

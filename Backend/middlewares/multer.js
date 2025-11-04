//Multer handles image upload by user and then upload in cloud from backend
const multer = require('multer');
const { storage } = require('../CloudConfig');

const upload = multer({ storage });

module.exports = upload;
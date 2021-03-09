const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    short_url: String,
    original_url: String
})

module.exports = mongoose.model("URL", urlSchema);
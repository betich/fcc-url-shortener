require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const dns = require('dns');
const url = require('url').URL;
const mongoose = require('mongoose');

const URL = require('./models/url.js');

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

async function generateId(url) {
  const generate = (str) => {
    let sumCharCode = 0;

    for (var i=0; i<str.length; i++) {
      sumCharCode += str.charCodeAt(i);
    }

    let random = Math.floor(Math.random() * 16 * (10**12) * sumCharCode).toString(16).slice(0,6);
    return random.substr(random.length - 6);
  }

  let id = generate(url);
  let foundURL = await URL.findOne({ short_url: id });
  if (!foundURL) {
    return id;
  } else {
    generateId(url);
  }
}

// Your first API endpoint
app.get('/api/all', (req, res) => {
  URL.find({})
    .then((foundURLs) => {
      res.json({ urls: foundURLs })
    })
    .catch((err) => res.json({ error: err }));
})

app.get('/api/shorturl', (req, res) => {
  res.json({ error: "Please enter a short url id" });
})

app.get('/api/shorturl/:url', (req, res) => {
  URL.findOne({ short_url: req.params.url })
    .then((foundURL) => {
      if (!foundURL) res.json({ error: 	"No short URL found for the given input" });
      else {
        res.redirect(foundURL.original_url);
      }
    })
    .catch((err) => res.redirect('/'))
})

.post('/api/shorturl/find', (req, res) => {
  res.redirect(`/api/shorturl/${req.body.url}`);
})

.post('/api/shorturl/new', (req, res) => {
  const cURL = req.body.url;
  const match = cURL.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/);
  if (!match) return res.json({ error: "Invalid URL" });

  const domain = new url(cURL);
  
  dns.lookup(domain.hostname, async (err, address, family) => {
    if (err) res.json({ error: "Invalid Hostname" });
    else if (address) {
      let randId = await generateId(domain.hostname);

      URL.create({ original_url: cURL, short_url: randId })
        .then((newURL) => {
          res.json({ original_url : cURL, short_url: newURL.short_url });
        })
        .catch((err) => res.json({ error: err })) 
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns");
const urlparser = require("url");
const bodyParse = require("body-parser");
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.DB_URL);
const db = client.db("urlShortner");
const urls = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.use(bodyParse.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  const dnslookup = dns.lookup(
    urlparser.parse(req.body.url).hostname,
    async (err, address) => {
      if (!address) {
        res.json({ error: "invalid url" });
      } else {
        const urlCount = await urls.countDocuments();

        const urlDoc = {
          original_url: req.body.url,
          short_url: urlCount,
        };

        const result = await urls.insertOne(urlDoc);
        console.log(result);
        res.json({
          original_url: req.body.url,
          short_url: urlCount,
        });
      }
    },
  );
});

app.get("/api/shorturl/:shorturl", async (req, res) => {
  const url = req.params.shorturl;
  const urlDoc = await urls.findOne({ short_url: +url });
  res.redirect(urlDoc.original_url);
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

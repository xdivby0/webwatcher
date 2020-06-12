const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const { Telegraf } = require("telegraf");
const mongoClient = require("mongodb").MongoClient;
const stalker = require("./src/stalker.js");


const app = express();
const mongoUrl = "mongodb://localhost:27017";

// "plugins" for express
app.use(bodyParser.json({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const bot = new Telegraf(process.env.BOT_SECRET);

mongoClient.connect(mongoUrl, { useNewUrlParser: true }, (err, con) => {
  if (err) {
    console.error(err);
  } else {
    const db = con.db("stalker");
    const connection = con;
    require("./src/bot.js")(bot, db);

    stalker.startStalkers(bot, db);

    app.listen(8020, () => {
      console.log("API listening on port 8020!");
    });
  }
});

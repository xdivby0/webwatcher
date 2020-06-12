const htmlParser = require("node-html-parser");

const { ObjectID } = require("mongodb");
const axios = require("axios");

const stalkerInfo = {};

// checks if the value has changed
async function check(bot, stalker) {
  let res;
  if (stalker.method === "post") {
    res = await axios({
      url: stalker.url,
      method: "post",
      data: stalker.postBody,
      headers: {
        "Content-Type": stalker.contentType,
      },
    }).catch(console.error);
  } else {
    res = await axios({
      url: stalker.url,
      method: "get",
    }).catch(console.error);
  }
  const root = htmlParser.parse(res.data);
  const newValue = root.querySelector(stalker.querySelector).innerHTML;

  // if new value should be sent instantly
  if (!stalkerInfo[stalker._id].oldValue || stalkerInfo[stalker._id].oldValue !== newValue) {
    bot.telegram.sendMessage(stalker.owner, `Old value was ${stalkerInfo[stalker._id].oldValue || "not defined"}\nNew Value is ${newValue}`);
    stalkerInfo[stalker._id].oldValue = newValue;
  } else if (!stalkerInfo[stalker._id].lastMessage
     || Date.now() - stalkerInfo[stalker._id].lastMessage >= stalker.messageInterval * 1000 * 60) {
    // then only send when messageInterval is done
    bot.telegram.sendMessage(stalker.owner, `Value did not change, still ${newValue}`);
    stalkerInfo[stalker._id].lastMessage = Date.now();
  }
}

// starts the checker function with setInterval
async function startStalker(bot, stalker) {
  check(bot, stalker);
  const timerId = setInterval(check, stalker.interval * 1000, bot, stalker);
  stalkerInfo[stalker._id] = {};
  stalkerInfo[stalker._id].timerId = timerId;
}

module.exports = {
  startStalker(bot, stalker) {
    startStalker(bot, stalker);
  },
  stopStalker(stalkerId) {
    clearInterval(stalkerInfo[stalkerId].timerId);
  },
  // start all stalkers
  startStalkers(bot, db) {
    db.collection("stalkers").find({}).toArray((err, stalkers) => {
      if (err) {
        console.error(err);
      } else {
        stalkers.forEach((stalker) => {
          startStalker(bot, stalker);
        });
      }
    });
  },
};

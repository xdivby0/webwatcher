const htmlParser = require("node-html-parser");

const { ObjectID } = require("mongodb");
const axios = require("axios");

const stalkerInfo = {};

// checks if the value has changed
function deepValue(obj, path) {
  let final = obj;
  for (let i = 0, pathArray = path.split("."), len = pathArray.length; i < len; i += 1) {
    final = final[pathArray[i]];
  }
  return final;
}

async function check(bot, stalker) {
  const config = {
    url: stalker.url,
    method: "get",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/78.0",
      Connection: "keep-alive",
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
    },
  };
  if (stalker.method === "post") {
    config.method = "post";
    config.data = stalker.postBody;
    config.headers["Content-Type"] = stalker.contentType;
  }
  axios(config).then((res) => {
    let newValue = "";
    if (stalker.format === "html") {
      const root = htmlParser.parse(res.data);
      newValue = root.querySelectorAll(stalker.querySelector).map((x) => x.innerHTML).join("\n");
    } else if (stalker.format === "json") {
      // set newValue and let the following code check the change
      newValue = deepValue(res.data, stalker.querySelector);
    } else if (stalker.format === "raw") {
      newValue = res.data;
    } else if (stalker.format === "contains") {
      console.log(res.data);
      console.log(stalker.querySelector);
      newValue = res.data.includes(stalker.querySelector);
    }

    // if new value should be sent instantly
    if (typeof stalkerInfo[stalker._id].oldValue === "undefined" || stalkerInfo[stalker._id].oldValue !== newValue) {
      bot.telegram.sendMessage(stalker.owner, `Old value was ${stalker.format !== "raw" ? (stalkerInfo[stalker._id].oldValue ?? "not defined") : " <raw> "}\nNew Value is ${stalker.format !== "raw" ? newValue : " <raw>"}\n\n${stalker.url}`);
      stalkerInfo[stalker._id].oldValue = newValue;
      stalkerInfo[stalker._id].lastMessage = Date.now();
    } else if (!stalkerInfo[stalker._id].lastMessage) {
      stalkerInfo[stalker._id].lastMessage = Date.now();
    } else if (Date.now() - stalkerInfo[stalker._id].lastMessage
    >= stalker.messageInterval * 1000 * 60) {
      if (parseInt(stalker.messageInterval, 10) !== 0) {
        // then only send when messageInterval is done
        bot.telegram.sendMessage(stalker.owner, `Value did not change, still ${stalker.format !== "raw" ? newValue : ""}\n\n${stalker.url}`);
      }
      stalkerInfo[stalker._id].lastMessage = Date.now();
    }
  }).catch((e) => {
    bot.telegram.sendMessage(stalker.owner, `${e}\n\n${stalker.url}`);
  });
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

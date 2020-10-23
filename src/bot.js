const WizardScene = require("telegraf/scenes/wizard");

const session = require("telegraf/session");
const Stage = require("telegraf/stage");

const Markup = require("telegraf/markup");
const { ObjectID } = require("mongodb");
const stalkerModule = require("./stalker.js");


module.exports = function (bot, db) {
  const setupStalkerScene = new WizardScene(
    "setup_stalker",
    (ctx) => {
      ctx.reply("Enter URL to stalk");
      return ctx.wizard.next();
    },
    (ctx) => {
      ctx.session.url = ctx.message.text;
      ctx.reply("Enter the method (POST or GET)");
      return ctx.wizard.next();
    },
    (ctx) => {
      ctx.session.method = ctx.message.text;
      ctx.reply("HTML, JSON or RAW?");
      return ctx.wizard.next();
    },
    (ctx) => {
      ctx.session.format = ctx.message.text;
      if (ctx.session.method.toLowerCase() === "post") {
        ctx.reply("Enter the post body");
        return ctx.wizard.next();
      }

      ctx.wizard.next();
      return ctx.wizard.steps[ctx.wizard.cursor](ctx);
    },
    (ctx) => {
      if (ctx.session.method.toLowerCase() === "post") {
        ctx.session.postBody = ctx.message.text;
        ctx.reply("Enter the Content-Type");
        return ctx.wizard.next();
      }

      ctx.wizard.next();
      return ctx.wizard.steps[ctx.wizard.cursor](ctx);
    },
    (ctx) => {
      if (ctx.session.method.toLowerCase() === "post") {
        ctx.session.contentType = ctx.message.text;
      }
      ctx.reply("Enter the stalk-interval in seconds (requests to website)");
      return ctx.wizard.next();
    },
    (ctx) => {
      ctx.session.interval = ctx.message.text;
      ctx.reply("Enter the message interval (if nothing changes) in minutes (0 for disable)");
      return ctx.wizard.next();
    },
    (ctx) => {
      if (ctx.session.format.toLowerCase() === "html") {
        ctx.session.messageInterval = ctx.message.text;
        ctx.reply("Enter your HTML query selector");
        return ctx.wizard.next();
      } if (ctx.session.format.toLowerCase() === "json") {
        ctx.session.messageInterval = ctx.message.text;
        ctx.reply("Enter your JSON query");
        return ctx.wizard.next();
      }
      return ctx.wizard.next();
      // return ctx.wizard.steps[ctx.wizard.cursor](ctx);
    },
    async (ctx) => {
      const stalkerObj = {
        url: ctx.session.url,
        method: ctx.session.method.toLowerCase(),
        postBody: ctx.session.postBody || "",
        contentType: ctx.session.contentType || "",
        interval: ctx.session.interval,
        messageInterval: ctx.session.messageInterval,
        querySelector: ctx.message.text || "",
        owner: ctx.from.id,
        format: ctx.session.format.toLowerCase(),
      };

      await db.collection("stalkers").insertOne(stalkerObj).catch(console.error);

      stalkerModule.startStalker(bot, stalkerObj);

      ctx.reply("Thanks, creation is done! Your Stalker is up and running!");
      return ctx.scene.leave();
    },
  );

  const setupStalkerStage = new Stage([setupStalkerScene]);
  bot.use(session());
  bot.use(setupStalkerStage.middleware());

  bot.command("create", (ctx, next) => {
    ctx.scene.enter("setup_stalker");
    next();
  });
  bot.command("delete", (ctx, next) => {
    db.collection("stalkers").find({ owner: ctx.from.id }).toArray((err, stalkers) => {
      if (err) {
        console.error(err);
      } else {
        const buttonList = stalkers.map(
          (stalker) => [Markup.callbackButton(stalker.url, stalker._id)],
        );
        buttonList.push([Markup.callbackButton("cancel", "cancel")]);
        const stalkersKeyboard = Markup.inlineKeyboard(buttonList);
        ctx.reply("Choose the stalker you want to delete", stalkersKeyboard.extra());
      }
    });
    next();
  });
  // this is only called for deletes
  bot.on("callback_query", (ctx, next) => {
    ctx.answerCbQuery();
    ctx.editMessageReplyMarkup(Markup.inlineKeyboard([]));
    const cbData = ctx.callbackQuery.data;
    if (cbData === "cancel") return next();
    db.collection("stalkers").deleteOne({ _id: new ObjectID(cbData), owner: ctx.from.id },
      (err) => {
        if (err) {
          console.error(err);
        }
      });
    stalkerModule.stopStalker(cbData);
    ctx.reply("Stalker has been deleted.");
    return next();
  });
  bot.launch();
};

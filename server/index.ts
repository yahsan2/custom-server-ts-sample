require("dotenv").config();

import { createServer } from "http";
import { parse } from "url";
import next from "next";

import { Botkit } from "botkit";
import { SlackAdapter, SlackEventMiddleware } from "botbuilder-adapter-slack";

const adapter = new SlackAdapter({
  verificationToken: process.env.SLACK_VERIFICATION_TOKEN,
  botToken: process.env.SLACK_BOT_TOKEN,
});

adapter.use(new SlackEventMiddleware());

const controller = new Botkit({
  adapter: adapter,
});

controller.on("message", async (_bot, message) => {
  console.log(message.text);
  console.log(message.channel);
  if (message.client_msg_id) {
    await _bot.reply(message, `I heard a message! ${message.text}`);
    // await bot.reply(message, `I heard a message! ${message.text}`);
  }
});

controller.on(["reaction_added"], async (bot, message) => {
  const emojiKey = message.reaction;
  console.log(emojiKey);
  console.log(bot.replaceDialog("aaaa"));
});

controller.on(["channel_created"], async (bot, message) => {
  await bot.reply(message, `new channel ${message.text}`);
});

// controller.on("app_mention", async (bot, message) => {
//   await bot.reply(message, `I received an app_mention event! ${message}`);
// });

const port = parseInt(process.env.PORT || "9000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    const { pathname, query } = parsedUrl;

    if (pathname === "/a") {
      app.render(req, res, "/a", query);
    } else if (pathname === "/b") {
      app.render(req, res, "/b", query);
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(port);

  // tslint:disable-next-line:no-console
  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );
});

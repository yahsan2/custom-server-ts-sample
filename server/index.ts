require("dotenv").config();

import { createServer } from "http";
import { parse } from "url";

import express from "express";
import bodyParser from "body-parser";
import next from "next";

import { Botkit } from "botkit";
import { SlackAdapter, SlackEventMiddleware } from "botbuilder-adapter-slack";

const port = parseInt(process.env.PORT || "3001", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const webhook_uri = "/api/webhooks";

const webserver = express();
webserver.set("port", port);
webserver.use(bodyParser.json());

const adapter = new SlackAdapter({
  // clientSigningSecret: process.env.SLACK_SIGNSIN_SECRET,
  // clientId: process.env.SLACK_CLIENT_ID, // oauth client id
  // clientSecret: process.env.SLACK_CLIENT_SECRET, // oauth client secret
  // scopes: ["bot"], // oauth scopes requested
  // oauthVersion: "v2",
  // // redirectUri: process.env.REDIRECT_URI, // url to redirect post login defaults to `https://<mydomain>/install/auth`
  // getTokenForTeam: async(team_id) => Promise<string>, // function that returns a token based on team id
  // getBotUserByTeam: async(team_id) => Promise<string>, // function that returns a bot's user id based on team id
  verificationToken: process.env.SLACK_VERIFICATION_TOKEN,
  botToken: process.env.SLACK_BOT_TOKEN,
});

adapter.use(new SlackEventMiddleware());

webserver.all(/\/((?!\/api\/webhooks).)*/, (req, res, next) => {
  const parsedUrl = parse(req.url, true);
  const { pathname } = parsedUrl;

  console.log(pathname);

  if (pathname === webhook_uri) {
    next();
  } else {
    return handle(req, res);
  }
});

const controller = new Botkit({
  webserver,
  webhook_uri,
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
(async () => {
  await app.prepare();
  createServer(controller.webserver).listen(port, function () {
    console.log(
      `> Server listening at http://localhost:${port} as ${
        dev ? "development" : process.env.NODE_ENV
      }`
    );
  });
})();

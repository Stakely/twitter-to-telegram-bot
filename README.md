# Twitter to Telegram bot
This bots forwards tweets from Twitter accounts to Telegram chats.

<br>


# Installation
Node 12 or higher with NPM must be installed.


Rename the `env.example` file to `.env` and set the project variables.


Install dependencies
```
npm i
```


Run the Telegram bot
```
node telegram.js
```


Run the bot in the background using PM2
```
npm i -g pm2
pm2 start telegram.js --name TwitterToTelegramBot
```
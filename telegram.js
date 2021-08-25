const path = require('path')
require('dotenv').config({ path: path.join(__dirname, './.env') })
const Database = require('better-sqlite3')
const twitter = require('./twitter')
const TelegramBot = require('node-telegram-bot-api')

const db = new Database('subscriptions.db', {}) // verbose: console.log
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })

// General commands
bot.onText(/\/start/, async (msg, match) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'This bot forwards tweets from Twitter accounts to Telegram chats.\n\nBot made by [Stakely.io](https://stakely.io) for a private use.\n\nThe source code of this bot is available in our [Github](https://github.com/Stakely).', { parse_mode: 'Markdown' })
})

// Cron
setInterval(async () => {
  console.log('> Checking subscriptions...')
  const subscriptions = db.prepare('SELECT * FROM subscriptions').all()
  for (const subscription of subscriptions) {
    // Get tweets by account since the last check
    const tweets = await twitter.getTweets(subscription.twitter_account, subscription.last_check)
    for (const tweet of tweets) {
      const text = '<b>' + subscription.twitter_account + ' says</b>\n\n' + tweet.text + '\n\n<a href="https://twitter.com/' + subscription.twitter_account + '/status/' + tweet.id + '">TWEET URL</a>'
      // If the tweet does contain a link, show preview. Else, do not show it since it will load the message text from the tweet url
      if (tweet.text.includes('http')) {
        bot.sendMessage(subscription.telegram_chat, text, { parse_mode: 'html' })
      } else {
        bot.sendMessage(subscription.telegram_chat, text, { parse_mode: 'html', disable_web_page_preview: true })
      }
    }
    // Update subscription last check time
    db.prepare('UPDATE subscriptions SET last_check = ? WHERE subscription_id = ?').run(new Date().toISOString(), subscription.subscription_id)
  }
}, 10 * 60 * 1000) // Checks every 10 minutes


// Admin functions
bot.onText(/\/subscribe @(\S+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  // Only admins can use this function
  if (!userIsAdmin(userId)) return

  const twitterAccount = match[1]

  const searchSubscription = db.prepare('SELECT * FROM subscriptions WHERE twitter_account = ? AND telegram_chat = ?').get(twitterAccount, chatId)
  if (searchSubscription) {
    bot.sendMessage(chatId, 'Already subscribed')
    return
  }

  db.prepare('INSERT INTO subscriptions (twitter_account, telegram_chat, last_check) VALUES(?,?,?)').run(twitterAccount, chatId, new Date().toISOString())
  bot.sendMessage(chatId, 'Saved!')
})

bot.onText(/\/subscriptions/, async (msg) => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  // Only admins can use this function
  if (!userIsAdmin(userId)) return

  const searchSubscriptions = db.prepare('SELECT twitter_account FROM subscriptions WHERE telegram_chat = ?').all(chatId)
  bot.sendMessage(chatId, JSON.stringify(searchSubscriptions, null, 2))
})

bot.onText(/\/unsubscribe @(\S+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  // Only admins can use this function
  if (!userIsAdmin(userId)) return

  const twitterAccount = match[1]
  db.prepare('DELETE FROM subscriptions WHERE twitter_account = ? AND telegram_chat = ?').run(twitterAccount, chatId)
  bot.sendMessage(chatId, 'Deleted!')
})


// Helper functions
const userIsAdmin = async (userId) => {
  const admins = process.env.TELEGRAM_ADMINS.split(',')
  for (const admin of admins) {
    if (userId === admin) return true
  }
  return false
}

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, './.env') })
const fetch = require('node-fetch')

// Twitter docs: https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-recent#tab1
const getTweets = async (account, fromDate) => {
  let res = await fetch('https://api.twitter.com/2/tweets/search/recent?query=from:' + account + '&expansions=in_reply_to_user_id&max_results=10&tweet.fields=created_at&start_time=' + fromDate, {
    headers: {
      Authorization: 'Bearer ' + process.env.TWITTER_BEARER_TOKEN
    }
  })
  res = await res.json()
  console.log(res)

  // Normalize empty response
  if (!res.data) return []
  return res.data
}

module.exports = {
  getTweets
}

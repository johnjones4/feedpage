const {promisify} = require('util')
const opmlToJSON = require('opml-to-json')
const requestPromise = require('request-promise-native')
const request = require('request')
const FeedParser = require('feedparser')
const {JSDOM} = require('jsdom')

exports.fetchOPML = () => {
  return requestPromise(process.env.OPML_URL)
    .then(opml => promisify(opmlToJSON)(opml))
}

exports.fetchFeed = (feed) => {
  return new Promise((resolve, reject) => {
    console.log(feed)
    const items = []
    const req = request({
      'uri': feed,
      'agent': false,
      'pool': {
        'maxSockets': 1000
      }
    })
    const feedparser = new FeedParser()
    feedparser.on('error', (err) => {
      reject(err)
    })
    req.on('error', (err) => {
      reject(err)
    })
    req.on('response', function (res) {
      console.log('Parsing ' + feed)
      var stream = this
      if (res.statusCode === 200) {
        stream.pipe(feedparser)
      } else {
        resolve([])
      }
    })
    feedparser.on('readable', function () {
      var stream = this
      var item
      while ((item = stream.read()) !== null) {
        items.push(item)
      }
    })
    feedparser.on('end', function () {
      console.log('Done parsing ' + feed)
      resolve(items)
    })
  })
    .catch((err) => {
      console.error(feed, err)
      return Promise.resolve([])
    })
}

exports.fetchSummary = (url) => {
  console.log(`Finding extended summary for ${url}`)
  return requestPromise(url)
    .then((html) => {
      const dom = new JSDOM(html, {
        url: url
      })
      const element = dom.window.document.querySelector('[itemprop="articleBody"], [role="main"] .postArticle-content, #storytext, article[data-type="article"] .body-copy-v2, [role="main"], [maincontentofpage=""], .article .article-body')
      if (element) {
        console.log(`Found extended summary for ${url}`)
        return element.innerHTML
      } else {
        return null
      }
    })
    .catch(err => {
      console.error(err)
      return null
    })
}

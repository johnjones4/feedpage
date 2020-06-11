const {promisify} = require('util')
const opmlToJSON = require('opml-to-json')
const requestPromise = require('request-promise-native')
const request = require('request')
const extractor = require('node-article-extractor')
const FeedParser = require('feedparser')
const {JSDOM} = require('jsdom')
const sanitizeHtml = require('sanitize-html')

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
        delete item.summary
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
    .then((response) => {
      const dom = new JSDOM(response, {
        url: url
      })
      const element = dom.window.document.querySelector([
        '[itemprop="articleBody"]',
        '[property="schema:articleBody content:encoded"]',
        '[role="main"] .postArticle-content',
        'article[data-type="article"] .body-copy-v2',
        '[role="main"]',
        '[maincontentofpage=""]',
        '.instapaper_body',
        '.article .article-body',
        '.post-entry',
        '#content article',
        '#main article',
        '#storytext article',
        '#main-content article',
        '#content',
        '#main',
        '#storytext',
        '#main-content',
        '#readme'
      ].join(', '))
      if (element) {
        console.log(`Found extended summary for ${url}`)
        return sanitizeHtml(element.innerHTML, {
          allowedTags: [ 'b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
          allowedAttributes: {
            'a': [ 'href' ]
          },
          allowedIframeHostnames: []
        })
      }
      const data = extractor(response)
      if (data) {
        return data.text
      }
      return null
    })
    .catch(err => {
      console.error(err)
      return null
    })
}

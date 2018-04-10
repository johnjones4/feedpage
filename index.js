require('dotenv').config()
const opmlToJSON = require('opml-to-json')
const request = require('request')
const requestPromise = require('request-promise-native')
const express = require('express')
const {promisify} = require('util')
const url = require('url')
const FeedParser = require('feedparser')

const fetchOPML = () => {
  return requestPromise(process.env.OPML_URL)
    .then(opml => promisify(opmlToJSON)(opml))
}

const fetchFeed = (feed) => {
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

const _fetchTreeFeeds = (tree, collector = []) => {
  if (tree.children) {
    const _collector = []
    console.log('Loading ' + tree.title)
    return Promise.all(tree.children.map(child => _fetchTreeFeeds(child, _collector)))
      .then(children => {
        console.log('Done loading ' + tree.title)
        const datedUniqueItems = _collector.filter((item, i) => {
          if (item.pubdate === null) {
            return false
          }
          const similar = _collector.slice(0, i).find(_item => _item.link === item.link || _item.guid === item.guid)
          if (similar) {
            return false
          }
          return true
        })
        datedUniqueItems.sort((a, b) => {
          return b.pubdate.getTime() - a.pubdate.getTime()
        })
        return {
          'title': tree.title,
          'items': datedUniqueItems.slice(0, parseInt(process.env.N_ITEMS || 10)).map(item => {
            return {
              title: item.title,
              link: item.link,
              subheads: [
                item.author,
                url.parse(item.link).hostname,
                new Date().toDateString() === item.pubdate.toDateString() ? item.pubdate.toLocaleTimeString('en-US') : item.pubdate.toLocaleDateString('en-US')
              ].filter(s => s && s.length > 0)
            }
          })
        }
      })
  } else if (tree.type && tree.type === 'rss' && tree.xmlurl) {
    return fetchFeed(tree.xmlurl)
      .then(items => {
        items.forEach(item => collector.push(item))
      })
  }
}

const fetchTreeFeeds = (tree) => {
  return Promise.all(tree.children.map(child => _fetchTreeFeeds(child)))
}

const main = () => {
  let feedCache = null
  let lastUpdated = null
  let lastError = null

  const runFetch = () => {
    fetchOPML()
      .then(data => fetchTreeFeeds(data))
      .then(data => {
        console.log('Feed updated')
        feedCache = data
        lastUpdated = new Date()
        lastError = null
      })
      .catch(e => {
        console.error(e)
        lastError = e
      })
  }
  setInterval(() => runFetch(), 1000 * 60 * parseInt(process.env.REFRESH_MINUTES || 5))
  runFetch()

  const app = express()
  app.set('view engine', 'ejs')
  app.get('/', function(req, res) {
    res.render('index', {
      feeds: feedCache || [],
      lastUpdated,
      lastError
    });
  })
  app.listen(process.env.PORT || 8000)
}

main()

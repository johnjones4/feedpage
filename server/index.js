require('dotenv').config()
const express = require('express')
const url = require('url')
const Database = require('./lib/Database')
const fetchers = require('./lib/fetchers')
const JobQueue = require('./lib/JobQueue')

const database = new Database()
const jobQueue = new JobQueue()

const _getItemSummary = (item) => {
  if (item['content:encoded'] && item['content:encoded']['#']) {
    return item['content:encoded']['#']
  } else if (item['atom:content'] && item['atom:content']['#']) {
    return item['atom:content']['#']
  } else if (item['atom:summary'] && item['atom:summary']['#']) {
    return item['atom:summary']['#']
  } else if (item.description) {
    return item.description
  }
  return ''
}

// const _fetchTreeFeeds = (summaries, tree, collector = []) => {
//   if (tree.children) {
//     const _collector = []
//     console.log('Loading ' + tree.title)
//     return Promise.all(tree.children.map(child => _fetchTreeFeeds(summaries, child, _collector)))
//       .then(children => {
//         console.log('Done loading ' + tree.title)
        
//         return {
//           'title': tree.title,
//           'items': 
//         }
//       })
//   } else if (tree.type && tree.type === 'rss' && tree.xmlurl) {
//     return fetchFeed(tree.xmlurl)
//       .then(items => {
//         items.forEach(item => collector.push(item))
//       })
//   }
// }

// const fetchTreeFeeds = (summaries, tree) => {
//   return Promise.all(tree.children.map(child => _fetchTreeFeeds(summaries, child)))
// }

// const _fetchItemSummary = (item) => {
//   console.log(`Finding extended summary for ${item.link}`)
//   return requestPromise(item.link)
//     .then((html) => {
//       const dom = new JSDOM(html, {
//         url: item.link
//       })
//       const element = dom.window.document.querySelector('[itemprop="articleBody"]')
//       if (element) {
//         console.log(`Found extended summary for ${item.link}`)
//         return element.innerHTML
//       } else {
//         return item.summary
//       }
//     })
//     .catch(err => {
//       console.error(err)
//       return item.summary
//     })
// }

// const _findBestSummaries = (items, newItems = [], i = 0) => {
//   if (i < items.length) {
//     const item = items[i]
//     if (!item.summary || item.summary.length < 1000) {
//       return _fetchItemSummary(item)
//         .then(summary => {
//           newItems.push(Object.assign({}, item, {summary}))
//           return _findBestSummaries(items, newItems, i + 1)
//         })
//     } else {
//       newItems.push(item)
//       return _findBestSummaries(items, newItems, i + 1)
//     }
//   }
//   return Promise.resolve(newItems)
// }

// const findBestSummaries = (feeds) => {
//   const summaries = {}
//   return Promise.all(feeds.map(feed => {
//     return _findBestSummaries(feed.items)
//       .then(items => {
//         items.forEach(item => {
//           summaries[item.link] = item.summary
//         })
//         return Object.assign({}, feed, {items})
//       })
//   }))
//     .then(feeds => {
//       return {feeds, summaries}
//     })
// }

const updateSectionFeeds = (sectionTitle, allFeedItems) => {
  const datedUniqueItems = allFeedItems.filter((item, i) => {
    if (item.pubdate === null) {
      return false
    }
    const similar = allFeedItems.slice(0, i).find(_item => _item.link === item.link || _item.guid === item.guid)
    if (similar) {
      return false
    }
    return true
  })
  datedUniqueItems.sort((a, b) => {
    return b.pubdate.getTime() - a.pubdate.getTime()
  })
  const items = datedUniqueItems.slice(0, parseInt(process.env.N_ITEMS || 10)).map(item => {
    return {
      title: item.title,
      link: item.link,
      summary: _getItemSummary(item),
      image: item.image && item.image.url ? item.image.url : null,
      subheads: [
        item.author,
        url.parse(item.link).hostname,
        new Date().toDateString() === item.pubdate.toDateString() ? item.pubdate.toLocaleTimeString('en-US') : item.pubdate.toLocaleDateString('en-US')
      ].filter(s => s && s.length > 0)
    }
  })
  database.setFeedSectionItems(sectionTitle, items)
}

const enqueueSectionUpdates = (errorHandler) => {
  database.getFeedSections().forEach(section => {
    let feedsParsed = 0
    let allFeedItems = []
    section.feedUrls.forEach(url => {
      jobQueue.enqueue(() => {
        return fetchers.fetchFeed(url)
      })
        .then(feedItems => {
          feedsParsed++
          allFeedItems = allFeedItems.concat(feedItems)
          if (feedsParsed === section.feedUrls.length) {
            updateSectionFeeds(section.title, allFeedItems)
          }
        })
        .catch(err => errorHandler(err))
    })
  })
}

const main = () => {
  let lastUpdated = null
  let lastError = null

  const runFetch = () => {
    fetchers.fetchOPML()
      .then(data => {
        database.setFeedSections(data.children)
        enqueueSectionUpdates((err) => {
          lastError = err
        })
        lastUpdated = new Date()
      })
      .catch(e => {
        console.error(e)
        lastError = e
      })
  }
  setInterval(() => runFetch(), 1000 * 60 * parseInt(process.env.REFRESH_MINUTES || 5))
  runFetch()

  const app = express()
  app.use(express.static('build'))
  app.get('/data', (req, res) => {
    res.send({
      feeds: database.getFeedSections(),
      lastUpdated,
      lastError,
      name: process.env.NAME || 'FeedPage'
    })
  })
  app.listen(process.env.PORT || 8000)
}

main()

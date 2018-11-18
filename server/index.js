require('dotenv').config()
const express = require('express')
const url = require('url')
const Database = require('./lib/Database')
const fetchers = require('./lib/fetchers')
const JobQueue = require('./lib/JobQueue')
const SummaryManager = require('./lib/SummaryManager')

const database = new Database()
const jobQueue = new JobQueue()
const summaryManager = new SummaryManager(database, jobQueue)

const _getItemSummary = (item) => {
  if (summaryManager.get(item.link)) {
    return summaryManager.get(item.link)
  } else {
    let description = null
    if (item['content:encoded'] && item['content:encoded']['#']) {
      description = item['content:encoded']['#']
    } else if (item['atom:content'] && item['atom:content']['#']) {
      description = item['atom:content']['#']
    } else if (item['atom:summary'] && item['atom:summary']['#']) {
      description = item['atom:summary']['#']
    } else if (item.description) {
      description = item.description
    }
    // if (!description || description.length < 1000) {
    //   summaryManager.findSummary(item.link)
    // }
    return description
  }
}

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

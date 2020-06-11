const fetchers = require('./fetchers')

const CACHE_MAX = 200

class SummaryManager {
  constructor (database, jobQueue) {
    this.database = database
    this.jobQueue = jobQueue
    this.cache = []
    this.cachePointer = 0
  }

  get (url) {
    const summary = this.cache.find(item => item.url === url)
    if (!summary) {
      return null
    }
    return summary.text
  }

  set (url, text) {
    this.cache[this.cachePointer] = { text, url }
    this.cachePointer = (this.cachePointer + 1) % CACHE_MAX
  }

  findSummary (url) {
    const summary = this.get(url)
    if (summary) {
      return summary
    }
    return this.jobQueue.enqueue(() => {
      return fetchers.fetchSummary(url)
    })
      .then(summary => {
        if (summary) {
          this.set(url, summary)
          this.database.setFeedItemSummary(url, summary)
          return summary
        }
        return ''
      })
  }
}

module.exports = SummaryManager

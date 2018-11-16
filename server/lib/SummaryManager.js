const fetchers = require('./fetchers')

class SummaryManager {
  constructor (database, jobQueue) {
    this.database = database
    this.jobQueue = jobQueue
    this.cache = {}
  }

  get (url) {
    if (this.cache[url] && this.cache[url] !== true) {
      return this.cache[url]
    } else {
      return null
    }
  }

  findSummary (url) {
    if (!this.cache[url]) {
      this.cache[url] = true
      this.jobQueue.enqueue(() => {
        return fetchers.fetchSummary(url)
      })
        .then(summary => {
          if (summary) {
            this.cache[url] = summary
            this.database.setFeedItemSummary(url, summary)
          }
        })
    }
  }
}

module.exports = SummaryManager

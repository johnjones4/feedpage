
class Database {
  constructor () {
    this.feeds = []
  }

  setFeedSections (feeds) {
    this.feeds = feeds.map(feedSection => {
      return {
        title: feedSection.title,
        feedUrls: feedSection.children.map(child => child.xmlurl),
        items: this.getFeedSectionItems() || []
      }
    })
  }

  getFeedSectionItems (feedSectionTitle) {
    return this.feeds.find(feedSection => feedSection.title === feedSectionTitle)
  }

  setFeedSectionItems (feedSectionTitle, items) {
    this.feeds.find((feedSection, i) => {
      if (feedSection.title === feedSectionTitle) {
        this.feeds[i].items = items.slice(0)
      }
    })
  }

  setFeedItemSummary (url, summary) {
    this.feeds.forEach((feedSection, i) => {
      feedSection.items.forEach((item, j) => {
        if (item.link === url) {
          this.feeds[i].items[j].summary = summary
        }
      })
    })
  }

  getFeedSections () {
    return this.feeds.slice(0)
  }
}

module.exports = Database

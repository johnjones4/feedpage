package feedpage

import (
	"fmt"
	"sort"
	"sync"
	"time"

	strip "github.com/grokify/html-strip-tags-go"
	"github.com/mmcdole/gofeed"
)

type CurrentFeeds struct {
	Sections []FeedSection `json:"sections"`
	Mux      sync.Mutex
}

type FeedSection struct {
	Title string     `json:"title"`
	Items []FeedItem `json:"items"`
}

type FeedItem struct {
	Title       string    `json:"title"`
	URL         string    `json:"url"`
	Description string    `json:"description"`
	PubDate     time.Time `json:"pubDate"`
	Publisher   string    `json:"publisher"`
}

func FeedEngine(url string, currentFeeds *CurrentFeeds) {
	for {
		feedsections := make([]FeedSection, 0)
		sections, err := GetFeeds(url)
		if err != nil {
			fmt.Println("OPML fetch failed: ", err)
		} else {
			for _, section := range sections {
				feedSection := FeedSection{Title: section.Title, Items: make([]FeedItem, 0)}
				for _, outline := range section.Outlines {
					fp := gofeed.NewParser()
					feed, err := fp.ParseURL(outline.XMLUrl)
					if err != nil {
						fmt.Println("Feed fetch failed: ", err)
					} else {
						for _, item := range feed.Items {
							pubdate := time.Now()
							if item.PublishedParsed != nil {
								pubdate = *item.PublishedParsed
							}
							newitem := FeedItem{Title: item.Title, URL: item.Link, Description: strip.StripTags(item.Description), PubDate: pubdate, Publisher: feed.Title}
							feedSection.Items = append(feedSection.Items, newitem)
						}
					}
				}
				fmt.Printf("Loaded %d items\n", len(feedSection.Items))
				sort.Slice(feedSection.Items, func(a int, b int) bool {
					return feedSection.Items[b].PubDate.Unix() < feedSection.Items[a].PubDate.Unix()
				})
				if len(feedSection.Items) > 10 {
					feedSection.Items = feedSection.Items[0:10]
				}
				feedsections = append(feedsections, feedSection)
			}
			fmt.Printf("Loaded %d feeds\n", len(feedsections))
			currentFeeds.Mux.Lock()
			currentFeeds.Sections = feedsections
			currentFeeds.Mux.Unlock()
			time.Sleep(10 * time.Minute)
		}
	}
}

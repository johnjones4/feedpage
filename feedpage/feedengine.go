package feedpage

import (
	"fmt"
	"sort"
	"sync"
	"time"

	strip "github.com/grokify/html-strip-tags-go"
	"github.com/mmcdole/gofeed"
)

type Failure struct {
	URL       string    `json:"url"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

type FailureBuffer struct {
	Failures [10]Failure `json:"failures"`
	pointer  int
}

func (b *FailureBuffer) addFailure(url string, err error) {
	b.Failures[b.pointer] = Failure{url, err.Error(), time.Now()}
	fmt.Print(b.Failures[b.pointer])
	b.pointer++
	if b.pointer >= len(b.Failures) {
		b.pointer = 0
	}
}

func (b *FailureBuffer) copy() FailureBuffer {
	fb := FailureBuffer{
		pointer: b.pointer,
	}
	copy(fb.Failures[:], b.Failures[:])
	return fb
}

func (b *FailureBuffer) IsInFailureState() bool {
	var lastFailure *Failure
	index := b.pointer
	diffsTotal := 0.0
	diffsN := 0.0
	for i := 0; i < len(b.Failures); i++ {
		index -= 1
		if index < 0 {
			index = len(b.Failures) - 1
		}
		failure := b.Failures[index]
		if failure.Message != "" {
			if lastFailure != nil {
				diffsTotal += float64(lastFailure.Timestamp.Sub(failure.Timestamp))
				diffsN++
			}
			lastFailure = &failure
		}
	}
	if diffsN == 0 {
		return false
	}
	avgDiff := diffsTotal / diffsN
	return avgDiff/float64(time.Second) < 60
}

type CurrentFeeds struct {
	Sections []FeedSection
	Failures *FailureBuffer
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
		currentFeeds.Mux.Lock()
		failures := currentFeeds.Failures.copy()
		currentFeeds.Mux.Unlock()
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
						(&failures).addFailure(outline.XMLUrl, err)
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
			currentFeeds.Failures = &failures
			currentFeeds.Mux.Unlock()
			time.Sleep(10 * time.Minute)
		}
	}
}

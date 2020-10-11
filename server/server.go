package main

import (
    "fmt"
    "log"
		"net/http"
		"feedpage"
		"encoding/json"
		"os"
)

var store feedpage.CurrentFeeds

func handler(w http.ResponseWriter, r *http.Request) {
	store.Mux.Lock()
	info, _ := json.Marshal(store.Sections)
	store.Mux.Unlock()
	fmt.Fprint(w, string(info))
}

func main() {
	store = feedpage.CurrentFeeds{Sections: make([]feedpage.FeedSection, 0)}
	go feedpage.FeedEngine(os.Getenv("OPML_URL"), &store)
	http.HandleFunc("/api/feed", handler)
	log.Fatal(http.ListenAndServe(":" + os.Getenv("PORT"), nil))
}

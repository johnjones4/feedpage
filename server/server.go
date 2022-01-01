package main

import (
	"encoding/json"
	"fmt"
	"log"
	"main/feedpage"
	"net/http"
	"os"
)

var store feedpage.CurrentFeeds

func feedHandler(w http.ResponseWriter, r *http.Request) {
	store.Mux.Lock()
	info, _ := json.Marshal(store.Sections)
	store.Mux.Unlock()
	fmt.Fprint(w, string(info))
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	store.Mux.Lock()
	info, _ := json.Marshal(store.Status)
	store.Mux.Unlock()
	fmt.Fprint(w, string(info))
}

func main() {
	store = feedpage.CurrentFeeds{Sections: make([]feedpage.FeedSection, 0)}
	go feedpage.FeedEngine(os.Getenv("OPML_URL"), &store)
	http.HandleFunc("/api/feed", feedHandler)
	http.HandleFunc("/api/status", statusHandler)
	log.Fatal(http.ListenAndServe(":"+os.Getenv("PORT"), nil))
}

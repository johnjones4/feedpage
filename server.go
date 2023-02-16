package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"main/feedpage"
	"net/http"
	"os"
)

//go:embed index.html
var templateStr string

var store feedpage.CurrentFeeds

func feedHandler(w http.ResponseWriter, r *http.Request) {
	store.Mux.Lock()
	info, _ := json.Marshal(store.Sections)
	store.Mux.Unlock()
	fmt.Fprint(w, string(info))
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	store.Mux.Lock()
	info, _ := json.Marshal(store.Failures)
	if store.Failures.IsInFailureState() {
		w.WriteHeader(http.StatusInternalServerError)
	}
	store.Mux.Unlock()
	fmt.Fprint(w, string(info))
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	temp, err := template.New("t").Parse(templateStr)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html")

	store.Mux.Lock()
	temp.Execute(w, &store)
	store.Mux.Unlock()
}

func main() {
	store = feedpage.CurrentFeeds{
		Sections: make([]feedpage.FeedSection, 0),
		Failures: &feedpage.FailureBuffer{},
	}
	go feedpage.FeedEngine(os.Getenv("OPML_URL"), &store)
	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/api/feed", feedHandler)
	http.HandleFunc("/api/status", statusHandler)
	log.Fatal(http.ListenAndServe(":"+os.Getenv("PORT"), nil))
}

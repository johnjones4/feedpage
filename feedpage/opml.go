package feedpage

import (
	"encoding/xml"
	"fmt"
	"io/ioutil"
	"net/http"
)

type Opml struct {
	XMLName xml.Name `xml:"opml"`
	Head    Head     `xml:"head"`
	Body    Body     `xml:"body"`
}

type Head struct {
	XMLName xml.Name `xml:"head"`
	Title   string   `xml:"title"`
}

type Body struct {
	XMLName         xml.Name         `xml:"body"`
	OutlineSections []OutlineSection `xml:"outline"`
}

type OutlineSection struct {
	XMLName  xml.Name  `xml:"outline"`
	Outlines []Outline `xml:"outline"`
	Title    string    `xml:"title,attr"`
}

type Outline struct {
	XMLName xml.Name `xml:"outline"`
	Type    string   `xml:"type,attr"`
	XMLUrl  string   `xml:"xmlUrl,attr"`
}

func GetFeeds(url string) ([]OutlineSection, error) {
	resp, err := http.Get(url)
	if err != nil {
		return []OutlineSection{}, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bad response for feed %s: %d", url, resp.StatusCode)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return []OutlineSection{}, err
	}
	var opml Opml
	xml.Unmarshal(body, &opml)
	return opml.Body.OutlineSections, nil
}

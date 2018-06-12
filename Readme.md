# FeedPage

[![Build Status](https://travis-ci.org/johnjones4/FeedPage.svg?branch=master)](https://travis-ci.org/johnjones4/FeedPage)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

FeedPage is a barebones RSS reader designed to focus on page load time and to get out of your way.

## Setup

FeedPage may be run as a container with the following command:

```sh
docker run \
  --env OPML_URL=<URL to an OPML file> \
  --env N_ITEMS=<Number of items to display per category> \
  --env REFRESH_MINUTES=<How oftern to refresh the feed> \
  johnjones4/feedpage
```

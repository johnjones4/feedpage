run:
	GOPATH=$(shell pwd) PORT=8080 go run server.go

install:
	GOPATH=$(shell pwd) go get github.com/mmcdole/gofeed
	GOPATH=$(shell pwd) go get github.com/grokify/html-strip-tags-go

build:
	GOPATH=$(shell pwd) go build server.go

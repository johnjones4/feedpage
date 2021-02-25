FROM golang:1.15

WORKDIR /go/src/app
COPY . .

ENV GOPATH=/go/src/app
RUN go get github.com/mmcdole/gofeed
RUN go get github.com/grokify/html-strip-tags-go
RUN go build -v server.go

CMD ["/go/src/app/server"]

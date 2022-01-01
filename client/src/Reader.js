import React, { Component } from 'react';
import Story from './Story';
import { Container } from 'reactstrap'

export default class Reader extends Component {
  constructor (props) {
    super(props)
    this.state = {
      feed: [],
      readURLs: localStorage.getItem('readURLs') || []
    }
  }

  componentDidMount() {
    this.loadFeed()
  }

  async loadFeed () {
    const response = await fetch('/api/feed')
    const feed = await response.json()
    this.setState({ feed })
  }

  markAsRead (url) {
    const readURLs = this.state.readURLs.concat([url])
    this.setState({ readURLs })
    localStorage.setItem('readURLs', readURLs)
  }

  render () {
    return (
      <Container>
        { this.state.feed.map(section => (
          <section key={section.title}>
            <h1>
              { section.title }
            </h1>
            <div>
              { section.items.map(story => (<Story story={story} key={story.url} read={this.state.readURLs.indexOf(story.url) >= 0} onRead={() => this.markAsRead(story.url)} />)) }
            </div>
          </section>
        )) }
      </Container>
    );
  }
}

import React, { Component } from 'react';
import './Reader.css';
import Story from './Story';

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
      <div className='Reader'>
        { this.state.feed.map(section => (
          <div className='Reader-section' key={section.title}>
            <h1 className='Reader-section-title'>
              { section.title }
            </h1>
            <div className='Reader-section-items'>
              { section.items.map(story => (<Story story={story} key={story.url} read={this.state.readURLs.indexOf(story.url) >= 0} onRead={() => this.markAsRead(story.url)} />)) }
            </div>
          </div>
        )) }
      </div>
    );
  }
}

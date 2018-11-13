import React, { Component } from 'react';
import lscache from 'lscache';
import './App.css';

const MODE_SUMMARY = 0
const MODE_PAGE = 1

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      name: 'FeedPage',
      feeds: [],
      lastUpdated: null,
      lastError: null,
      activeItem: null,
      mode: MODE_SUMMARY
    }
  }

  componentWillMount () {
    this.fetchData()
    lscache.flushExpired()
  }

  fetchData () {
    fetch('/data')
      .then(res => res.json())
      .then(({name, feeds, lastUpdated, lastError}) => {
        this.setState({
          name,
          feeds,
          lastUpdated,
          lastError
        })
        if ((feeds.length > 0 && feeds[0].items.length > 0)) {
          this.setActiveItem(feeds[0].items[0])
        }
      })
      .catch(err => {
        this.setState({
          lastError: err ? (err.message || (err+'')) : null
        })
      })
  }

  setActiveItem (item) {
    this.setState({
      activeItem: item
    })
    lscache.set(item.link, new Date().getTime(), 60 * 24 * 30);
  }

  setMode (mode) {
    this.setState({mode})
  }

  render () {
    return (
      <div className='App'>
        <nav className='navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow'>
          <a href='/' className='navbar-brand col-md-3 mr-0'>
            {this.state.name}
          </a>
          <div className='w-100 text-center text-white'>
            {this.state.activeItem && this.state.activeItem.title}
          </div>
          <div className='navbar-nav'>
            {
              this.state.activeItem && (
                <div className='btn-group pull-right'>
                  <button className={['btn btn-light', this.state.mode === MODE_SUMMARY ? 'active' : null].join(' ')} onClick={() => this.setMode(MODE_SUMMARY)}>Summary</button>
                  <button className={['btn btn-light', this.state.mode === MODE_PAGE ? 'active' : null].join(' ')} onClick={() => this.setMode(MODE_PAGE)}>Page</button>
                </div>
              )
            }
          </div>
        </nav>
        <div className='container-fluid'>
          <div className='row no-gutters'>
            <nav className='col-md-3 bg-light sidebar'>
              <div className='sidebar-sticky'>
                {
                  this.state.feeds.map((feed, i) => {
                    return (
                      <div key={i}>
                        <h6 className='sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted'>
                          {feed.title}
                        </h6>
                        {
                          feed.items.map((item, j) => {
                            const clickHandler = (event) => {
                              event.preventDefault()
                              this.setActiveItem(item)
                              return false
                            }
                            return (
                              <li className='nav-item' key={j}>
                                <a href={item.link} className={['nav-link', lscache.get(item.link) > 0 ? 'visited' : null].join(' ')} onClick={clickHandler}>
                                  <span className='link-title'>{item.title}</span>
                                  <span className='text-secondary link-subheads'>
                                    {
                                      item.subheads.map((subhead, l) => {
                                        return (<span key={l} className='link-subhead'>{subhead}</span>)
                                      })
                                    }
                                  </span>
                                </a>
                              </li>
                            )
                          })
                        }
                      </div>
                    )
                  })
                }
              </div>
            </nav>
            <main className='col-md-9 ml-sm-auto'>
              { this.state.mode === MODE_PAGE && this.state.activeItem && (<iframe src={this.state.activeItem.link} className='main-frame' title='Active Content'></iframe>)}
              { this.state.mode === MODE_SUMMARY && this.state.activeItem && (
                <div className='content-container'>
                  <h1>{this.state.activeItem.title}</h1>
                  {this.state.activeItem.image && (
                    <img src={this.state.activeItem.image} className='clearfix img-fluid' alt={this.state.activeItem.title} />
                  )}
                  <div className='content-summary clearfix' dangerouslySetInnerHTML={{__html: this.state.activeItem.description}}></div>
                  <p className='clearfix'>
                    <a href={this.state.activeItem.link} target='_blank' className='btn btn-primary'>View More</a>
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

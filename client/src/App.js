import React, { Component } from 'react';
import lscache from 'lscache';
import './App.css';

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      name: 'FeedPage',
      feeds: [],
      lastUpdated: null,
      lastError: null,
      activeItem: null
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
          lastError,
          activeItem: (feeds.length > 0 && feeds[0].items.length > 0) ? feeds[0].items[0] : this.state.activeItem
        })
      })
      .catch(err => {
        this.setState({
          lastError: err ? (err.message || (err+'')) : null
        })
      })
  }

  viewPage (item) {
    this.setState({
      activeItem: item
    })
    lscache.set(item.link, new Date().getTime(), 60 * 24 * 30);
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
              this.state.activeItem && (<a href={this.state.activeItem.link} target='_blank' rel='noopener noreferrer' className='btn btn-light pull-right'>Open</a>)
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
                              this.viewPage(item)
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
              <iframe src={this.state.activeItem && this.state.activeItem.link} className='main-frame' title='Active Content'></iframe>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

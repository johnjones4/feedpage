import React from 'react'
import './Story.css'

export default ({ story, onRead, read}) => {
  const {
    title,
    url,
    description,
    pubDate,
    publisher
  } = story
  return (
    <div className={['Story', read ? 'Story-read' : 'Story-unread'].join(' ')}>
      <h2 className='Story-title'>
        <a href={url} target='_blank' rel='noopener noreferrer' onClick={() => onRead()}>
          {title}
        </a>
      </h2>
      <h3 className='Story-meta'>
        <span className='Story-meta-item'>
          {new Date(Date.parse(pubDate)).toLocaleString()}
        </span>
        <span className='Story-meta-item'>
          {publisher}
        </span>
      </h3>
      <p className='Story-description'>
        {description}
      </p>
    </div>
  )
}

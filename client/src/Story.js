import React from 'react'
import { Card, CardBody, CardTitle, CardSubtitle, CardText } from 'reactstrap'
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
    <Card className={['Story', read ? 'read' : 'unread'].join(' ')}>
      <CardBody>
        <CardTitle tag='h4'>
          <a href={url} target='_blank' rel='noopener noreferrer' onClick={() => onRead()}>
            {title}
          </a>
        </CardTitle>
        <CardSubtitle  tag='h6'>
          <span className='Story-metadata'>
            {new Date(Date.parse(pubDate)).toLocaleString()}
          </span>
          <span className='Story-metadata'>
            {publisher}
          </span>
        </CardSubtitle>
        <CardText>
          {description}
        </CardText>
      </CardBody>
    </Card>
  )
}

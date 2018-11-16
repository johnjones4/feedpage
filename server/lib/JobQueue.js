const async = require('async')

class JobQueue {
  constructor () {
    this.queue = async.queue((task, done) => {
      task.task()
        .then((data) => done(null, data))
        .catch(err => done(err))
    }, 10)
  }

  enqueue (task) {
    return new Promise((resolve, reject) => {
      this.queue.push({task}, (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      })
    })
  }
}

module.exports = JobQueue

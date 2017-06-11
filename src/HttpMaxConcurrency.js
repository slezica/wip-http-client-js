import ProxyPromise from 'proxy-promise'


export default class HttpMaxConcurrency {

  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency
    this._sem = new Semaphore(maxConcurrency)
  }

  async intercept(request, next) {
    await this._sem.down()

    const response = await next(request)
    this._sem.up()

    return response
  }
}


class Semaphore {

  constructor(value=0) {
    this.value = 0
    this.waiters = []
  }

  async down() {
    if (this.value === 0) {
      // We need to wait until up() is called
      const promise = new ProxyPromise()
      this.waiters.push(promise)

      await promise

    } else {
      this.value--
    }
  }

  up() {
    if (this.waiters.length > 0) {
      // We should wake up a waiter instead of increasing value
      this.waiters.shift().resolve()

    } else {
      this.value++
    }
  }
}

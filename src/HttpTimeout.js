
export default class HttpTimeout {

  constructor(ms) {
    this.ms = ms
  }

  async intercept(request, next) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(reject, this.ms)
      const cancel = () => clearTimeout(timeout)

      const promise = next(request)

      promise.then(resolve, reject)
      promise.then(cancel, cancel)
    })
  }

  async sleep(ms) {
    let timeout
    const promise = new Promise(resolve => timeout = setTimeout(resolve, ms))
    promise.cancel = () => clearTimeout(timeout)

    return promise
  }
}

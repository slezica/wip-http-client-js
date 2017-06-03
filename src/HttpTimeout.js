
export default class HttpTimeout {

  constructor(ms) {
    this.ms = ms
  }

  async intercept(request, next) {
    return new Promise(async (resolve, reject) => {
      next(request)
        .then(resolve)
        .catch(reject)

      this.sleep(this.ms)
        .then(_ => new Error(`Request timed out after ${this.ms}ms`))
        .then(reject)
    })
  }

  async sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}

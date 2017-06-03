
export default class HttpRetry {
  constructor(retries=3) {
    this.retries = retries
  }

  async intercept(request, next) {
    const maxAttempts = this.retries + 1

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await next(request)

      } catch (error) {
        if (attempt === maxAttempts) throw error
        await this.sleep(this.getDelayAfter(request, error, attempt))
      }
    }
  }

  getDelayAfter(request, error, attempt) {
    return Math.pow(2, attempt - 1) * 1000
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}


export default class HttpThrowPattern {

  constructor(pattern) {
    this.pattern = pattern.toLowerCase()
    this.next = 0
  }

  async intercept(request, next) {
    if (this.pattern[this.next++ % this.pattern.length] === 's') {
      return await next(request)

    } else {
      throw new Error("HttpThrowPattern decided to fail this request")
    }
  }
}

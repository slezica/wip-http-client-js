
export default class HttpPrefix {
  constructor(prefix) {
    this.prefix = prefix
  }

  async intercept(request, next) {
    // request = request.clone()
    request.url = `${this.prefix}${request.url}`
    return await next(request)
  }
}

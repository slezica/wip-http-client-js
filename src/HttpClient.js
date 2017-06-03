import fetch from 'isomorphic-fetch'


export default class HttpClient {

  constructor(middleware=[]) {
    this.middleware = middleware

    // We'll build a function that composes invocations to middleware components
    // (each component has to call the next). At the end of the calling chain
    // we'll put the `fetch()` function.

    function addToChain(chain, middlewareInstance) {
      return (request) => middlewareInstance.intercept(request, chain)
    }

    this._execute = middleware.reduceRight(addToChain, fetch)
  }

  async request(url, options) {
    return this.execute(new Request(url, options))
  }

  async execute(request) {
    let response = null

    try {
      response = this._execute(request)

    } catch (error) {
      Object.defineProperty(error, 'request', {value: request, enumerable: false})
      throw error
    }

    return response
  }
}

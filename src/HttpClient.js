import fetch from 'isomorphic-fetch'


export default class HttpClient {

  constructor(interceptors) {
    this.interceptors = interceptors

    function addToChain(nextFunc, interceptor) {
      return (request) => interceptor.intercept(request, nextFunc)
    }

    this._execute = interceptors.reduceRight(addToChain, fetch)
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
      Object.defineProperty(error, 'response', {value: response, enumerable: false})

      throw error
    }

    return response
  }
}

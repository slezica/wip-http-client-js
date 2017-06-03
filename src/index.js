import fetch from 'isomorphic-fetch'


class HttpClient {

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


class HttpLogging {

  async intercept(request, next) {
    this.log(`> ${request.method} ${request.url}`)
    this.handleHeaders(request)
    await this.handleBody(request)

    let response
    try {
      response = await next(request)

      this.log(`<  ${response.status}`)
      this.handleHeaders(response)
      await this.handleBody(response)

    } catch (error) {
      this.handleError(error)
    }

    return response
  }

  handleHeaders(requestOrResponse) {
    const headers = requestOrResponse.headers

    if (headers.forEach) {
      headers.forEach((value, name) => this.debug(` ${name}: ${value}`))

    } else if (headers.keys) {
      for (let name of headers.keys()) this.debug(` ${name}: ${headers.get(name)}`)
    }
  }

  async handleBody(requestOrResponse) {
    try {
      const text = await requestOrResponse.clone().text()
      this.debug(text + '\n')

    } catch (error) {
      // Request had no body
    }
  }

  handleError(error) {
    this.error(' ' + error.stack || error)
    throw error
  }

  log(text) {
    console.log(text)
  }

  debug(text) {
    console.error(text)
  }

  error(text) {
    console.error(text)
  }
}


class HttpRetry {
  constructor(retries=3) {
    this.retries = retries
  }

  async intercept(request, next) {
    for (let i = 0; i < 1 + this.retries; i++) {
      try {
        return await next(request)

      } catch (error) {
        if (i === this.retries) throw error
        await this.sleep(this.getDelayAfter(request, error, i + 1))
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


class HttpOnlyOk {

  async intercept(request, next) {
    const response = await next(request)

    if (response.status !== 200) {
      throw new Error(`Response had status ${response.status}`)
    }

    return response
  }
}


class HttpThrowPattern {

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


class HttpTimeout {

  constructor(ms) {
    this.ms = ms
  }

  async intercept(request, next) {
    return new Promise(async (resolve, reject) => {
      setTimeout(_ => reject(this.getError()), this.ms)
      resolve(await next(request))
    })
  }

  getError() {
    return new Error(`Request timed out after ${this.ms}ms`)
  }
}


const httpClient = new HttpClient([
  new HttpRetry(3),
  new HttpLogging(),
  new HttpOnlyOk(),
  new HttpTimeout(900)
])


async function test() {
  // await httpClient.request('http://www.google.com')
  await httpClient.request('http://www.google.com', {method: 'post'})
  // await httpClient.request('https://fetch.spec.whatwg.org/#terminology-headers')
}

test().catch(console.error)


// HttpProxy
// HttpPool
// HttpThrottle

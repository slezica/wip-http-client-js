
export default class HttpLogging {

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

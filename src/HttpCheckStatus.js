
export default class HttpCheckStatus {

  constructor(isValid) {
    this.isValid = isValid || (status) => (status < 400)
  }

  async intercept(request, next) {
    const response = await next(request)

    if (! this.isValid(response.status)) {
      throw new Error(`Response had status ${response.status}`)
    }

    return response
  }
}

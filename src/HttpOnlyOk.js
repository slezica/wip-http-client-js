
export default class HttpOnlyOk {

  async intercept(request, next) {
    const response = await next(request)

    if (response.status !== 200) {
      throw new Error(`Response had status ${response.status}`)
    }

    return response
  }
}

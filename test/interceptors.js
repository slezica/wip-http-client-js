import 'babel-polyfill'

import sinon from 'sinon'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'

use(chaiAsPromised)

import {
  alwaysResolve,
  alwaysReject,
  patternReject
} from './utils'

import {
  HttpLogging,
  HttpRetry,
  HttpTimeout,
  HttpCheckStatus,
  HttpPrefix,
  HttpThrowPattern
} from '../src'


describe("HttpRetry", function() {

  it("calls next() once if successful", async function() {
    const next = alwaysResolve(1234)
    const result = await new HttpRetry().intercept(null, next)

    expect(next.callCount).to.equal(1)
    expect(result).to.equal(1234)
  })

  it("calls next() again on failure, up to retry limit", async function() {
    const next = alwaysReject()
    const maxRetries = 5
    const httpRetry = new HttpRetry(maxRetries)

    httpRetry.sleep = alwaysResolve()

    try {
      await httpRetry.intercept(null, next)
    } catch (error) {}

    expect(next.callCount).to.equal(maxRetries + 1)
  })

  it("stops calling next() if it eventually succeeds", async function() {
    const next = patternReject("ttr")
    const maxRetries = 5
    const httpRetry = new HttpRetry(maxRetries)

    httpRetry.sleep = alwaysResolve()

    try {
      await httpRetry.intercept(null, next)
    } catch (error) {}

    expect(next.callCount).to.equal(3)
  })

  it("uses exponential back-off by default", async function() {
    const next = alwaysReject()
    const maxRetries = 5
    const httpRetry = new HttpRetry(maxRetries)

    httpRetry.sleep = alwaysResolve()

    try {
      await httpRetry.intercept(null, next)
    } catch (error) {}

    expect(httpRetry.sleep.callCount).to.equal(5)
    expect(httpRetry.sleep.args).to.deep.equal([
      [1000],
      [2000],
      [4000],
      [8000],
      [16000]
    ])
  })

  it("fails after retrying with last encountered error", async function() {
    // TODO this is not as strict as I would like
    const next = alwaysReject(TypeError)
    expect(new HttpRetry(2).intercept(null, next)).to.be.rejectedWith(TypeError)
  })
})


describe("HttpTimeout", function() {

  it("calls next() and returns normally if on time", async function() {
    const next = alwaysResolve(1234)

    const result = await new HttpTimeout(1000).intercept(null, next)

    expect(next.callCount).to.equal(1)
    expect(result).to.equal(1234)
  })

  it("calls next(), but fails before return if not on time", async function() {
    const next = alwaysResolve(new Promise(resolve => setTimeout(resolve, 1000)))
    const httpTimeout = new HttpTimeout(1)

    await expect(httpTimeout.intercept(null, next)).to.be.rejectedWith(Error)
    expect(next.callCount).to.equal(1)
  })

  it("forwards errors from next() if they happen before the timeout", async function() {
    // TODO use a custom error type instead of TypeError, which could be thrown
    // by a bug in src or test.
    const next = alwaysReject(TypeError)
    const httpTimeout = new HttpTimeout(1)

    await expect(httpTimeout.intercept(null, next)).to.be.rejectedWith(TypeError)
    expect(next.callCount).to.equal(1)
  })
})


describe("HttpCheckStatus", function() {
  function createNext(status) {
    return alwaysResolve({ status })
  }

  it("accepts (200 < status < 400) by default", async function() {
    const httpCheckStatus = new HttpCheckStatus()

    const tests = []

    for (let status = 200; status < 400; status++) {
      await httpCheckStatus.intercept(null, createNext(status))
    }

    for (let status = 400; status < 600; status++) {
      const promise = httpCheckStatus.intercept(null, createNext(status))
      await expect(promise).to.be.rejectedWith(Error)
    }
  })

  it("takes a custom accept function", async function() {
    const accept = sinon.spy(status => status === 1234)
    const httpCheckStatus = new HttpCheckStatus(accept)

    await httpCheckStatus.intercept(null, createNext(1234))
    expect(accept.calledWith(1234)).to.be.true

    await expect(
      httpCheckStatus.intercept(null, createNext(200))
    ).to.be.rejectedWith(Error)

    expect(accept.calledWith(200)).to.be.true
  })
})


describe("HttpPrefix", function() {
  it("should prepend the prefix to the request URL", async function() {
    const next = alwaysResolve()
    const prefix = 'http://example.com'
    const path = '/hello'

    await new HttpPrefix(prefix).intercept(new Request(path), next)

    expect(next.callCount).to.equal(1)
    expect(next.args[0][0].url).to.equal(prefix + path)
  })
})

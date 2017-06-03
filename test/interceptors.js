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
  HttpOnlyOk,
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
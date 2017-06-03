import sinon from 'sinon'


export function alwaysResolve(value) {
  return sinon.spy(async () => value)
}


export function alwaysReject(ErrorClass=Error) {
  return sinon.spy(async () => { throw new ErrorClass() })
}


export function patternReject(pattern, ErrorClass=Error) {
  let next = 0

  return sinon.spy(async () => {
    if (pattern[next++ % pattern.length] === 't') throw new ErrorClass()
  })
}

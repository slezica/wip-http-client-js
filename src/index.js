export { default as HttpClient } from './HttpClient'
export { default as HttpLogging } from './HttpLogging'
export { default as HttpRetry } from './HttpRetry'
export { default as HttpTimeout } from './HttpTimeout'
export { default as HttpOnlyOk } from './HttpOnlyOk'
export { default as HttpThrowPattern } from './HttpThrowPattern'


// const httpClient = new HttpClient([
//   new HttpRetry(3),
//   new HttpLogging(),
//   new HttpOnlyOk(),
//   new HttpTimeout(900)
// ])


// async function test() {
//   // await httpClient.request('http://www.google.com')
//   await httpClient.request('http://www.google.com', {method: 'post'})
//   // await httpClient.request('https://fetch.spec.whatwg.org/#terminology-headers')
// }

// test().catch(console.error)


// // HttpProxy
// // HttpPool
// // HttpThrottle

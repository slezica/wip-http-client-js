# HttpFlow

Build smart and highly customizable HTTP clients in a few lines of modular,
readable code.

```javascript
import { HttpClient, HttpRetry, HttpTimeout } from 'http-flow'

const httpClient = new HttpClient([
  new HttpRetry(3),
  new HttpTimeout(5000)
])

httpClient.request('http://google.com')
  .then(console.log)
  .catch(console.error)
```

HttpFlow uses the Fetch standard Request, Response, Headers and Body objects, available
in modern browsers and in polyfills for Node.


## Introduction

HttpFlow aims to provide a straightforward `HttpClient` class that can mix
simple middleware components to create complex behavior.

As shown above, this is how you create a tiny but smart `HttpClient`:

```javascript
new HttpClient([
  new HttpRetry(3),
  new HttpTimeout(5000)
])
```

This is a much more complex `HttpClient`, but the code required to assemble it
remains simple and readable:

```javascript
new HttpClient([
  new HttpPrefix('http://example.com/api/v1'),
  new HttpRetry(3),
  new HttpTimeout(5000),
  new HttpMaxConcurrency(10),
  new HttpProxy('http://myproxy.com')
])
```

All the components mentioned above are included in this library, and it's easy
to write your own.


## The `HttpClient` class

An `HttpClient` is constructed from a (potentially empty) array of middleware
components. It exposes a single important method, `execute(request)`, and a number
of convenient wrappers, all of which are detailed below.

The most basic `HttpClient` can be created with no middleware, and results in a thin
wrapper around the `fetch()` function:

```
new HttpClient().get('http://google.com')
new HttpClient().post('http://example.com/api/v1/hello', {

})
```

- **`constructor(middleware=[])`**

    Create a new `HttpClient` given an `Array` of `middleware` instances.

    When passing an array of middleware components, order is important. The `Request`
    object will be passed top-down, and the `Response` object (or an `Error`) will
    bubble back up the chain.

    This `HttpClient` will never wait more than 15 seconds for a request to succeed,
    but during that time window it will retry up to 3 times:

    ```
    new HttpClient([
      new HttpTimeout(15 * 1000),
      new HttpRetry(3)
    ])
    ```

    This other `HttpClient`, in contrast, will always retry a request 3 times, giving
    each attempt a 15 second timeout:

    ```
    new HttpClient([
      new HttpRetry(3),
      new HttpTimeout(15 * 1000),
    ])
    ```

    The Middleware section explains how to write custom middleware, and contains
    a detailed list of included components.


- **`execute(Request) -> Promise<Response>`**

    Make an HTTP request, invoking `fetch()` and running the `Request` and `Response`
    objects through the middleware chain.

    Errors thrown during request processing will have a non-enumerable `request` property, containing the `Request` object that caused them.


_TODO: utility HttpClient methods_.


## Middleware

A middleware component is an object that implements `intercept()`.

- **`intercept(request: Request, next: Function) -> Promise<Response>`**

    Process `request` and return a `Response`, optionally calling `next(request)`
    to invoke the next middleware in the chain. If this is the last component
    in the chain, `next` will invoke `fetch`.


This example component makes a request fail if the HTTP status is not `200 OK`:

    class HttpOnlyOk {

      intercept(request, next) {
        return next(request).then(response => {
          if (response.status !== 200) throw new Error()
        })
      }

    }


### Included Middleware

All the following classes can be imported from the `http-flow` module.


#### HttpTimeout

Throws an `Error` if no response is received before a certain time.

- **`constructor(milliseconds)`**

    Create an `HttpTimeout` that will wait `milliseconds` for a request to complete.


#### HttpRetry

Tries to make a request again if an `Error` is thrown down the chain. Upon
reaching a limit of retries, throws the last `Error`.

- **`constructor(maxRetries)`**

    Create an `HttpRetry` that will retry the first `maxRetries` errors.


#### HttpCheckStatus

Throws an `Error` if `response.status` does not meet a condition.

- **`constructor(isValid=defaultIsValid)`**

    Create an `HttpCheckStatus` that will call `isValid(status)` and throw if
    `false` if returned.

    By default, `isValid(status)` will check `status < 400`.



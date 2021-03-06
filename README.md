# HAL Client

A Typescript focused library to enable declarative access to HAL endpoints.

Its initial intent was to enable a quick way to write tests for HAL APIs.
But using it for regular API clients can also make sense.

## Install

```
npm i hal-client
# or
yarn add hal-client
```

### Browser

No special setup is required when using Browsers that already support `fetch` API. In other cases you simply have to [polyfill](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Polyfill).

### Node.js

As Node.js does not ship with an implementation of `fetch` you have to fill that gap using existing NPM packages. See: https://www.npmjs.com/search?q=fetch

### Custom `fetch`

Using `HalClient.fetchFn` property you can set a custom `fetch` function. E.g. this is used for testing this library:

```
const fetchPromise = Promise.resolve({ json: () => 'expected' });
fetchSpy = sinon.spy(() => fetchPromise);
HalClient.fetchFn = fetchSpy;
```

## Usage

A typical use case might look like this:

```javascript
import { HalClient } from 'hal-client';

async function buyArticle() {
    const shopIndex = HalClient.startAt('http://api.shop.demo').GET();

    const addToCartPayload = { article: 'red shoes' };
    await shopIndex
        .follow('shop:add-to-cart').POST(addToCartPayload)
        .run();

    const orderResult = await shopIndex
        .follow('shop:cart').GET()
        .follow('shop:buy').POST<OrderResult>()
        .run();

    // orderResult will be of type OrderResult
    console.log(orderResult.status);
}
```

You can find more scenarios in the [`./examples`](./examples) folder.

## API

### HalClient

The entry point for defining HAL traversal operations.

#### startAt(entryUrl)

Start the declaration of HAL resource fetching chain with a given URL.

- `entryUrl` - a `string` representing the absolute URL to the API endpoint

*Returns* a new [`ResourceFetcher`](#resourcefetcher) instance.

#### fromHalRes(res: HalResource)

Start the declaration of resource fetching chain based on an existing HAL resouce instance.

- `res` - a materialized `HalResource`, obviously with a `_links` property.

*Returns* a new [`LazyResource`](#lazyresource) instance.

### ResourceFetcher

#### request<T>(requestInit?: RequestInit)

Declares a lazy HTTP operation that can be invoked later.

- `requestInit` - (optional) [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Syntax) instance that is used for the later `fetch` call.

*Returns* a new [`LazyResource`](#lazyresource) instance.

The optional generic type `<T>` can be used to get a typed `Promise` when
later executing the chain with `run()`.

#### GET<T>(requestInit?: RequestInit)

Calls `request()` with predefined `{ method: 'GET' }`.

- `requestInit` - (optional) `RequestInit` instance that is used for the later `fetch` call.

*Returns* a new [`LazyResource`](#lazyresource) instance.

#### PUT<T>(payload?, requestInit?: RequestInit)

Calls `request()` with predefined `{ method: 'PUT' }`.

- `payload` - (optional) object that will be JSON stringified and send as body
- `requestInit` - (optional) `RequestInit` instance that is used for the later `fetch` call.

*Returns* a new [`LazyResource`](#lazyresource) instance.

#### POST<T>(payload?, requestInit?: RequestInit)

Calls `request()` with predefined `{ method: 'POST' }`.

- `payload` - (optional) object that will be JSON stringified and send as body
- `requestInit` - (optional) `RequestInit` instance that is used for the later `fetch` call.

*Returns* a new [`LazyResource`](#lazyresource) instance.

#### DELETE<T>(requestInit?: RequestInit)

Calls `request()` with predefined `{ method: 'DELETE' }`.

- `requestInit` - (optional) `RequestInit` instance that is used for the later `fetch` call.

*Returns* a new [`LazyResource`](#lazyresource) instance.

### LazyResource

#### embedded(key: string, index = 0)

Defines to eventually find an embedded resource by key (and index).

- `key` - the identifier to find the sub resource inside `_embedded` property of the latest HAL resource instance
- `index` - (optional) `number` for cases where the found sub resource is an array of `HalResource` items

*Returns* a new [`LazyResource`](#lazyresource) instance.

#### follow(rel: string, templateParams = {}, relIndex = 0)

Defines a follow operation.

- `rel` - the relation name to follow (a key of the object a HAL resource `_links` property)
- `templateParams` - (optional) in case the matching `HalLink` is `templated`, these parameters are applied to produce the final URL
- `relIndex` - (optional) `number` for cases where the found relation is represented as an array of `HalLink` items

*Returns* a new [`ResourceFetcher`](#resourcefetcher) instance.

#### run()

Executes the defined chain of resource requests.

*Returns* a `Promise`, that resolves the most recent HAL resource of the request chain.

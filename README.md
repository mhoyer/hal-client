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

The `HalClient.startAt()` and `HalClient.fromHalRes()` functions support passing in a custom `fetch` function.

## Usage

A typical use case might look like this:

```javascript
import { HalClient } from 'hal-client';

async function buyArticle() {
    const shopClient = HalClient.startAt('http://api.shop.demo').GET();

    const body = { article: 'red shoes' };

    await shopClient.follow('shop:add-to-cart')
        .POST({ body: JSON.stringify(body) }).run();

    const order = await shopClient
        .follow('shop:cart').GET()
        .follow('shop:buy').POST<Order>()
        .run();

    console.log(order.status);
}
```

You can find more scenarios in the [`./examples`](./examples) folder.

## API

### HalClient

The entry point for defining HAL traversal operations.

#### startAt(entryUrl, fetchFn?)

Start the declaration of HAL resource fetching chain with a given URL.

- `entryUrl` - a `string` representing the absolute URL to the API endpoint
- `fetchFn` - (optional) `Function` following the whatwg spec for the Fetch API. When omitted it will use `window.fetch` if defined.

*Returns* a new [`ResourceFetcher`](#ResourceFetcher) instance.

#### fromHalRes(res: HalResource, fetchFn?)

Start the declaration of resource fetching chain based on an existing HAL resouce instance.

- `res` - a materialized `HalResource`, obviously with a `_links` property.
- `fetchFn` - (optional) `Function` following the whatwg spec for the Fetch API. When omitted it will use `window.fetch` if defined.

*Returns* a new [`StaticResource`](#StaticResource) instance.

### ResourceFetcher

#### request(requestInit?: RequestInit)
Declares a lazy HTTP operation to be invoked later.

- `requestInit` - (optional) [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Syntax) instance to customize `fetch` call.

*Returns* a new [`LazyResource`](#LazyResource) instance.

#### GET(requestInit?: RequestInit)

See `request()`

#### PUT(requestInit?: RequestInit)

See `request()`

#### POST(requestInit?: RequestInit)

See `request()`

#### DELETE(requestInit?: RequestInit)

See `request()`

### StaticResource

Start the declaration of resource fetching chain based on an existing HAL resouce instance.

#### follow(rel: string, templateParams = {}, relIndex = 0)

Defines a follow operation.

- `rel` - the relation name to follow (a key of the object a HAL resource  `_links` property)
- `templateParams` - (optional) in case the matching `HalLink` is `templated`, these parameters are applied to produce the final URL
- `relIndex` - (optional) `number` for cases where the found relation is represented as an array of `HalLink` items

*Returns* a new [`ResourceFetcher`](#ResourceFetcher) instance.

### LazyResource

#### follow(rel: string, templateParams = {}, relIndex = 0)

Defines a follow operation.

- `rel` - the relation name to follow (a key of the object a HAL resource  `_links` property)
- `templateParams` - (optional) in case the matching `HalLink` is `templated`, these parameters are applied to produce the final URL
- `relIndex` - (optional) `number` for cases where the found relation is represented as an array of `HalLink` items

*Returns* a new [`ResourceFetcher`](#ResourceFetcher) instance.

#### run()

Start the declaration of resource fetching chain based on an existing HAL resouce instance.

- `res` - a materialized `HalResource`, obviously with a `_links` property.
- `fetchFn` - (optional) `Function` following the whatwg spec for the Fetch API. When omitted it will use `window.fetch` if defined.

*Returns* a new [`StaticResource`](#StaticResource) instance.

import { HalClient } from '..';

// Again we are starting with an entry URL,
// but don't execute the initial resource `fetch`.
// Instead we declare a traversal to follow the
// `next` relation on the root resources `_links`
// object.

type RootResource = {};
type NextResource = {};

export const async () => {
    const nextRes = await HalClient
    .startAt('http://...')
    .GET<RootResource>()
    .follow('next')          // define to find 'next' rel in previous HAL resource
    .GET<NextResource>()     // define HTTP method to be used for subsequent fetch
    .run();                  // execute both `fetch` calls and return a Promise
}

import { HalClient } from '..';

// Usually a RESTful API has an entry point
// represented as an URL and requires a `GET`
// to start navigating around:

type RootResource = {};

HalClient
    .startAt('http://...')   // define the entry URL to start with
    .GET<RootResource>()     // define HTTP method to be used for initial fetch
    .run()                   // execute the chain and return a Promise
    .then(rootRes => {});    // continue with the HAL resource

// Using ES2017 async/await it can get even more readable:

export default async () => {
    const rootRes = await HalClient
        .startAt('http://...')
        .GET<RootResource>()
        .run();
};

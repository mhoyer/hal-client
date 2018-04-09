import { HalClient } from '..';

// In case you already have a materialized HAL
// resource with `_links` property:

type RootResource = {};
type NextResource = {};

export async function reuseLazyRes() {
    const root = HalClient.startAt('http://...').GET<RootResource>();

    const prevRes = await root.follow('prev').GET<NextResource>().run();
    const nextRes = await root.follow('next').GET<NextResource>().run();
}

// **Be aware:**
// the example above will result in **four** invocations of `fetch`.
// This seems okay as `fetch` (or the underlying User Agent) should
// take care about HTTP caching strategies.
// Nevertheless, if you know what you are doing and want to avoid
// multiple HTTP calls you have to materialize the HAL resources
// in memory and re-use those:

export async function reuseHalRes () {
    const rootRes = await HalClient.startAt('http://...').GET<RootResource>().run();
    const rootResClient = HalClient.fromHalRes(rootRes);

    const prevRes = await rootResClient.follow('prev').GET<NextResource>().run();
    const nextRes = await rootResClient.follow('next').GET<NextResource>().run();
}

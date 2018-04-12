import { HalClient } from '..';

// In case you already have a materialized HAL
// resource with `_links` property:

type RootResource = {};
type SubResource = {};

export async function reuseLazyRes() {
    const root = HalClient.startAt('http://...').GET<RootResource>();

    const prevRes = await root.follow('prev').GET<SubResource>().run();
    const nextRes = await root.follow('next').GET<SubResource>().run();
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
    const rootClient = HalClient.fromHalRes(rootRes);

    const prevRes = await rootClient.follow('prev').GET<SubResource>().run();
    const nextRes = await rootClient.follow('next').GET<SubResource>().run();
}

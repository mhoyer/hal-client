import { HalClient } from '..';

// In case you already have a materialized HAL
// resource with `_links` property:

type NextResource = {};

export default async () => {
    const res = {
        _links: {
            next: { href: 'http://...' }
        }
    };

    await HalClient
        .fromHalRes(res)
        .follow('next')
        .GET<NextResource>()
        .run();
};

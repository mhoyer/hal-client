import { ResourceFetcher } from './resource-fetcher';
import { HalResource } from './hal-resource';
import { StaticResource } from './static-resource';

export class HalClient {
    static fetchFn: FetchFn = typeof(window) !== 'undefined' && window.fetch;

    static startAt(entryUrl: string): ResourceFetcher {
        const urlFn = () => Promise.resolve(entryUrl);
        return new ResourceFetcher(urlFn);
    }

    static fromHalRes(halResource: HalResource) {
        return new StaticResource(halResource);
    }
}

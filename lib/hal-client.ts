import { HalResource } from './hal-resource';
import { LazyResource } from './lazy-resource';
import { ResourceFetcher } from './resource-fetcher';

export class HalClient {
    static fetchFn: FetchFn = typeof(window) !== 'undefined' && window.fetch;

    static startAt(entryUrl: string): ResourceFetcher {
        const lazyUrlPromise = () => Promise.resolve(entryUrl);
        return new ResourceFetcher(lazyUrlPromise);
    }

    static fromHalRes(halResource: HalResource) {
        const lazyHalResPromise = () => Promise.resolve(halResource);
        return new LazyResource(lazyHalResPromise);
    }
}

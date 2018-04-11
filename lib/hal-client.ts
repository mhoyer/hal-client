import { HalResource } from './hal-resource';
import { LazyResource } from './lazy-resource';
import { ResourceFetcher } from './resource-fetcher';

export class HalClient {
    static fetchFn: FetchFn = typeof(window) !== 'undefined' && window.fetch;

    static startAt(entryUrl: string): ResourceFetcher {
        const urlFn = () => Promise.resolve(entryUrl);
        return new ResourceFetcher(urlFn);
    }

    static fromHalRes(halResource: HalResource) {
        return new LazyResource(() => Promise.resolve(halResource));
    }
}

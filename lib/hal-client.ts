import { ResourceFetcher } from './resource-fetcher';
import { HalResource } from './hal-resource';
import { StaticResource } from './static-resource';

export class HalClient {
    static startAt(entryUrl: string, fetchFn?: FetchFn): ResourceFetcher {
        const urlFn = () => Promise.resolve(entryUrl);
        return new ResourceFetcher(urlFn, fetchFn);
    }

    static fromHalRes(halResource: HalResource, fetchFn?: FetchFn) {
        return new StaticResource(halResource, fetchFn);
    }
}

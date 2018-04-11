import { ResourceFetcher } from './resource-fetcher';
import { HalResource } from './hal-resource';
import { HalLink } from './hal-link';
import { HalClient } from './hal-client';

export class LazyResource<T = {}> {
    constructor(private urlFn: LazyPromise<{url: string, ri: RequestInit}>) {
    }

    follow(rel: string, templateParams = {}, relIndex = 0): ResourceFetcher {
        const urlFn = () => this.run().then(halResource => {
            const link = HalResource.findLink(halResource, rel, relIndex);
            const url =  HalLink.applyTemplateParams(link, templateParams);
            return Promise.resolve(url);
        });
        return new ResourceFetcher(urlFn);
    }

    run(): Promise<T & HalResource> {
        return this.urlFn().then(({url, ri}) => {
            return HalClient.fetchFn(url, ri).then(r => r.json());
        });
    }
}

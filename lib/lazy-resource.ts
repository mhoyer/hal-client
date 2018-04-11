import { HalLink } from './hal-link';
import { HalResource } from './hal-resource';
import { ResourceFetcher } from './resource-fetcher';

export class LazyResource<T = {}> {
    constructor(private lazyHalResPromise: LazyPromise<T & HalResource>) {
    }

    follow(rel: string, templateParams = {}, relIndex = 0): ResourceFetcher {
        const urlFn = () => this.run().then(halResource => {
            const link = HalResource.findLink(halResource, rel, relIndex);
            if (!link) {
                const msg = `Unable to find link relation '${rel}'`
                    + (relIndex ? `[${relIndex}]` : '');
                return Promise.reject(new Error(msg));
            }
            const url =  HalLink.applyTemplateParams(link, templateParams);
            return Promise.resolve(url);
        });

        return new ResourceFetcher(urlFn);
    }

    run(): Promise<T & HalResource> {
        return this.lazyHalResPromise();
    }
}

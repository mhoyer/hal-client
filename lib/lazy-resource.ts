import { HalLink } from './hal-link';
import { HalResource } from './hal-resource';
import { ResourceFetcher } from './resource-fetcher';

export class LazyResource<T = {}> {
    constructor(
        private lazyHalResPromise: LazyPromise<T & HalResource>,
        private trace: string[] = []) {
    }

    follow(rel: string, templateParams = {}, relIndex = 0): ResourceFetcher {
        const urlFn = () => this.run().then(halResource => {
            const prettyRel = `'${rel}'` + (relIndex ? `[${relIndex}]` : '');
            this.trace.push(`follow ${prettyRel}`);

            const link = HalResource.findLink(halResource, rel, relIndex);

            if (!link) {
                const msg = `Unable to find link relation ${prettyRel}:${this.formatTrace()} => ✘`;
                return Promise.reject(new Error(msg));
            }

            const url = HalLink.applyTemplateParams(link, templateParams);

            return Promise.resolve(url);
        });
        return new ResourceFetcher(urlFn, this.trace);
    }

    run(): Promise<T & HalResource> {
        return this.lazyHalResPromise();
    }

    private formatTrace() {
        return this.trace.reduce((prev: string, curr: string) => {
            if (curr.indexOf('follow') === 0) return `${prev} => ${curr}`;

            return `${prev}\n  - ${curr}`;
        }, '');
    }
}

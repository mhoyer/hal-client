import { HalLink } from './hal-link';
import { HalResource } from './hal-resource';
import { ResourceFetcher } from './resource-fetcher';

export class LazyResource<T = {}> {
    constructor(
        private lazyHalResPromise: LazyPromise<T & HalResource>,
        private trace: string[] = []) {
    }

    follow(rel: string, templateParams = {}, relIndex = 0): ResourceFetcher {
        const urlFn = () => this.lazyHalResPromise()
            .then(halRes => this.extractUrl(halRes, rel, templateParams, relIndex));
        return new ResourceFetcher(urlFn, this.trace);
    }

    run(): Promise<T & HalResource> {
        return this.lazyHalResPromise()
            .catch(err => {
                const msg = `${err.message}:${this.formatTrace()} => ✘`;
                const error = new Error(msg);
                error.stack = error.stack.concat('\n').concat(err.stack);
                return Promise.reject(error);
            });
    }

    private extractUrl(halResource, rel, templateParams, relIndex) {
        const prettyRel = `'${rel}'` + (relIndex ? `[${relIndex}]` : '');
        this.trace.push(`follow ${prettyRel}`);

        const link = HalResource.findLink(halResource, rel, relIndex);
        if (!link) {
            const msg = `Unable to find link relation ${prettyRel}`;
            return Promise.reject(new Error(msg));
        }

        const url = HalLink.applyTemplateParams(link, templateParams);

        return Promise.resolve(url);
    }

    private formatTrace() {
        return this.trace.reduce((prev: string, curr: string) => {
            if (curr.indexOf('follow') === 0) return `${prev} => ${curr}`;

            return `${prev}\n  - ${curr}`;
        }, '');
    }
}

import { HalLink } from './hal-link';
import { HalResource } from './hal-resource';
import { ResourceFetcher } from './resource-fetcher';

export class LazyResource<T = {}> {
    constructor(
        private lazyHalResPromise: LazyPromise<T & HalResource>,
        private trace: string[] = []) {
    }

    embedded<TSub = {}>(key: string, index = 0): LazyResource<TSub & HalResource> {
        const embeddedHalResPromise = () => this.lazyHalResPromise()
            .then(halRes => this.extractEmbedded<TSub>(halRes, key, index));
        return new LazyResource<TSub>(embeddedHalResPromise, this.trace);
    }

    follow(rel: string, templateParams = {}, relIndex = 0): ResourceFetcher {
        const urlFn = () => this.lazyHalResPromise()
            .then(halRes => this.extractUrl(halRes, rel, templateParams, relIndex));
        return new ResourceFetcher(urlFn, this.trace);
    }

    run(): Promise<T & HalResource> {
        return this.lazyHalResPromise()
            .then(
                resource => {
                    this.resetTrace();
                    return resource;
                },
                err => {
                    const msg = `${err.message}:${this.formatTrace()} => ✘`;
                    const error = new Error(msg);
                    error.stack = error.stack.concat('\n').concat(err.stack);

                    this.resetTrace();

                    return Promise.reject(error);
                });
    }

    private extractEmbedded<TSub>(halResource, key: string, index: number): Promise<TSub & HalResource> {
        const prettyEmbedded = `'${key}'` + (index ? `[${index}]` : '');
        this.trace.push(`embedded ${prettyEmbedded}`);

        const embedded = HalResource.findEmbedded(halResource, key, index);
        if (!embedded) {
            const msg = `Unable to find embedded resource ${prettyEmbedded}`;
            return Promise.reject(new Error(msg));
        }

        return Promise.resolve(embedded as TSub);
    }

    private extractUrl(halResource, rel, templateParams, relIndex): Promise<string> {
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
            if (curr.match(/^(follow|embedded)/)) return `${prev} => ${curr}`;

            return `${prev}\n    | ${curr}`;
        }, '');
    }

    private resetTrace() {
        while (this.trace.length > 0) {
            this.trace.pop();
        }
    }
}

import { HalClient } from './hal-client';
import { LazyResource } from './lazy-resource';

export class ResourceFetcher {
    constructor(
        private lazyUrlPromise: LazyPromise<string>,
        private trace: string[] = []) {
    }

    request<T = {}>(requestInit: RequestInit = {}): LazyResource<T> {
        const lazyHalResPromise = () => this.lazyUrlPromise()
            .then(url => this.fetch(url, requestInit))
            .then(this.extractHalResource);

        return new LazyResource<T>(lazyHalResPromise, this.trace);
    }

    private fetch(url: string, requestInit: RequestInit): any {
        this.trace.push(`${requestInit.method} ${url}`);
        return HalClient.fetchFn(url, requestInit);
    }

    private extractHalResource(response: Response): Promise<any> {
        return response.json()
            .catch(() => response.text)
            .catch(err => {
                const error = new Error(`Unable to extract HAL resource`);
                error.stack = error.stack.concat('\n').concat(err.stack);
                return Promise.reject(error);
            });
    }

    GET<T = {}>(requestInit: RequestInit = {}): LazyResource<T> {
        const ri = Object.assign({}, requestInit, { method: 'GET' });
        return this.request(ri);
    }

    POST<T = {}>(payload?, requestInit: RequestInit = {}): LazyResource<T> {
        const ri = Object.assign({}, requestInit, { method: 'POST' });
        if (payload) {
            ri.body = JSON.stringify(payload);
        }

        return this.request(ri);
    }

    PUT<T = {}>(payload?, requestInit: RequestInit = {}): LazyResource<T> {
        const ri = Object.assign({}, requestInit, { method: 'PUT' });
        if (payload) {
            ri.body = JSON.stringify(payload);
        }

        return this.request(ri);
    }

    DELETE<T = {}>(requestInit: RequestInit = {}): LazyResource<T> {
        const ri = Object.assign({}, requestInit, { method: 'DELETE' });
        return this.request(ri);
    }
}

import { HalClient } from './hal-client';
import { LazyResource } from './lazy-resource';

export class ResourceFetcher {
    constructor(private urlFn: LazyPromise<string>) {
    }

    request<T = {}>(requestInit: RequestInit = {}): LazyResource<T> {
        const lazyUrlPromise = () => this.urlFn()
            .then(url => HalClient.fetchFn(url, requestInit))
            .then(response => response.json());

        return new LazyResource<T>(lazyUrlPromise);
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

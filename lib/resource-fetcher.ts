import { LazyResource } from "./lazy-resource";

export class ResourceFetcher {
    constructor(private urlFn: LazyPromise<string>, private fetchFn?: FetchFn) {
    }

    request<T = {}>(method: string, requestInit: RequestInit = {}): LazyResource<T> {
        requestInit.method = method;
        const urlFn = () => this.urlFn().then(url => ({ url, ri: requestInit}));
        return new LazyResource<T>(urlFn, this.fetchFn);
    }

    GET<T = {}>(requestInit: RequestInit = {}): LazyResource<T> {
        return this.request('GET', requestInit);
    }

    POST<T = {}>(requestInit: RequestInit = {}): LazyResource<T> {
        return this.request('POST', requestInit);
    }

    PUT<T = {}>(requestInit: RequestInit = {}): LazyResource<T> {
        return this.request('PUT', requestInit);
    }

    DELETE<T = {}>(requestInit: RequestInit = {}): LazyResource<T> {
        return this.request('DELETE', requestInit);
    }
}

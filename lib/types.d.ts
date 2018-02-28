type FetchFn = (input: RequestInfo, init?: RequestInit) => Promise<Response>;
type LazyPromise<T> = () => Promise<T>;

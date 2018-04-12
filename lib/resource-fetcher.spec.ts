import * as sinon from 'sinon';
import { expect } from 'chai';

import { HalClient } from './hal-client';
import { LazyResource } from './lazy-resource';
import { ResourceFetcher } from './resource-fetcher';

describe('Resource Fetcher', () => {
    const expectedResource = 'any resource';
    let fetchSpy: sinon.SinonSpy;

    beforeEach('init `fetch` spy', () => {
        const fetchPromise = Promise.resolve({ json: () => Promise.resolve(expectedResource) });
        fetchSpy = sinon.spy(() => fetchPromise);
        HalClient.fetchFn = fetchSpy;
    });

    it('does not `fetch` on creation', () => {
        new ResourceFetcher(() => Promise.resolve('url'));
        expect(fetchSpy).not.called;
    });

    ['GET', 'DELETE'].map(method => {
        describe(`.${method}()`, () => {
            it('does not `fetch`', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'));
                sut[method]();
                expect(fetchSpy).not.called;
            });

            it('creates a `LazyResource` instance', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'));
                const result = sut[method]();
                expect(result).to.be.instanceof(LazyResource);
            });

            it('supports passing request info values', async () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'));
                const result = await sut[method]({ body: 'body' }).run();

                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('url', { method, body: 'body' });
                expect(result).to.be.ok;
            });

            it('overwrites `method` property of request info', async () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'));
                const result = await sut[method]({ method: 'POST' }).run();

                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('url', {method});
                expect(result).to.be.ok;
            });

            it('supports empty response body', async () => {
                const emptyResponseFetchPromise = Promise.resolve({ json: () => Promise.reject('not parsable') });
                HalClient.fetchFn = sinon.spy(() => emptyResponseFetchPromise);

                const sut = new ResourceFetcher(() => Promise.resolve('url'));
                const result = await sut[method]({ method: 'POST' }).run();

                expect(result).to.be.undefined;
            });
        });
    });

    ['POST', 'PUT'].map(method => {
        describe(`.${method}()`, () => {
            it('does not `fetch`', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'));
                sut[method]();
                expect(fetchSpy).not.called;
            });

            it('creates a `LazyResource` instance', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'));
                const result = sut[method]();
                expect(result).to.be.instanceof(LazyResource);
            });

            it('supports passing a payload', async () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'));
                const result = await sut[method]('payload').run();

                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('url', { method, body: '"payload"' });
                expect(result).to.be.ok;
            });

            it('supports passing request info values', async () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'));
                const result = await sut[method](undefined, { mode: 'cors' }).run();

                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('url', { method, mode: 'cors' });
                expect(result).to.be.ok;
            });

            it('overwrites `method` property of request info', async () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'));
                const result = await sut[method](undefined, { method: 'POST' }).run();

                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('url', {method});
                expect(result).to.be.ok;
            });
        });
    });
});

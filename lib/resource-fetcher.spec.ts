import * as sinon from "sinon";
import { expect } from "chai";

import { ResourceFetcher } from "./resource-fetcher";
import { LazyResource } from "./lazy-resource";

describe('Resource Fetcher', () => {
    const expectedResource = 'any resource';
    let fetchSpy: sinon.SinonSpy;

    beforeEach('init `fetch` spy', () => {
        const fetchPromise = Promise.resolve({ json: () => expectedResource });
        fetchSpy = sinon.spy(() => fetchPromise);
    });

    it('does not `fetch` on creation', () => {
        const sut = new ResourceFetcher(() => Promise.resolve('url'), fetchSpy);
        expect(fetchSpy).not.called;
    });

    ['GET', 'POST', 'PUT', 'DELETE'].map(method => {
        describe(`.${method}()`, () => {
            it('does not `fetch`', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'), fetchSpy);
                sut[method]();
                expect(fetchSpy).not.called;
            });

            it('creates a `LazyResource` instance', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'), fetchSpy);
                const result = sut[method]();
                expect(result).to.be.instanceof(LazyResource);
            });

            it('supports passing request info values', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'), fetchSpy);
                const result = sut[method]({ body: 'body' }).run();

                return result.then(res => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('url', { method, body: 'body' });
                });
            });

            it('overwrites `method` property of request info', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'), fetchSpy);
                const result = sut[method]({ method: 'POST' }).run();

                return result.then(res => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('url', {method});
                });
            });
        });
    });
});

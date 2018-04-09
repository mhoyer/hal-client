import * as sinon from 'sinon';
import { expect } from 'chai';

import { ResourceFetcher } from './resource-fetcher';
import { LazyResource } from './lazy-resource';

describe('Resource Fetcher', () => {
    const expectedResource = 'any resource';
    let fetchSpy: sinon.SinonSpy;

    beforeEach('init `fetch` spy', () => {
        const fetchPromise = Promise.resolve({ json: () => expectedResource });
        fetchSpy = sinon.spy(() => fetchPromise);
    });

    it('does not `fetch` on creation', () => {
        new ResourceFetcher(() => Promise.resolve('url'), fetchSpy);
        expect(fetchSpy).not.called;
    });

    ['GET', 'DELETE'].map(method => {
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
                    expect(res).to.be.ok;
                });
            });

            it('overwrites `method` property of request info', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'), fetchSpy);
                const result = sut[method]({ method: 'POST' }).run();

                return result.then(res => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('url', {method});
                    expect(res).to.be.ok;
                });
            });
        });
    });

    ['POST', 'PUT'].map(method => {
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

            it('supports passing a payload', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'), fetchSpy);
                const result = sut[method]('payload').run();

                return result.then(res => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('url', { method, body: '"payload"' });
                    expect(res).to.be.ok;
                });
            });

            it('supports passing request info values', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'), fetchSpy);
                const result = sut[method](undefined, { mode: 'cors' } as RequestInit).run();

                return result.then(res => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('url', { method, mode: 'cors' });
                    expect(res).to.be.ok;
                });
            });

            it('overwrites `method` property of request info', () => {
                const sut = new ResourceFetcher(() => Promise.resolve('url'), fetchSpy);
                const result = sut[method](undefined, { method: 'POST' }).run();

                return result.then(res => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('url', {method});
                    expect(res).to.be.ok;
                });
            });
        });
    });
});

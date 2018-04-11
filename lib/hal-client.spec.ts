import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as chai from 'chai';

import { HalClient } from './hal-client';
import { LazyResource } from './lazy-resource';
import { ResourceFetcher } from './resource-fetcher';

const { expect } = chai;
chai.use(sinonChai);

describe('HAL Client', () => {
    const expectedResource = {
        _links: {
            foo: [
                { href: 'http://api/foo' },
                { href: 'http://api/{x}', templated: true }
            ],
            bar: { href: 'http://api/bar' }
        }
    };
    let fetchSpy: sinon.SinonSpy;

    beforeEach('init with `fetch` spy', () => {
        const fetchPromise = Promise.resolve({ json: () => expectedResource });
        fetchSpy = sinon.spy(() => fetchPromise);
        HalClient.fetchFn = fetchSpy;
    });

    describe(`startAt('http://...')`, () => {
        it('does not `fetch`', () => {
            HalClient.startAt('http://api/');
            expect(fetchSpy).not.called;
        });

        it('creates a `ResourceFetcher` instance', () => {
            const result = HalClient.startAt('http://api/');
            expect(result).to.be.instanceof(ResourceFetcher);
        });

        describe('Integrational tests', () => {
            it('supports direct run', () => {
                const result = HalClient.startAt('http://api/').GET().run();

                return result.then(res => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('http://api/', {method: 'GET'});
                    expect(res).to.equal(expectedResource);
                });
            });

            it('supports late separated runs', async () => {
                const lazyRootRes = HalClient.startAt('http://api/').GET();
                const fooRes = await lazyRootRes.follow('foo').GET<any>().run();
                const barRes = await lazyRootRes.follow('bar').GET<any>().run();

                expect(fetchSpy).callCount(4);
                expect(fetchSpy.getCall(0)).calledWith('http://api/');
                expect(fetchSpy.getCall(1)).calledWith('http://api/foo');
                expect(fetchSpy.getCall(2)).calledWith('http://api/');
                expect(fetchSpy.getCall(3)).calledWith('http://api/bar');

                expect(fooRes).to.equal(expectedResource);
                expect(barRes).to.equal(expectedResource);
            });

            it('supports following link rels', () => {
                const result = HalClient.startAt('http://api/').GET()
                    .follow('foo', {x: 42}, 1).GET()
                    .run();

                return result.then(res => {
                    expect(fetchSpy).calledTwice;
                    expect(fetchSpy.getCall(0)).calledWith('http://api/');
                    expect(fetchSpy.getCall(1)).calledWith('http://api/42');

                    expect(res).to.equal(expectedResource);
                });
            });

            it('supports following multiple link rels', () => {
                const result = HalClient.startAt('http://api/').GET()
                    .follow('foo', {x: 42}, 1).GET()
                    .follow('foo', {x: 23}, 1).GET()
                    .run();

                return result.then(res => {
                    expect(fetchSpy).calledThrice;
                    expect(fetchSpy.getCall(0)).calledWith('http://api/');
                    expect(fetchSpy.getCall(1)).calledWith('http://api/42');
                    expect(fetchSpy.getCall(2)).calledWith('http://api/23');

                    expect(res).to.equal(expectedResource);
                });
            });

            it('rejects in case a link rel was not found earlier', () => {
                const result = HalClient.startAt('http://api/').GET()
                    .follow('not-existing').GET()
                    .follow('foo').GET()
                    .run();

                return result.catch((err: Error) => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('http://api/');

                    expect(err.message).to.equal(
                        `Unable to find link relation 'not-existing':\n` +
                        `  - GET http://api/ => follow 'not-existing' => ✘`);
                });
            });

            it('rejects in case a link rel was not found later', () => {
                const result = HalClient.startAt('http://api/').GET()
                    .follow('foo').GET()
                    .follow('not-existing').GET()
                    .run();

                return result.catch((err: Error) => {
                    expect(fetchSpy).calledTwice;
                    expect(fetchSpy).calledWith('http://api/');

                    expect(err.message).to.equal(
                        `Unable to find link relation 'not-existing':\n` +
                        `  - GET http://api/ => follow 'foo'\n` +
                        `  - GET http://api/foo => follow 'not-existing' => ✘`);
                });
            });

            it('rejects in case `fetch` failed', () => {
                const rejectingFetchPromise = Promise.reject(new Error('Failed to fetch'));
                HalClient.fetchFn = sinon.spy(() => rejectingFetchPromise);

                const result = HalClient.startAt('http://api/').GET().run();

                return result.catch((err: Error) => {
                    expect(err.message).to.equal(
                        `Failed to fetch:\n` +
                        `  - GET http://api/ => ✘`);
                });
            });

            it('resolves even if `fetch` returns with status >= 400', () => {
                const httpErrorFetchPromise = Promise.resolve({
                    status: 401,
                    statusText: 'Unauthorized',
                    json: () => Promise.resolve(expectedResource)
                });
                HalClient.fetchFn = sinon.spy(() => httpErrorFetchPromise);

                const result = HalClient.startAt('http://api/').GET().run();

                return result.then(res => {
                    expect(res).to.equal(expectedResource);
                });
            });

            it('supports default values using `.catch` in case of a rejection', () => {
                const result = HalClient.startAt('http://api/').GET()
                    .follow('foo').GET()
                    .follow('not-existing').GET()
                    .run()
                    .catch(() => 'default');

                return result.then((res) => {
                    expect(fetchSpy).calledTwice;
                    expect(fetchSpy).calledWith('http://api/');

                    expect(res).to.equal('default');
                });
            });
        });
    });

    describe(`fromHalRes()`, () => {
        it('does not `fetch`', () => {
            HalClient.fromHalRes(expectedResource);
            expect(fetchSpy).not.called;
        });

        it('creates a `StaticResource` instance', () => {
            const result = HalClient.fromHalRes(expectedResource);
            expect(result).to.be.instanceof(LazyResource);
        });

        describe('Integrational tests', () => {
            it('does not `fetch` even when instantly `.run()`', () => {
                const result = HalClient.fromHalRes(expectedResource).run();

                return result.then(res => {
                    expect(fetchSpy).not.called;
                    expect(res).to.equal(expectedResource);
                });
            });

            it('supports following link rels', () => {
                const result = HalClient.fromHalRes(expectedResource)
                    .follow('foo').GET()
                    .run();

                return result.then(res => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('http://api/foo');

                    expect(res).to.equal(expectedResource);
                });
            });
        });
    });
});

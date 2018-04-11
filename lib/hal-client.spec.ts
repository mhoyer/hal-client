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
                { href: 'http://example.com/foo' },
                { href: 'http://example.com/{x}', templated: true }
            ],
            bar: { href: 'http://example.com/bar' }
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
            HalClient.startAt('url');
            expect(fetchSpy).not.called;
        });

        it('creates a `ResourceFetcher` instance', () => {
            const result = HalClient.startAt('url');
            expect(result).to.be.instanceof(ResourceFetcher);
        });

        describe('Integrational tests', () => {
            it('supports direct run', () => {
                const result = HalClient.startAt('url').GET().run();

                return result.then(res => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('url', {method: 'GET'});
                    expect(res).to.equal(expectedResource);
                });
            });

            it('supports late separated runs', async () => {
                const lazyRootRes = HalClient.startAt('url').GET();
                const fooRes = await lazyRootRes.follow('foo').GET<any>().run();
                const barRes = await lazyRootRes.follow('bar').GET<any>().run();

                expect(fetchSpy).callCount(4);
                expect(fetchSpy.getCall(0)).calledWith('url');
                expect(fetchSpy.getCall(1)).calledWith('http://example.com/foo');
                expect(fetchSpy.getCall(2)).calledWith('url');
                expect(fetchSpy.getCall(3)).calledWith('http://example.com/bar');

                expect(fooRes).to.equal(expectedResource);
                expect(barRes).to.equal(expectedResource);
            });

            it('supports following link rels', () => {
                const result = HalClient.startAt('url').GET()
                    .follow('foo', {x: 12}, 1).GET()
                    .run();

                return result.then(res => {
                    expect(fetchSpy).calledTwice;
                    expect(fetchSpy).calledWith('url');
                    expect(fetchSpy).calledWith('http://example.com/12');

                    expect(res).to.equal(expectedResource);
                });
            });

            it('rejects in case a link rel was not found earlier', () => {
                const result = HalClient.startAt('url').GET()
                    .follow('not-existing').GET()
                    .follow('foo').GET()
                    .run();

                return result.catch((err: Error) => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('url');

                    expect(err.message).to.equal(`Unable to find link relation 'not-existing'`);
                });
            });

            it('rejects in case a link rel was not found later', () => {
                const result = HalClient.startAt('url').GET()
                    .follow('foo').GET()
                    .follow('not-existing').GET()
                    .run();

                return result.catch((err: Error) => {
                    expect(fetchSpy).calledTwice;
                    expect(fetchSpy).calledWith('url');

                    expect(err.message).to.equal(`Unable to find link relation 'not-existing'`);
                });
            });

            it('supports default values using `.catch` in case of a rejection', () => {
                const result = HalClient.startAt('url').GET()
                    .follow('foo').GET()
                    .follow('not-existing').GET()
                    .run()
                    .catch(() => 'default');

                return result.then((res) => {
                    expect(fetchSpy).calledTwice;
                    expect(fetchSpy).calledWith('url');

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
                    expect(fetchSpy).calledWith('http://example.com/foo');

                    expect(res).to.equal(expectedResource);
                });
            });
        });
    });
});

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
        const fetchPromise = Promise.resolve({ json: () => Promise.resolve(expectedResource) });
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
            it('supports direct run', async () => {
                const result = await HalClient.startAt('http://api/').GET().run();

                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('http://api/', {method: 'GET'});
                expect(result).to.equal(expectedResource);
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

            it('supports following link rels', async () => {
                const result = await HalClient
                    .startAt('http://api/').GET()
                    .follow('foo', {x: 42}, 1).GET()
                    .run();

                expect(fetchSpy).calledTwice;
                expect(fetchSpy.getCall(0)).calledWith('http://api/');
                expect(fetchSpy.getCall(1)).calledWith('http://api/42');

                expect(result).to.equal(expectedResource);
            });

            it('supports following multiple link rels', async () => {
                const result = await HalClient
                    .startAt('http://api/').GET()
                    .follow('foo', {x: 42}, 1).GET()
                    .follow('foo', {x: 23}, 1).GET()
                    .run();

                expect(fetchSpy).calledThrice;
                expect(fetchSpy.getCall(0)).calledWith('http://api/');
                expect(fetchSpy.getCall(1)).calledWith('http://api/42');
                expect(fetchSpy.getCall(2)).calledWith('http://api/23');

                expect(result).to.equal(expectedResource);
            });

            it('rejects in case a link rel was not found earlier', async () => {
                const err = await HalClient
                    .startAt('http://api/').GET()
                    .follow('not-existing').GET()
                    .follow('foo').GET()
                    .run().catch(e => e);

                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('http://api/');
                expect(err.message).to.equal(
                    `Unable to find link relation 'not-existing':\n` +
                    `    | GET http://api/ => follow 'not-existing' => ✘`
                );
            });

            it('rejects in case a link rel was not found later', async () => {
                const err = await HalClient
                    .startAt('http://api/').GET()
                    .follow('foo').GET()
                    .follow('not-existing').GET()
                    .run().catch(e => e);

                expect(fetchSpy).calledTwice;
                expect(fetchSpy).calledWith('http://api/');

                expect(err.message).to.equal(
                    `Unable to find link relation 'not-existing':\n` +
                    `    | GET http://api/ => follow 'foo'\n` +
                    `    | GET http://api/foo => follow 'not-existing' => ✘`);
            });

            it('rejects in case a embedded key was not found earlier', async () => {
                const err = await HalClient
                    .startAt('http://api/').GET()
                    .embedded('not-existing')
                    .follow('foo').GET()
                    .run().catch(e => e);

                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('http://api/');
                expect(err.message).to.equal(
                    `Unable to find embedded resource 'not-existing':\n` +
                    `    | GET http://api/ => embedded 'not-existing' => ✘`
                );
            });

            it('rejects in case a embedded key was not found later', async () => {
                const err = await HalClient
                    .startAt('http://api/').GET()
                    .follow('foo').GET()
                    .embedded('not-existing')
                    .run().catch(e => e);

                expect(fetchSpy).calledTwice;
                expect(fetchSpy).calledWith('http://api/');

                expect(err.message).to.equal(
                    `Unable to find embedded resource 'not-existing':\n` +
                    `    | GET http://api/ => follow 'foo'\n` +
                    `    | GET http://api/foo => embedded 'not-existing' => ✘`);
            });

            it('rejects in case `fetch` failed', async () => {
                const rejectingFetchPromise = Promise.reject(new Error('Failed to fetch'));
                HalClient.fetchFn = sinon.spy(() => rejectingFetchPromise);

                const err = await HalClient
                    .startAt('http://api/').GET()
                    .run().catch(e => e);

                expect(err.message).to.equal(
                    `Failed to fetch:\n` +
                    `    | GET http://api/ => ✘`);
            });

            it('resets fetch-follow trace when .run failes after first successful run', async () => {
                const trail = HalClient.startAt('http://api/').GET();

                const firstRes = await trail
                    .follow('foo').GET()
                    .run().catch(e => e);
                const secondErr = await trail
                    .follow('second-not-existing').GET()
                    .run().catch(e => e);

                expect(fetchSpy).calledThrice;
                expect(fetchSpy.getCall(0)).calledWith('http://api/');
                expect(fetchSpy.getCall(1)).calledWith('http://api/foo');
                expect(fetchSpy.getCall(2)).calledWith('http://api/');

                expect(firstRes).to.equal(expectedResource);

                expect(secondErr.message).to.equal(
                    `Unable to find link relation 'second-not-existing':\n` +
                    `    | GET http://api/ => follow 'second-not-existing' => ✘`);
            });

            it('resets fetch-follow trace when .run completed two times with error', async () => {
                const trail = HalClient.startAt('http://api/').GET();

                const firstErr = await trail
                    .follow('first-not-existing').GET()
                    .run().catch(e => e);
                const secondErr = await trail
                    .follow('second-not-existing').GET()
                    .run().catch(e => e);

                expect(fetchSpy).calledTwice;
                expect(fetchSpy.getCall(0)).calledWith('http://api/');
                expect(fetchSpy.getCall(1)).calledWith('http://api/');

                expect(firstErr.message).to.equal(
                    `Unable to find link relation 'first-not-existing':\n` +
                    `    | GET http://api/ => follow 'first-not-existing' => ✘`);

                expect(secondErr.message).to.equal(
                    `Unable to find link relation 'second-not-existing':\n` +
                    `    | GET http://api/ => follow 'second-not-existing' => ✘`);
            });

            it('resolves even if `fetch` returns with status >= 400', async () => {
                const httpErrorFetchPromise = Promise.resolve({
                    status: 401,
                    statusText: 'Unauthorized',
                    json: () => Promise.resolve(expectedResource)
                });
                HalClient.fetchFn = sinon.spy(() => httpErrorFetchPromise);

                const result = await HalClient.startAt('http://api/').GET().run();

                expect(result).to.equal(expectedResource);
            });

            it('supports default values using `.catch` in case of a rejection', async () => {
                const result = await HalClient.startAt('http://api/').GET()
                    .follow('foo').GET()
                    .follow('not-existing').GET()
                    .run()
                    .catch(() => 'default');

                expect(fetchSpy).calledTwice;
                expect(fetchSpy).calledWith('http://api/');

                expect(result).to.equal('default');
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
            it('does not `fetch` even when instantly `.run()`', async () => {
                const result = await HalClient.fromHalRes(expectedResource).run();

                expect(fetchSpy).not.called;
                expect(result).to.equal(expectedResource);
            });

            it('supports following link rels', async () => {
                const result = await HalClient
                    .fromHalRes(expectedResource)
                    .follow('foo').GET()
                    .run();

                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('http://api/foo');

                expect(result).to.equal(expectedResource);
            });
        });
    });
});

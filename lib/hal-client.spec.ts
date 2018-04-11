import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as chai from 'chai';

import { HalClient } from './hal-client';
import { ResourceFetcher } from './resource-fetcher';
import { StaticResource } from './static-resource';

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
                const result = HalClient.startAt('url').GET<string>().run();

                return result.then(res => {
                    expect(fetchSpy).calledOnce;
                    expect(fetchSpy).calledWith('url', {method: 'GET'});
                    expect(res).to.equal(expectedResource);
                });
            });

            it('supports late separated runs', async () => {
                const lazyRootRes = HalClient.startAt('url').GET<string>();
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
                const result = HalClient.startAt('url').GET<string>()
                    .follow('foo', {x: 12}, 1).GET()
                    .run();

                return result.then(res => {
                    expect(fetchSpy).calledTwice;
                    expect(fetchSpy).calledWith('url');
                    expect(fetchSpy).calledWith('http://example.com/12');

                    expect(res).to.equal(expectedResource);
                });
            });
        });
    });

    describe(`fromHalRes()`, () => {
        it('does not `fetch`', () => {
            HalClient.fromHalRes({});
            expect(fetchSpy).not.called;
        });

        it('creates a `StaticResource` instance', () => {
            const result = HalClient.fromHalRes({});
            expect(result).to.be.instanceof(StaticResource);
        });

        describe('Integrational tests', () => {
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

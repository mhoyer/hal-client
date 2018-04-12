import { expect } from 'chai';
import * as sinon from 'sinon';

import { HalClient } from './hal-client';
import { HalResource } from './hal-resource';
import { LazyResource } from './lazy-resource';
import { ResourceFetcher } from './resource-fetcher';

describe('Lazy Resource', () => {
    const expectedResource: HalResource = {
        _links: {
            foo: [
                { href: 'http://example.com/foo' },
                { href: 'http://example.com/{x}', templated: true }
            ],
            bar: { href: 'http://example.com/bar' }
        },
        _embedded: {
            emb: [{
                _links: {
                    parent: { href: 'http://example.com/' }
                }
            }]
        }
    };
    let fetchSpy: sinon.SinonSpy;

    beforeEach('init `fetch` spy', () => {
        const fetchPromise = Promise.resolve({ json: () => Promise.resolve(expectedResource) });
        fetchSpy = sinon.spy(() => fetchPromise);
        HalClient.fetchFn = fetchSpy;
    });

    describe(`.run()`, () => {
        it('does not call `fetch` if no ResourceFetcher is involved', () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));
            const result = sut.run();

            return result.then(res => {
                expect(fetchSpy).not.been.called;
                expect(res).to.equal(expectedResource);
            });
        });

        it('supports late separated runs', async () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));

            const fooRes = await sut.follow('foo').GET<any>().run();
            const barRes = await sut.follow('bar').GET<any>().run();

            expect(fetchSpy).calledTwice;
            expect(fetchSpy.getCall(0)).calledWith('http://example.com/foo');
            expect(fetchSpy.getCall(1)).calledWith('http://example.com/bar');

            expect(fooRes).to.equal(expectedResource);
            expect(barRes).to.equal(expectedResource);
        });
    });

    describe(`.follow()`, () => {
        it('does not `fetch`', () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));
            sut.follow('foo');
            expect(fetchSpy).not.called;
        });

        it('creates a `ResourceFetcher` instance', () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));
            const result = sut.follow('foo');
            expect(result).to.be.instanceof(ResourceFetcher);
        });

        it('invokes `fetch` only once when running', () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));
            const result = sut.follow('foo').GET().run();

            return result.then(res => {
                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('http://example.com/foo');

                expect(res).to.equal(expectedResource);
            });
        });

        it('supports URI templates and link index selection', () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));
            const result = sut
                .follow('foo', {x: 12}, 1).GET()
                .run();

            return result.then(res => {
                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('http://example.com/12');

                expect(res).to.equal(expectedResource);
            });
        });
    });

    describe(`.embedded()`, () => {
        it('does not `fetch`', () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));
            sut.embedded('emb');
            expect(fetchSpy).not.called;
        });

        it('creates a `LazyResource` instance', () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));
            const result = sut.embedded('emb');
            expect(result).to.be.instanceof(LazyResource);
        });

        it('does not `fetch` also when running', () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));
            const result = sut.embedded('emb').run();

            return result.then(res => {
                expect(fetchSpy).not.called;
                expect(res).to.equal(expectedResource._embedded.emb[0]);
            });
        });

        it('invokes `fetch` once when following before', () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));
            const result = sut.follow('foo').GET().embedded('emb').run();

            return result.then(res => {
                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('http://example.com/foo');
                expect(res).to.equal(expectedResource._embedded.emb[0]);
            });
        });

        it('invokes `fetch` once when following afterwards', () => {
            const sut = new LazyResource(() => Promise.resolve(expectedResource));
            const result = sut.embedded('emb').follow('parent').GET().run();

            return result.then(res => {
                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('http://example.com/');
                expect(res).to.equal(expectedResource);
            });
        });
    });
});

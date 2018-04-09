import { expect } from 'chai';
import * as sinon from 'sinon';
import { LazyResource } from './lazy-resource';
import { ResourceFetcher } from './resource-fetcher';

describe('Lazy Resource', () => {
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

    beforeEach('init `fetch` spy', () => {
        const fetchPromise = Promise.resolve({ json: () => expectedResource });
        fetchSpy = sinon.spy(() => fetchPromise);
    });

    describe(`.run()`, () => {
        it('calls `fetch`', () => {
            const sut = new LazyResource(() => Promise.resolve({ url: 'url', ri: {}}), fetchSpy);
            const result = sut.run();

            return result.then(res => {
                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('url');
                expect(res).to.equal(expectedResource);
            });
        });

        it('supports late separated runs', async () => {
            const sut = new LazyResource(() => Promise.resolve({ url: 'url', ri: {}}), fetchSpy);

            const fooRes = await sut.follow('foo').GET<any>().run();
            const barRes = await sut.follow('bar').GET<any>().run();

            expect(fetchSpy).callCount(4);
            expect(fetchSpy.getCall(0)).calledWith('url');
            expect(fetchSpy.getCall(1)).calledWith('http://example.com/foo');
            expect(fetchSpy.getCall(2)).calledWith('url');
            expect(fetchSpy.getCall(3)).calledWith('http://example.com/bar');

            expect(fooRes).to.equal(expectedResource);
            expect(barRes).to.equal(expectedResource);
        });
    });

    describe(`.follow()`, () => {

        it('does not `fetch`', () => {
            const sut = new LazyResource(() => Promise.resolve({ url: 'url', ri: {}}), fetchSpy);
            sut.follow('foo');
            expect(fetchSpy).not.called;
        });

        it('creates a `ResourceFetcher` instance', () => {
            const sut = new LazyResource(() => Promise.resolve({ url: 'url', ri: {}}), fetchSpy);
            const result = sut.follow('foo');
            expect(result).to.be.instanceof(ResourceFetcher);
        });

        it('invokes `fetch` twice when running', () => {
            const sut = new LazyResource(() => Promise.resolve({ url: 'url', ri: {}}), fetchSpy);
            const result = sut.follow('foo').GET().run();

            return result.then(res => {
                expect(fetchSpy).calledTwice;
                expect(fetchSpy).calledWith('url');
                expect(fetchSpy).calledWith('http://example.com/foo');

                expect(res).to.equal(expectedResource);
            });
        });

        it('supports URI templates and link index selection', () => {
            const sut = new LazyResource(() => Promise.resolve({ url: 'url', ri: {}}), fetchSpy);
            const result = sut
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

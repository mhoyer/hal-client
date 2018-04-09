import { expect } from 'chai';
import * as sinon from 'sinon';

import { LazyResource } from './lazy-resource';
import { ResourceFetcher } from './resource-fetcher';
import { StaticResource } from './static-resource';

describe('Static Resource', () => {
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

    describe(`.follow()`, () => {

        it('does not `fetch`', () => {
            const sut = new StaticResource(expectedResource, fetchSpy);
            const result = sut.follow('foo');
            expect(fetchSpy).not.called;
        });

        it('creates a `ResourceFetcher` instance', () => {
            const sut = new StaticResource(expectedResource, fetchSpy);
            const result = sut.follow('foo');
            expect(result).to.be.instanceof(ResourceFetcher);
        });

        it('invokes `fetch` twice when running', () => {
            const sut = new StaticResource(expectedResource, fetchSpy);
            const result = sut.follow('foo').GET().run();

            return result.then(res => {
                expect(fetchSpy).calledOnce;
                expect(fetchSpy).calledWith('http://example.com/foo');

                expect(res).to.equal(expectedResource);
            });
        });

        it('supports URI templates and link index selection', () => {
            const sut = new StaticResource(expectedResource, fetchSpy);
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
});

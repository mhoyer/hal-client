import { HalResource } from './hal-resource';
import { expect } from 'chai';

describe('HalResource', () => {
    describe('findLink', () => {
        it('returns link', () => {
            const expectedLink = { href: 'foo' };
            const sampleHalResource: HalResource = {
                _links: {
                    foo: expectedLink
                }
            };

            const link = HalResource.findLink(sampleHalResource, 'foo');
            expect(link).to.equal(expectedLink);
        });

        it('returns first link in case of LinkArray', () => {
            const expectedLink = { href: 'foo' };
            const sampleHalResource: HalResource = {
                _links: {
                    foo: [
                        expectedLink,
                        { href: 'bar' },
                    ]
                }
            };

            const link = HalResource.findLink(sampleHalResource, 'foo');
            expect(link).to.equal(expectedLink);
        });

        it('supports index based find LinkArray', () => {
            const expectedLink = { href: 'foo' };
            const sampleHalResource: HalResource = {
                _links: {
                    foo: [
                        { href: 'bar' },
                        expectedLink,
                    ]
                }
            };

            const link = HalResource.findLink(sampleHalResource, 'foo', 1);
            expect(link).to.equal(expectedLink);
        });

        it('returns `undefined` if no link found', () => {
            const sampleHalResource: HalResource = {
                _links: {}
            };

            const link = HalResource.findLink(sampleHalResource, 'foo');
            expect(link).to.be.undefined;
        });

        it('returns `undefined` if HAL resource has no `_links` property at all', () => {
            const sampleHalResource: HalResource = {};
            const link = HalResource.findLink(sampleHalResource, 'foo');
            expect(link).to.be.undefined;
        });
    });
});

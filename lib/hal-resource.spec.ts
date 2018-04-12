import { expect } from 'chai';

import { HalResource } from './hal-resource';

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

    describe('findEmbedded', () => {
        it('returns embedded', () => {
            const sampleHalResource: HalResource = {
                _embedded: {
                    foo: 'expected-value'
                }
            };

            const embedded = HalResource.findEmbedded(sampleHalResource, 'foo');
            expect(embedded).to.equal('expected-value');
        });

        it('returns first embedded in case of EmbeddedArray', () => {
            const sampleHalResource: HalResource = {
                _embedded: {
                    foo: [
                        'expected-value',
                        'expected-second-value'
                    ]
                }
            };

            const embedded = HalResource.findEmbedded(sampleHalResource, 'foo');
            expect(embedded).to.equal('expected-value');
        });

        it('supports index based find EmbeddedArray', () => {
            const sampleHalResource: HalResource = {
                _embedded: {
                    foo: [
                        'expected-value',
                        'expected-second-value'
                    ]
                }
            };

            const embedded = HalResource.findEmbedded(sampleHalResource, 'foo', 1);
            expect(embedded).to.equal('expected-second-value');
        });

        it('returns `undefined` if no embedded resource found by key', () => {
            const sampleHalResource: HalResource = {
                _embedded: {}
            };

            const embedded = HalResource.findEmbedded(sampleHalResource, 'foo');
            expect(embedded).to.be.undefined;
        });

        it('returns `undefined` if HAL resource has no `_embedded` property at all', () => {
            const sampleHalResource: HalResource = {};
            const embedded = HalResource.findEmbedded(sampleHalResource, 'foo');
            expect(embedded).to.be.undefined;
        });
    });
});

import { HalResource } from "./hal-resource";
import { expect } from "chai";

describe('HalResource', () => {
    describe('findLinkHref', () => {
        it('returns href if not templated', () => {
            const expectedLink = { href: 'foo' };
            const sampleHalResource: HalResource = {
                _links: {
                    foo: expectedLink
                }
            };

            const href = HalResource.findLink(sampleHalResource, 'foo');
            expect(href).to.equal(expectedLink);
        });
    });
});

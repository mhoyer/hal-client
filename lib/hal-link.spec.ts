import { HalLink } from "./hal-link";
import { expect } from "chai";

describe('HalLink', () => {
    describe('applyTemplateParams', () => {
        it('returns original href if not templated', () => {
            const href = HalLink.applyTemplateParams({href: 'origin{?x}', templated: false});
            expect(href).to.equal('origin{?x}');
        });

        it('returns href with replaced template params', () => {
            const href = HalLink.applyTemplateParams(
                { href: 'origin{?x}', templated: true },
                { x: 'foo' }
            );
            expect(href).to.equal('origin?x=foo');
        });
    });
});

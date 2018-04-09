import { HalLink } from './hal-link';

export class HalResource {
    _links?: {
        [key: string]: HalLink | HalLink[]
    };
    _embedded?: {
        [key: string]: any;
    };

    static findLink(res: HalResource, relName: string, relIndex = 0): HalLink {
        if (!(relName in res._links)) {
            throw new Error(`Relation "${relName}" not found in resource.`);
        }

        const links = [].concat(res._links[relName]) as HalLink[];
        return links[relIndex];
    }
}

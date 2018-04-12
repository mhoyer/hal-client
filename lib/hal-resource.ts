import { HalLink } from './hal-link';

export class HalResource {
    _links?: {
        [key: string]: HalLink | HalLink[]
    };
    _embedded?: {
        [key: string]: any;
    };

    static findEmbedded(res: HalResource, key: string, index = 0): HalResource {
        if (!res._embedded) return;
        if (!(key in res._embedded)) return;

        const embeddeds = [].concat(res._embedded[key]) as HalResource[];
        return embeddeds[index];
    }

    static findLink(res: HalResource, relName: string, relIndex = 0): HalLink {
        if (!res._links) return;
        if (!(relName in res._links)) return;

        const links = [].concat(res._links[relName]) as HalLink[];
        return links[relIndex];
    }
}

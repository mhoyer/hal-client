import { HalClient } from './hal-client';
import { HalResource } from './hal-resource';
import { HalLink } from './hal-link';
import { ResourceFetcher } from './resource-fetcher';

export class StaticResource {
    constructor(private halResource: HalResource) {
    }

    follow(rel: string, templateParams = {}, relIndex = 0): ResourceFetcher {
        const link = HalResource.findLink(this.halResource, rel, relIndex);
        const url =  HalLink.applyTemplateParams(link, templateParams);
        return HalClient.startAt(url);
    }
}

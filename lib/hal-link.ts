import { parse } from 'url-template';

export class HalLink {
    href: string;
    templated?: boolean;
    name?: string;
    title?: string;

    static applyTemplateParams(link: HalLink, templateParams = {}) {
        if(!link.templated) return link.href;

        return parse(link.href).expand(templateParams);
    }
}

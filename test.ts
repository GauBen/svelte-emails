import mjml2html from 'mjml';
import type { SvelteComponentTyped } from 'svelte';
import { HelloWorld } from './package/index.js';

export const render = <T extends SvelteComponentTyped<any, any, any>>(
  component: new (...args: any[]) => T,
  props: T extends SvelteComponentTyped<infer U, any, any> ? U : never
) => {
  // @ts-expect-error SSR components have a `render` method
  const { html: mjml } = component.render(props);
  const { html } = mjml2html(mjml);
  return html;
};

console.log(
  render(HelloWorld, {
    name: 'world',
    buttons: [
      { label: 'Discord', color: '#5662f6' },
      { label: 'LinkedIn', color: '#0a66c2' },
      { label: 'GitHub', color: '#333' },
    ],
  })
);

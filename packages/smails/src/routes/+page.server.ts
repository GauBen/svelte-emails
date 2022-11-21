import type { PageServerLoad } from './$types';
import mjml2html from 'mjml';
import HelloWorld from '$lib/HelloWorld.svelte';

export const load: PageServerLoad = async () => {
  const { html: mjml } = HelloWorld.render({
    name: 'world',
    buttons: [
      { label: 'Discord', color: '#5662f6' },
      { label: 'LinkedIn', color: '#0a66c2' },
      { label: 'GitHub', color: '#333' },
    ],
  });
  const { html } = mjml2html(mjml);
  return { html };
};

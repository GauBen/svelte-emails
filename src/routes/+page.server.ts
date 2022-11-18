import type { PageServerLoad } from './$types';
import mjml2html from 'mjml';
import HelloWorld from '$lib/HelloWorld.svelte';

export const load: PageServerLoad = async () => {
  const { html: mjml } = HelloWorld.render({ name: 'world' });
  const { html } = mjml2html(mjml);
  return { html };
};

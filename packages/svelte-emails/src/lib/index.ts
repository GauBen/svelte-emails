import mjml2html from "mjml";
import type { Component } from "svelte";
import * as svelte from "svelte/server";

/**
 * Removes classes added to elements by the Svelte compiler because MJML does
 * not support them.
 */
const stripSvelteClasses = (html: string) =>
  html.replaceAll(/class="s-[\w-]+"/g, "");

/** Renders a Svelte component as email-ready HTML. */
export const render = <Props extends Record<string, any>>(
  component: Component<Props>,
  props: Props,
) => {
  // Render the component to MJML
  const { head, body } = svelte.render(component, { props });

  const mjml = `<mjml>
        <mj-head>
          ${stripSvelteClasses(head)}
        </mj-head>
        <mj-body>${stripSvelteClasses(body)}</mj-body>
      </mjml>`;

  // Render MJML to HTML
  const { html, errors } = mjml2html(mjml);
  if (errors.length > 0) console.warn(errors);

  return html;
};

import mjml2html from "mjml";
import type { Component } from "svelte";
import * as svelte from "svelte/server";

/** Renders a Svelte component as email-ready HTML. */
export const render = <Props extends Record<string, any>>(
  component: Component<Props>,
  props: Props,
) => {
  // Render the component to MJML
  const { head, body } = svelte.render(component, { props });

  const mjml = /* HTML */ `<mjml>
    <mj-head>${head}</mj-head>
    <mj-body>${body}</mj-body>
  </mjml>`;

  // Render MJML to HTML
  const { html, errors } = mjml2html(mjml);
  if (errors.length > 0) console.warn(errors);

  return html;
};

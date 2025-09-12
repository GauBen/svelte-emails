import mjml2html from "mjml";
import type { Component, ComponentProps } from "svelte";
import * as svelte from "svelte/server";

/** Renders a Svelte component as email-ready HTML. */
export const render = <T extends Component<any, any>>(
  component: T,
  props: ComponentProps<T>,
) => {
  // Render the component to MJML
  const { head, body } = svelte.render(component as never, { props });

  const mjml = /* HTML */ `<mjml>
    <mj-head>${head}</mj-head>
    <mj-body>${body}</mj-body>
  </mjml>`;

  // Render MJML to HTML
  const { html, errors } = mjml2html(mjml);
  if (errors.length > 0) console.warn(errors);

  return html;
};

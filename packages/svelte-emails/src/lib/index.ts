import mjml2html from "mjml";
import type { SvelteComponentTyped } from "svelte";
import type { create_ssr_component } from "svelte/internal";

/**
 * Removes classes added to elements by the Svelte compiler because MJML does
 * not support them.
 */
const stripSvelteClasses = (html: string) =>
  html.replaceAll(/class="s-[\w-]+"/g, "");

/** Renders a Svelte component as email-ready HTML. */
export const render = <Props extends Record<string, any>>(
  component: new (...args: any[]) => SvelteComponentTyped<Props>,
  props: Props
) => {
  const ssrComponent = component as unknown as ReturnType<
    typeof create_ssr_component
  >;

  // Render the component to MJML
  const { html: body, css, head } = ssrComponent.render(props);

  const mjml = `<mjml>
        <mj-head>
          ${stripSvelteClasses(head)}
          <mj-style>${css.code}</mj-style>
        </mj-head>
        <mj-body>${stripSvelteClasses(body)}</mj-body>
      </mjml>`;

  // Render MJML to HTML
  const { html, errors } = mjml2html(mjml);
  if (errors.length > 0) console.warn(errors);

  return html;
};

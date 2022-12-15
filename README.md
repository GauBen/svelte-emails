![Rendering emails with Svelte](https://raw.githubusercontent.com/GauBen/svelte-emails/main/docs/cover.png)

# Rendering emails with Svelte

**Emails are the cornerstone of automated internet communication.** Create an account on a website? Email. Receive an invoice? Email. Sign up for an event? Email. As a developer, you will need to send emails at some point. And you will end up working with some of the most legacy web technologies.

We, at Escape, recently **rebuilt our whole email stack from scratch to improve the developer experience:** we used to send emails to preview them, whereas now, **we have an instant feedback loop,** leveraging a [SvelteKit](https://kit.svelte.dev/)-powered dev server.

## Emails are written with 2003 HTML

If you started web development before 2000, chances are you worked on websites designed with `<table>`-based layouts. It was [_the_ way](https://thehistoryoftheweb.com/tables-layout-absurd/) to design complex two-dimensional layouts.

![<table> everywhere meme made with imgflip](https://i.imgflip.com/72vkka.jpg)

Well, unfortunately for us, email clients are still stuck in the dark ages. We, therefore, have four possibilities to write emails:

- **Write them by hand** and learn the quirks of the old `<table>`-based layout system with loads of `<!--[if mso]>` and inline styles. This is way too slow for a company, but there is a _lot_ to learn on the way. I might have picked this approach for a personal project.

- **Send plain text emails**, like good ol' text messages. Not possible for Escape, but you might consider it.

  > ![Plain text email example](https://www.emailonacid.com/images/blog_images/Emailology/2018/plain/second-example.png)
  > Source: [Email on Acid](https://www.emailonacid.com/blog/article/email-marketing/what-is-a-plain-text-email-and-when-should-i-use-one-2/)

- **Use a WYSIWYG email editor**. [There are a lot out there!](https://www.google.com/search?q=email+builder) Turns out emails are hard to design. It would work well for static emails with a few string interpolations, but not for dynamic emails with a lot of logic, which we need. Depending on what you want to achieve, this might be the best option.

  > ![Unlayer.com product demo](https://assets.website-files.com/5daaade3e3e3f0d01b1daa77/606589b25b7d42a3ee8151b1_UnlayerHeroAnimation.gif)
  > Source: [Unlayer.com](https://unlayer.com/)

- **Use an XML-based email templating language.** [There are plenty too!](https://www.emailonacid.com/blog/article/email-development/best-email-frameworks/) This is the path we took because it is the most flexible and powerful option.

  > ![MJML.io product demo](https://mjml.io/assets/img/index/screen.png)
  > Source: [MJML.io](https://mjml.io/)

Because we had some experience with [MJML](https://mjml.io/) we decided to stick with it. It is battle-tested, has a lot of features, and is easy to learn.

We now need a way to make these emails dynamic, with logic and string interpolation. The title probably ruined the surprise, but hey, **we chose Svelte**.

## MJML, Svelte, Vite, Square pegs and Round holes

Our challenge now is not only to write MJML with Svelte but also to have a simple way to preview and test emails. All the technologies we mentioned were never meant to work together, but there seemed to be a way.

Here is our plan:

1. We would write Svelte code with MJML elements:

   ```svelte
   <script lang="ts">
     export let name = "World";
   </script>

   <mj-section>
     <mj-column>
       <mj-text font-size="32px" color="#F45E43" font-family="helvetica">
         Hello {name}!
       </mj-text>
       <mj-divider border-color="#F45E43" />
     </mj-column>
   </mj-section>
   ```

2. We would compile the Svelte code to HTML using the compiler's [SSR capabilities](https://svelte.dev/docs#run-time-server-side-component-api):

   ```js
   const mail = (props) => `<mj-section>
     <mj-column>
       <mj-text font-size="32px" color="#F45E43" font-family="helvetica">
         Hello ${props.name}!
       </mj-text>
       <mj-divider border-color="#F45E43" />
     </mj-column>
   </mj-section>`;
   ```

3. We would feed this to the MJML compiler:

   ```js
   const document = (body) => `<mjml>
     <mj-head><!-- Other head properties --></mj-head>
     <mj-body>${body}</mj-body>
   </mjml>`;
   const html = mjml2html(document(mail({ name: "World" })));
   ```

4. We would send the resulting HTML:

   ```js
   let transporter = nodemailer.createTransport();

   await transporter.sendMail({
     from: "support@example.com",
     to: "client@example.com",
     subject: "Hello!",
     html,
   });
   ```

Apart from that, we also want:

- A way to preview the emails, and the easiest way to get live-reload in a Svelte project is to use [SvelteKit](https://kit.svelte.dev/).
- Compile-time type checking for props, which is made possible by [svelte2tsx](https://www.npmjs.com/package/svelte2tsx).

Our setup will be in two parts:

- Setting up a development server to create and preview emails.
- Setting up a build pipeline to compile emails to HTML strings.

## The dev server

[SvelteKit](https://kit.svelte.dev) offers a fantastic developer experience to work with Svelte and was just released as stable, so it is a no-brainer to use it.

You can clone the whole experiment [from GitHub](https://github.com/GauBen/svelte-emails). We will go through the most interesting parts in the rest of the article.

You will find a complete SvelteKit project in [`packages/svelte-emails`](https://github.com/GauBen/svelte-emails/tree/main/packages/svelte-emails):

- [`index.ts`](https://github.com/GauBen/svelte-emails/blob/main/packages/svelte-emails/src/index.ts): This is our library entry point.

  ```ts
  // Export the renderer
  export { render } from "./lib/index.js";

  // Also export compiled Svelte components
  export * from "./mails/index.js";
  ```

- `lib/`

  - [`Header.svelte`](https://github.com/GauBen/svelte-emails/blob/main/packages/svelte-emails/src/lib/Header.svelte): This is our common email header. MJML offers a [lot of components](https://documentation.mjml.io/#standard-body-components) out of the box.

    ```svelte
    <mj-section>
      <mj-column>
        <mj-text align="center" font-size="20px" font-family="Helvetica">
          <!-- Svelte slot here! -->
          <slot />
        </mj-text>
        <mj-divider border-color="#ff3e00" />
      </mj-column>
    </mj-section>
    ```

  - [`index.ts`](https://github.com/GauBen/svelte-emails/blob/main/packages/svelte-emails/src/lib/index.ts): It contains the MJML rendering logic.

    ```ts
    /** Renders a Svelte component as email-ready HTML. */
    export const render = <Props>(
      component: new (...args) => SvelteComponentTyped<Props>,
      props: Props
    ) => {
      // Render the component to MJML
      const { html: body, css, head } = component.render(props);

      const mjml = `<mjml>
        <mj-head>
          ${head}
          <mj-style>${css.code}</mj-style>
        </mj-head>
        <mj-body>${body}</mj-body>
      </mjml>`;

      // Render MJML to HTML
      const { html } = mjml2html(mjml);

      return html;
    };
    ```

- `mails/`: This is the root HTTP directory, and it will also contain our emails.

  - [`index.ts`](https://github.com/GauBen/svelte-emails/blob/main/packages/svelte-emails/src/mails/index.ts): This file reexports all the emails.

    ```ts
    export { default as HelloWorld } from "./hello-world/Mail.svelte";
    ```

  - `hello-world/`

    - [`Mail.svelte`](https://github.com/GauBen/svelte-emails/blob/main/packages/svelte-emails/src/mails/hello-world/Mail.svelte): Make a guess!

      ```svelte
      <script lang="ts">
        import Header from "$lib/Header.svelte";
        export let name: string;
      </script>

      <Header>Hello {name}!</Header>

      <mj-section>
        <mj-column>
          <mj-button
            color="#fff"
            background-color="#ff3e00"
            font-family="Helvetica"
            href="https://svelte.dev"
          >
            Learn Svelte
          </mj-button>
        </mj-column>
      </mj-section>
      ```

    - [`+page.server.ts`](https://github.com/GauBen/svelte-emails/blob/main/packages/svelte-emails/src/mails/hello-world/%2Bpage.server.ts) and [`+page.svelte`](https://github.com/GauBen/svelte-emails/blob/main/packages/svelte-emails/src/mails/hello-world/%2Bpage.svelte): These are our development email previews, powered by [Vite](https://vitejs.dev/).

      ```ts
      export const load = async () => ({
        email: render(Mail, {
          // This is type-checked!
          name: "World",
        }),
      });
      ```

That is quite a lot of code! Let's try it out:

```bash
# Start the dev server
yarn dev
```

Go to [localhost:5173/hello-world](http://localhost:5173/hello-world) to see the email preview, and edit anything to see it update in real-time.

![A screenshot of the resulting email, with a title and a button](https://raw.githubusercontent.com/GauBen/svelte-emails/main/docs/screenshot.png)

## The build pipeline

We now have a working development environment, but we need to build our emails for production. We will use [Rollup](https://rollupjs.org/) to bundle our emails, and [svelte2tsx](https://www.npmjs.com/package/svelte2tsx) to emit type declarations.

The [`rollup.config.js`](https://github.com/GauBen/svelte-emails/blob/main/packages/svelte-emails/rollup.config.js) file defines our build pipeline:

```js
export default {
  input: "src/mails/index.ts",
  plugins: [
    {
      /** Export component's types at the end of the build. */
      name: "rollup-plugin-svelte2dts",
      async buildEnd() {
        const require = createRequire(import.meta.url);

        // All the heavy lifting is done by svelte2tsx
        await emitDts({
          svelteShimsPath: require.resolve("svelte2tsx/svelte-shims.d.ts"),
          declarationDir: "build",
        });

        // We need to replace `.svelte` with `.svelte.js` for types to be resolved
        const index = "build/mails/index.d.ts";
        const code = await readFile(index, "utf-8");
        await writeFile(index, code.replaceAll(".svelte", ".svelte.js"));
      },
    },
    svelte({
      ...svelteConfig,
      compilerOptions: { generate: "ssr" },
      emitCss: false,
    }),
  ],
};
```

Run `yarn build` to transform the Svelte emails components into raw JavaScript.

## Wrapping up

Using our built emails in a NodeJS app is as simple as:

```ts
import { render, HelloWorld } from "svelte-emails";

const html = render(HelloWorld, {
  // This is type-checked!
  name: "World",
});
console.log(html);
```

There is a [demo](https://github.com/GauBen/svelte-emails/tree/main/packages/demo) package in the repo for you to try out.

---

This concludes this experiment. We are still tinkering with a few things to make it easier to use, but we hope you enjoyed this article. Feel free to ask questions or give feedback on how you are currently developing emails, we are eager to hear from you!

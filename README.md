# Writing emails with Svelte

**Emails are the cornerstone of automated internet communication.** Create an account on a website? Email. Receive an invoice? Email. Sign up for an event? Email. As a developer, you will need to send emails at some point. And you will end up working with some of the most legacy web technologies.

We, at Escape, recently **rebuilt our whole email stack from scratch to improve the developer experience** and make it easier to create emails. This article will detail how we did it.

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

Because we had some experience with [MJML](https://mjml.io/) we decided to stick with it. It's battle-tested, has a lot of features, and is easy to learn.

We now need a way to make these emails dynamic, with logic and string interpolation. The title probably ruined the surprise, but hey, **we chose Svelte**.

## MJML, Svelte, Vite, Square pegs and Round holes

Our challenge now is not only to write MJML with Svelte but also to have a simple way to preview and test emails. All the technologies we mentioned were never meant to work together, but there seemed to be a way.

Here is our plan:

1. We would write Svelte code with MJML elements:

   ```html
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
       <mj-text font-size="32px" color="#F45E43" font-family="helvetica">Hello ${props.name}!</mj-text>
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

If you want to have everything working by the end of this article, you can follow the steps below. Otherwise, you can skip to the next section.

If you don't have Node or Yarn on your machine, you can install them easily with [Volta](https://volta.sh/):

```bash
# Install the latest versions of Node and Yarn
volta install node@latest
volta install yarn@latest

# Create a new project
mkdir project && cd $_

# Setup a monorepo with Yarn 4
yarn init --private --workspace -2
yarn set version canary

# Enable the good ol' node_modules
echo 'nodeLinker: node-modules' >> .yarnrc.yml
echo 'node_modules/\nbuild/' >> .gitignore
```

We use Yarn 4 because it ships with a few tools to manage monorepos that we will use later.

Then, let's create a SvelteKit project:

```bash
cd packages
# Create a Svelte app in the `packages/svelte-emails` directory
# You will have a few choices prompted:
#  - Template: Library skeleton project
#  - Type checking: TypeScript
#  - Prettier, ESLint, etc.: Not needed, do as you wish
yarn create svelte@latest svelte-emails

# Install the dependencies
cd $_ && yarn install

# Add MJML too
yarn add mjml
```

We now have a whole SvelteKit project in `packages/svelte-emails`. Let's update the `svelte.config.ts` file for our needs:

```js
import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: preprocess(),
  kit: { files: { routes: "src/mails" } },
};
```

You can now `rm -rf src/routes` the previous routes and create or update a few files in `src/`:

- `index.ts`: This will be our library entry point.

  ```ts
  // Export the renderer
  export { render } from "./lib/index.js";
  // Also export compiled Svelte components
  export * from "./mails/index.js";
  ```

- `lib/`

  - `Header.svelte`: This will be our common email header. MJML offers a [lot of components](https://documentation.mjml.io/#standard-body-components) out of the box.

    ```html
    <mj-section>
      <mj-column>
        <mj-text align="center" font-size="20px" font-family="Helvetica">
          <slot />
        </mj-text>
        <mj-divider border-color="#ff3e00" />
      </mj-column>
    </mj-section>
    ```

  - `index.ts`: We will put the MJML rendering logic in it.

    ```ts
    import mjml2html from "mjml";
    import type { SvelteComponentTyped } from "svelte";
    import type { create_ssr_component } from "svelte/internal";

    /**
     * Removes classes added to elements by the Svelte compiler because MJML does
     * not support them.
     */
    const stripSvelteClasses = (html: string) =>
      html.replaceAll(/class="s-\w+"/g, "");

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
    ```

- `mails/`: This is the root HTTP directory, and it will also contain our emails.

  - `index.ts`: This file reexports all emails.

    ```ts
    export { default as HelloWorld } from "./hello-world/Mail.svelte";
    ```

  - `hello-world/`

    - `Mail.svelte`: Make a guess!

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

    - `+page.server.ts`: This is our development email preview, powered by [Vite](https://vitejs.dev/).

      ```ts
      import { render } from "$lib";
      import Mail from "./Mail.svelte";

      export const load = async () => ({
        email: render(Mail, {
          // This is type-checked!
          name: "World",
        }),
      });
      ```

    - `+page.svelte`: This too.

      ```html
      <script lang="ts">
        import type { PageData } from "./$types";
        export let data: PageData;
      </script>

      {@html data.email}
      ```

That is quite a lot of code! Let's try it out:

```bash
# Start the dev server
yarn dev
```

Go to [localhost:5173/hello-world](http://localhost:5173/hello-world) to see the email preview, and edit anything to see it update in real-time.

![A screenshot of the resulting email, with a title and a button](./screenshot.png)

## The build pipeline

We now have a working development environment, but we need to build our emails for production. We will use [Rollup](https://rollupjs.org/) to bundle our emails, and [svelte2tsx](https://www.npmjs.com/package/svelte2tsx) to emit type declarations.

```bash
# Install Rollup and its plugins
yarn add -D rollup @rollup/plugin-alias @rollup/plugin-node-resolve rollup-plugin-svelte svelte2tsx
```

Then create a `rollup.config.js` file with the following:

```js
import alias from "@rollup/plugin-alias";
import resolve from "@rollup/plugin-node-resolve";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { defineConfig } from "rollup";
import svelte from "rollup-plugin-svelte";
import { emitDts } from "svelte2tsx";
import svelteConfig from "./svelte.config.js";

export default defineConfig({
  input: "src/mails/index.ts",
  output: {
    file: "build/mails/index.js",
    format: "esm",
  },
  plugins: [
    {
      name: "rollup-plugin-svelte2dts",
      /** Export component's types at the end of the build. */
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
    resolve({ exportConditions: ["svelte"], extensions: [".svelte"] }),
    alias({ entries: [{ find: "$lib", replacement: "src/lib" }] }),
  ],
});
```

This will build our Svelte components but not the rest of the code: we will use `tsc` for that.

Create a `tsconfig.build.json` with the following:

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "build"
  },
  "files": ["src/index.ts"],
  "include": []
}
```

Finally, update your `package.json` with the following:

```jsonc
{
  "exports": {
    "types": "./build/index.d.ts",
    "import": "./build/index.js"
  },
  "scripts": {
    "build": "svelte-kit sync && tsc -p tsconfig.build.json && rollup -c"
  }
}
```

And `yarn build` your first email!

## Wrapping up

Let's see how to use our emails in a NodeJS app.

```bash
# We will create a demo package in `packages/demo`
cd ..
mkdir demo && cd $_

# Init a new TypeScript project
yarn init
sed -i '1s/.*/{"type":"module",/' package.json
yarn add -D typescript tsx svelte-emails
```

You will need a basic `tsconfig.json` too:

```jsonc
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "NodeNext",
    "strict": true
  }
}
```

Create an `index.ts` file in the same directory:

```ts
import { render, HelloWorld } from "svelte-emails";

const html = render(HelloWorld, {
  // This is type-checked!
  name: "World",
});
console.log(html);
```

And run it with `yarn tsx index.ts`!

---

This concludes this experiment. We are still tinkering with a few things to make it easier to use, but we hope you enjoyed this article. Feel free to ask questions or give feedback on how you are currently developing emails, we are eager to hear from you!

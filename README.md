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
    <mj-text font-size="32px" color="#F45E43" font-family="helvetica"
      >Hello {name}!</mj-text
    >
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

## The build pipeline

## Wrapping up

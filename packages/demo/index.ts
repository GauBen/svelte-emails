import { render, HelloWorld } from "svelte-emails";

const html = await render(HelloWorld, {
  // This is type-checked!
  name: "World",
});

console.log(html);

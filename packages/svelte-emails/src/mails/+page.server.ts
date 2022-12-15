import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  mails: Object.keys(import.meta.glob("./*/Mail.svelte")).map(
    (path) => path.slice(2, -12) // Trim `./` and `/Mail.svelte`
  ),
});

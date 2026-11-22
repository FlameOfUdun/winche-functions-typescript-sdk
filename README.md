# Winche functions TypeScript SDK (`@winche-technologies/winche-functions`)

Write Winche functions: triggers, callables, HTTP functions, schedules and console pages, with their secrets and
resources. Their data comes from [`@winche-technologies/winche-admin`](https://github.com/FlameOfUdun/winche-admin-typescript-sdk),
a peer dependency: the project pins both, by their npm names, in its deno.json.

```json
// deno.json in the functions folder
{
  "imports": {
    "@winche-technologies/winche-functions": "npm:@winche-technologies/winche-functions@^3",
    "@winche-technologies/winche-functions/testing": "npm:@winche-technologies/winche-functions@^3/testing",
    "@winche-technologies/winche-admin": "npm:@winche-technologies/winche-admin@^3"
  },
  "minimumDependencyAge": {
    "age": "P1D",
    "exclude": ["npm:@winche-technologies/winche-functions", "npm:@winche-technologies/winche-admin"]
  }
}
```

The exemption lets a new SDK version be used at once (Deno otherwise waits a day before installing a new npm version);
every other package keeps the wait.

```ts
import { callable, onDocument, schedule, secrets, HttpsError } from "@winche-technologies/winche-functions";
import { documents, FieldValue } from "@winche-technologies/winche-admin";

export const hello = callable(async (data: { name: string }, ctx) => {
  if (!ctx.caller) throw new HttpsError("unauthenticated", "Sign in first.");
  return { greeting: `Hello ${data.name}` };
});

export const onVisit = onDocument.created("patients/{patientId}/visits/{visitId}", async (e) => {
  await documents.doc(`patients/${e.params.patientId}`).update({ visits: FieldValue.increment(1) });
});

const reportKey = secrets.define("REPORT_KEY");
export const nightly = schedule("0 2 * * *", async () => {
  await fetch("https://example.com/report", { method: "POST", headers: { authorization: reportKey.value() } });
}, { secrets: [reportKey] });
```

`winche functions init` (the Winche CLI) writes that `deno.json`, and `winche functions deploy` sends the folder; the
server bundles it with the versions it names. The whole API is in Winche.Functions' README.

**Integrity:** `ctx.app` is the app that proved it's the project's own (`{ id, provider }`: App Attest, Play
Integrity, the browser check or a debug token), or null. A callable with `{ integrity: true }` answers only such apps
(others get `permission-denied`, reason `integrity-required`), whatever the project enforces; the project's own code
calls it as ever. It needs Winche Server 4: a server from before Integrity refuses to deploy it ("protocol 2") rather
than let anyone call it.

```ts
export const pay = callable(async (data: { amount: number }, ctx) => { /* ctx.app!.id */ }, { integrity: true });
```

**Plugins:** a package of functions projects install under ids of their own, with settings and secrets from its
`winche-plugin.json`, is a default export made with `plugin((p) => ({ … }))`: `p.id`, `p.setting(name)`,
`p.secret(name)` (each installed copy's own secret). Its functions are called `<id>.<name>`. Tests call
`thePlugin.install({ id, settings, secrets })` for a copy's functions. See Winche.Functions' README (Plugins).

**Tests:** `@winche-technologies/winche-functions/testing` runs a function's code without a server: `withSecrets`, `withResources`,
`withServer` (a stand-in or a real server for `@winche-technologies/winche-admin`), `testContext`.

**Protocol:** exported functions carry the protocol they were written for (`__winche: 1`, or `2` for a callable with
`{ integrity: true }`); a server that doesn't speak it refuses the deployment, saying which version to use.

## Changes

- **3.2.0:** `ctx.app` (the app that proved it's the project's own) and `{ integrity: true }` for callables (Winche
  Server 4). A callable with it is marked protocol 2, which servers from before Integrity refuse; everything else is
  unchanged and deploys anywhere 3.x does.

## Develop

`npm run build` (TypeScript) makes `dist/`; `npm test` builds and runs the Deno tests in `test/` against it. The
`@winche-technologies/winche-admin` it builds and tests against is the sibling repository (`../winche-admin-typescript-sdk`).

## License

MIT (`LICENSE`).

# Winche functions TypeScript SDK (`@winche-technologies/winche-functions`)

Write Winche functions: triggers, callables, HTTP functions, schedules and console pages, with their secrets and
resources. Their data comes from [`@winche-technologies/winche-admin`](https://github.com/FlameOfUdun/winche-admin-typescript-sdk),
a peer dependency: the project pins both. They're published as `@winche-technologies/…` and imported as `@winche/…`
(aliases in deno.json).

```json
// deno.json in the functions folder
{
  "imports": {
    "@winche/functions": "npm:@winche-technologies/winche-functions@^3",
    "@winche/functions/testing": "npm:@winche-technologies/winche-functions@^3/testing",
    "@winche/admin": "npm:@winche-technologies/winche-admin@^3"
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
import { callable, onDocument, schedule, secrets, HttpsError } from "@winche/functions";
import { documents, FieldValue } from "@winche/admin";

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

**Tests:** `@winche/functions/testing` runs a function's code without a server: `withSecrets`, `withResources`,
`withServer` (a stand-in or a real server for `@winche/admin`), `testContext`.

**Protocol:** exported functions carry the protocol they were written for (`__winche: 1`); a server that doesn't speak
it refuses the deployment, saying which version to use.

## Develop

`npm run build` (TypeScript) makes `dist/`; `npm test` builds and runs the Deno tests in `test/` against it. The
`@winche-technologies/winche-admin` it builds and tests against is the sibling repository (`../winche-admin-typescript-sdk`).

## License

MIT (`LICENSE`).

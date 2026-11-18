import { callable, secrets, resources } from "@winche-technologies/winche-functions";
import { documents } from "@winche-technologies/winche-admin";
import { withSecrets, withResources, withServer, testContext } from "@winche-technologies/winche-functions/testing";
const key = secrets.define("MAIL_KEY");
const logo = resources.define("a.txt");
export const send = callable(async (d: { p: string }) => ({ key: key.value(), a: await logo.text(), doc: (await documents.doc(d.p).get()).get("x") }), { secrets: [key] });
Deno.test("helpers", async () => {
  const r = await withSecrets({ MAIL_KEY: "k1" }, () => withResources({ "a.txt": "hello" }, () =>
    withServer(async (op, args) => { if (op !== "db.get") throw new Error(op); return { document: { name: args.path, fields: { x: { stringValue: "v" } }, createTime: "2026-01-01T00:00:00.000000Z", updateTime: "2026-01-01T00:00:00.000000Z", version: 1 } }; },
      () => send.run({ p: "a/b" }, testContext()))));
  if (JSON.stringify(r) !== JSON.stringify({ key: "k1", a: "hello", doc: "v" })) throw new Error(JSON.stringify(r));
  let msg = ""; try { key.value(); } catch (e) { msg = (e as Error).message; }
  if (!msg.includes("outside a function's run")) throw new Error(msg);
});

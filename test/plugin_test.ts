import { callable, plugin } from "@winche-technologies/winche-functions";
import { withSecrets, testContext } from "@winche-technologies/winche-functions/testing";

const sms = plugin((p) => {
  const token = p.secret("AUTH_TOKEN");
  return { send: callable(async (d: { to: string }) => ({ from: p.setting("FROM"), to: d.to, token: token.value(), id: p.id }), { secrets: [token] }) };
});

Deno.test("a plugin's installed copy: its settings, its own secrets, its functions", async () => {
  const copy = sms.install({ id: "alerts", settings: { FROM: "+44" }, secrets: { AUTH_TOKEN: "ALERTS__AUTH_TOKEN" } });
  if (copy.__wincheGroup !== 1 || Object.keys(copy.functions).join() !== "send") throw new Error("functions");
  if (JSON.stringify(copy.functions.send.options.secrets) !== '["ALERTS__AUTH_TOKEN"]') throw new Error(JSON.stringify(copy.functions.send.options));
  const r = await withSecrets({ ALERTS__AUTH_TOKEN: "t1" }, () => copy.functions.send.run({ to: "+1" }, testContext()));
  if (JSON.stringify(r) !== JSON.stringify({ from: "+44", to: "+1", token: "t1", id: "alerts" })) throw new Error(JSON.stringify(r));
  let msg = "";
  try { await plugin((p) => ({ x: callable(async () => p.setting("NOPE")) })).install({ id: "a", settings: {}, secrets: {} }).functions.x.run(null, testContext()); }
  catch (e) { msg = (e as Error).message; }
  if (!msg.includes("no setting NOPE")) throw new Error(msg);
  msg = "";
  try { plugin(() => ({ "a-b": callable(async () => 1) })).install({ id: "a", settings: {}, secrets: {} }); } catch (e) { msg = (e as Error).message; }
  if (!msg.includes("isn't a function name")) throw new Error(msg);
});

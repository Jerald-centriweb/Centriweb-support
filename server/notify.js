/**
 * Real notification path to Jerald: pushes into the centri-agents OS inbox
 * (127.0.0.1:8484), which is the same inbox Jerald's Claude sessions and the
 * brain app read from. See /opt/centri-agents/app.py push_inbox()/@app.post("/inbox").
 */
export async function notifyJerald(account, ticket) {
  const url = process.env.AGENT_INBOX_URL;
  const token = process.env.AGENT_TOKEN;
  const text = `[Support Portal] New ticket from ${account.company_name} (${account.slug}): "${ticket.subject}" — ${ticket.body.slice(0, 300)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-token': token },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`inbox notify failed: ${res.status} ${await res.text()}`);
  }
  return true;
}

/**
 * ClickUp task creation for support tickets.
 *
 * Reuses the exact auth pattern and API already relied on by centri-agents
 * (/opt/centri-agents/tools.py: clickup_create_task / clickup_find_list) —
 * same key file, same header style, same v2 REST endpoints, same 10-minute
 * hierarchy cache — so there is only one mental model of "how CentriWeb code
 * talks to ClickUp", not two.
 *
 * One deliberate improvement over tools.py's clickup_find_list(): that
 * function matches on LIST NAME ONLY, which is ambiguous in the real
 * workspace — almost every client folder under the "Delivery" space contains
 * a list literally called "Custom Builds" (Bella Sloan, House & Land co, EAP,
 * Priceaplan, Atmosphere Global, ...). Matching "Custom Builds" by name alone
 * would silently route every client's tickets to whichever folder happens to
 * be cached first. Support tickets have to land on the RIGHT client's board,
 * so this module matches the FOLDER (the client) first, then picks a list
 * inside it, falling back to list-name matching only for boards that aren't
 * organised into a folder.
 */
import fs from 'fs';

function readSecret(path, name) {
  try {
    const text = fs.readFileSync(path, 'utf8');
    for (const line of text.split('\n')) {
      if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // file missing — caller handles the empty string
  }
  return '';
}

const CLICKUP_KEY = readSecret('/opt/agency-brain/.clickup.env', 'CLICKUP_API_KEY');
const API = 'https://api.clickup.com/api/v2';

let cache = { ts: 0, entries: [] }; // { listId, listName, folderName, spaceName }
const CACHE_MS = 10 * 60 * 1000;

async function getJson(url) {
  const res = await fetch(url, { headers: { Authorization: CLICKUP_KEY } });
  if (!res.ok) throw new Error(`ClickUp ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function crawlHierarchy() {
  const entries = [];
  const { teams = [] } = await getJson(`${API}/team`);
  for (const team of teams) {
    const { spaces = [] } = await getJson(`${API}/team/${team.id}/space`);
    for (const space of spaces) {
      const { folders = [] } = await getJson(`${API}/space/${space.id}/folder`);
      for (const folder of folders) {
        for (const list of folder.lists || []) {
          entries.push({ listId: list.id, listName: list.name, folderName: folder.name, spaceName: space.name });
        }
      }
      const { lists: folderless = [] } = await getJson(`${API}/space/${space.id}/list`);
      for (const list of folderless) {
        entries.push({ listId: list.id, listName: list.name, folderName: null, spaceName: space.name });
      }
    }
  }
  return entries;
}

async function getEntries() {
  if (Date.now() - cache.ts > CACHE_MS || cache.entries.length === 0) {
    cache = { ts: Date.now(), entries: await crawlHierarchy() };
  }
  return cache.entries;
}

// Lists worth preferring, in order, when a client folder has more than one.
const PREFERRED_LIST_NAMES = ['client requests', 'support', 'support tickets', 'requests', 'custom builds'];

/**
 * Find the ClickUp list a ticket for `query` (an account's clickup_list_name,
 * falling back to its company_name) should land on.
 */
export async function findList(query) {
  if (!CLICKUP_KEY) throw new Error('CLICKUP_API_KEY not configured (/opt/agency-brain/.clickup.env)');
  if (!query) return null;
  const entries = await getEntries();
  const q = query.toLowerCase();

  const folderMatches = entries.filter(
    (e) => e.folderName && (e.folderName.toLowerCase() === q || e.folderName.toLowerCase().includes(q) || q.includes(e.folderName.toLowerCase()))
  );
  if (folderMatches.length > 0) {
    for (const preferred of PREFERRED_LIST_NAMES) {
      const hit = folderMatches.find((e) => e.listName.toLowerCase() === preferred);
      if (hit) return hit;
    }
    return folderMatches[0];
  }

  // Fall back to matching the list name directly (covers folderless boards).
  const exact = entries.find((e) => e.listName.toLowerCase() === q);
  if (exact) return exact;
  const partial = entries.find((e) => e.listName.toLowerCase().includes(q) || q.includes(e.listName.toLowerCase()));
  return partial || null;
}

/**
 * Create a ClickUp task for a support ticket. Never throws for "no list
 * found" — returns { ok: false, reason } instead so the caller (server/index.js)
 * can save the ticket regardless and surface the failure rather than crash
 * ticket creation over a ClickUp-side problem.
 */
export async function createTicketTask({ accountLabel, listQuery, subject, body, ticketId }) {
  try {
    const list = await findList(listQuery);
    if (!list) {
      return { ok: false, reason: `No ClickUp board found matching "${listQuery}"` };
    }
    const description =
      `Raised by: ${accountLabel}\n\n${body}\n\n` +
      `— Support portal ticket ${ticketId}. This ticket is also logged in the portal database and the OS inbox.`;
    const res = await fetch(`${API}/list/${list.listId}/task`, {
      method: 'POST',
      headers: { Authorization: CLICKUP_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Support ticket: ${subject}`, description }),
    });
    if (!res.ok) {
      return { ok: false, reason: `ClickUp API ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    const task = await res.json();
    return { ok: true, taskId: task.id, taskUrl: task.url, list: `${list.folderName ? list.folderName + ' / ' : ''}${list.listName}` };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

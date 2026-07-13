/**
 * Grounded chat: answers ONLY from (a) migrated guide content and (b) Agency
 * Brain search (http://localhost:3001/api/search). No general LLM call, no
 * invented content — this module retrieves matching snippets and, if and only
 * if something actually matched, composes a reply that quotes/paraphrases the
 * match and cites the guide. If nothing matched, it refuses and offers a
 * ticket instead of guessing.
 */
import pool from './db.js';

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Common words that appear in almost every sentence (including guide titles
// like "Getting a lead into your system") and must never count as a topical
// match on their own — the first version of this file used substring
// matching with a length>2 cutoff, which let "you" silently match inside
// "your" in "Start here - your first week" for literally any question that
// contained the word "you". Word-boundary matching + a stopword list fixes
// that class of false positive.
const STOPWORDS = new Set([
  'the','and','for','are','you','your','with','can','also','tell','what','how','why','when',
  'where','who','which','this','that','have','has','had','was','were','been','being','from',
  'about','into','onto','some','any','all','not','but','yet','out','off','over','under','then',
  'than','will','would','should','could','does','doing','done','next','just','only','even',
]);

function meaningfulWords(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || []).filter(
    (w) => w.length > 3 && !STOPWORDS.has(w)
  );
}

function wordOverlapCount(words, hay) {
  return words.filter((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hay)).length;
}

// Guides are public content (RLS policy `guides_read USING (true)`, see
// migrations/002) so this is a plain query — no account/session context
// needed to read them, same as the /api/guides endpoint.
async function searchGuides(query) {
  // status = 'live' only — the grounded chat must never cite a draft guide
  // (e.g. unreviewed Notion-sourced content) as if it were checked and true.
  const { rows: allGuides } = await pool.query(
    `SELECT slug, title, summary, content, content_format FROM guides WHERE status = 'live' ORDER BY order_index`
  );

  const words = meaningfulWords(query);
  if (words.length === 0) return [];

  const scored = allGuides
    .map((g) => {
      const hay = `${g.title} ${g.summary} ${stripHtml(g.content)}`.toLowerCase();
      const matches = wordOverlapCount(words, hay);
      return { g, matches };
    })
    // Require at least 2 distinct meaningful words to overlap (or all of
    // them for a short question) — one incidental match isn't a real hit.
    .filter(({ matches }) => matches >= Math.min(2, words.length))
    .sort((a, b) => b.matches - a.matches);

  return scored.slice(0, 3).map(({ g }) => g);
}

// Agency Brain's /api/search is a broad semantic/keyword search over the
// whole agency knowledge graph (competitors, MiroFish, sales training, etc.)
// and always returns its top-N nearest results even when nothing is a good
// match — it has no relevance cutoff of its own. Taking any hit at face value
// would defeat "refuse to fabricate" (tested against an absurd, unrelated
// question during build: it happily returned a "dog training funnel ROAS"
// fact). So we require actual lexical overlap between the query and the hit
// before treating it as grounding — not just "the brain returned something".
function isRelevant(query, hitText) {
  const words = meaningfulWords(query);
  if (words.length === 0) return false;
  const matches = wordOverlapCount(words, hitText.toLowerCase());
  // Require at least 2 distinct meaningful words to overlap (or all of them,
  // for very short questions) — a single incidental word match (e.g. "dog")
  // is not enough to call something grounded.
  return matches >= Math.min(2, words.length);
}

async function searchBrain(query) {
  const url = process.env.BRAIN_SEARCH_URL;
  try {
    const res = await fetch(`${url}?q=${encodeURIComponent(query)}&limit=5`);
    if (!res.ok) return [];
    const data = await res.json();
    // Agency Brain's /api/search returns an array or {results:[...]} depending
    // on version — normalise defensively rather than assume a shape.
    const hits = Array.isArray(data) ? data : data.results || [];
    return hits.filter((h) => {
      const text = typeof h === 'string' ? h : h.content || h.fact || h.text || h.summary || '';
      return isRelevant(query, text);
    });
  } catch (err) {
    console.error('[chat] brain search failed (treated as no grounding found):', err.message);
    return [];
  }
}

export async function answerQuestion(question) {
  const [guideHits, brainHits] = await Promise.all([searchGuides(question), searchBrain(question)]);

  if (guideHits.length === 0 && brainHits.length === 0) {
    return {
      grounded: false,
      reply:
        "I couldn't find anything about that in the help guides or our knowledge base, so I don't want to guess and risk giving you the wrong answer. I can raise a support ticket for you instead — want me to do that?",
      sources: [],
    };
  }

  const parts = [];
  const sources = [];

  if (guideHits.length > 0) {
    const top = guideHits[0];
    const plain = top.content_format === 'html' ? stripHtml(top.content) : top.content;
    parts.push(`From the guide "${top.title}": ${top.summary || plain.slice(0, 400)}`);
    sources.push({ type: 'guide', slug: top.slug, title: top.title });
    for (const extra of guideHits.slice(1)) {
      sources.push({ type: 'guide', slug: extra.slug, title: extra.title });
    }
  }

  if (brainHits.length > 0) {
    const b = brainHits[0];
    const brainText = typeof b === 'string' ? b : b.content || b.fact || b.text || b.summary || JSON.stringify(b).slice(0, 300);
    parts.push(`From our knowledge base: ${brainText.slice(0, 400)}`);
    sources.push({ type: 'brain' });
  }

  return {
    grounded: true,
    reply: parts.join('\n\n'),
    sources,
  };
}

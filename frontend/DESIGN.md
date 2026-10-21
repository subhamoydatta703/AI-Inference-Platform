# Frontend design and integration

The public landing page is an adaptation of the Figmaland Startup Landing Page Dark reference supplied by the user:
https://www.figma.com/design/tiDteXEbShXCo2RizV6Q17/Figma-startup-landing-page-dark--Community-?node-id=0-3564

The accessible file contains an INTRO page and a flattened thumbnail (`62:3044`), not editable landing-page sections. The user explicitly approved adapting the visible layout. This implementation is original application code, not an exact template conversion. It uses the reference's charcoal background, centered headline, blue primary action, outlined secondary action, and angled product presentation. The product preview is actual UI markup illustrating this application, not the template screenshot.

Routes:
- `/`: responsive public landing page.
- `/console`: hash navigation for overview, API keys, platform models, usage/history, account, and integration docs. Retired workspace/playground hashes open integration docs; usage/settings hashes open history/account.
- `/api/me`: authenticated, server-only proxy to the existing Express user-profile endpoint.

Visual system: Geist and Geist Mono, charcoal surfaces, blue actions, muted borders, compact console typography, Lucide icons. Shared CSS tokens are defined in `app/globals.css`.

Live integration: browser-side Clerk sign-in using the publishable key, and direct authenticated requests to the Express user-profile endpoint using a Clerk bearer token. The frontend secret is not required for this browser flow. Account automatically connects the signed-in profile and supports retry/refresh. The backend installs Clerk's Express middleware before the authenticated user router so `getAuth(req)` can read verified authentication. The optional `/api/me` server proxy remains available when frontend server credentials are configured, but the account UI does not use it.

The user synchronization validator also now matches the User schema: it accepts an ID and email without requiring the API-key `count` field. The existing middleware sends only ID and email, so that requirement previously rejected every new synchronized user. A focused regression test covers this payload.

Product architecture: the backend accepts a query with optional language, code, and URL fields. The current orchestrator calls GPT-OSS 20B and GPT-OSS 120B through Groq, followed by nvidia/nemotron-3-ultra-550b-a55b:free through OpenRouter, then uses GPT-OSS 120B to select the best acceptable candidate unchanged. Models are read-only platform information, never a user selection.

Removed: all fabricated request counts, token totals, latency figures, named sample models, browser-created keys, simulated responses, temperature/model selectors, and sample CSV export. The old mock-data module and sample-export route no longer exist. Browser-local legacy key records are ignored without altering user storage.

Availability: account authentication/profile access, API-key management, and API-key-authenticated query inference are implemented. The model panel describes the backend's configured candidate models and evaluation step, not a live model-discovery endpoint. History/usage remain unavailable. The console remains focused on API integration and account management, not query submission. Only newly created platform-key secrets can be revealed or copied during the current page session; all stored keys can be revoked. Platform keys authenticate query execution; Clerk sessions authenticate account and key management.

Integration docs: exactly Python and TypeScript. POST /api/v1/queries uses a platform API key as a Bearer token (INFERENCE_API_KEY) with query plus optional language/code/url fields, with JSON response/error handling. The answer is in data.response and the generated ID is in data.conversationId. Each request creates a new conversation; IDs are not accepted for continuation and history is not stored. GROQ_API_KEY and OPENROUTER_API_KEY stay in the Express backend. The response exposes the original query and final evaluated answer without user IDs or a winning-model field. No simulated results are shown.

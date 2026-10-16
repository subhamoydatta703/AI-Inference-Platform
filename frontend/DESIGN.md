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

Product architecture: the user provides a query with optional code or documentation. An orchestration layer routes it to different models, a separate evaluator checks the answers, and the final insight is returned. Models are read-only platform information, never a user selection.

Removed: all fabricated request counts, token totals, latency figures, named sample models, browser-created keys, simulated responses, temperature/model selectors, and sample CSV export. The old mock-data module and sample-export route no longer exist. Browser-local legacy key records are ignored without altering user storage.

Availability: account authentication/profile access is implemented. Evaluation, key management, configured model roster, and history/usage have no backend routes yet and show unavailable states. The console is for API integration and account management, not query submission. Copyable Python/TypeScript examples and request/response contracts work. Key creation stays disabled until its backend service exists.

Integration docs: exactly Python and TypeScript. The proposed POST /api/v1/queries contract uses query plus optional context and a server-held API key, with JSON response/error handling. It is labeled unimplemented everywhere, including copied examples. Backend API-key lifecycle, orchestration, evaluation, model roster, and history endpoints are the next prerequisites for enabling those controls.

# Mi Cartelera Personal — Design Guide

This guide records the existing visual direction of the application. Its source is `mi-cartelera-personal/src/index.css`, the screen markup, and Bootstrap 5.3.3 bundled through `src/main.tsx`. The [brand board](docs/design/brand-board.html) is a standalone visual companion. Open it directly in a browser; it requires no account, build, or network connection.

## Direction and identity

The experience feels like a quiet personal cinema: dark charcoal surroundings, warm gold highlights, soft ivory headings, and generous space around movie and TV posters. Content and personal viewing progress are the focus. Continue this direction when adding screens.

The project name is **Mi Cartelera Personal**. The current interface wordmark is **My Listing**, accompanied by a gold `◈` character and the uppercase caption **YOUR PERSONAL BOX OFFICE**. Preserve this existing lockup until a naming decision changes it. The character is a typographic mark, not a separate logo asset; do not invent a new logo or assign it an unestablished meaning.

Use gold for primary actions, emphasis, and focus. Use subdued red for destructive actions and errors. Viewing states are expressed with words rather than a separate traffic-light palette. Maintain the same identity across search, collection, authentication, detail, and editing.

## Color

### Core tokens

| Source token | Value | Role |
| --- | --- | --- |
| `--bg` | `#111216` | Page background and poster backing |
| `--surface` | `#1b1c22` | Cards, search panel, authentication panel |
| `--border` | `#33343d` | Panel outlines and quiet dividers |
| `--text` | `#b9bac5` | Body copy and secondary information |
| `--text-h` | `#f5f0e8` | Titles and headings |
| `--accent` | `#e6b86a` | Primary actions, small section labels, totals, focus |

The page has a restrained radial wash: `ellipse at 15% 0%`, starting with `#30271c66` and fading to transparent at 45%, over the background. The navbar uses `#14151bee` with a bottom border. These are supporting surfaces, not additional brand colors.

### Controls and feedback

| State or role | Existing values |
| --- | --- |
| Primary | Gold fill/border; `#21190d` label |
| Primary hover / active / disabled | `#f5cd8e` / `#d2a454` / `#8c7757` fills |
| Secondary | `#ded5c7` label, `#ffffff06` fill, `#5c5140` border |
| Secondary hover | `#ffe0ac` label, `#e6b86a18` fill, gold border |
| Destructive | `#eda5a0` label, `#bd6d6912` fill, `#945b594d` border |
| Destructive hover | White label, `#713e3b` fill, `#b67671` border |
| Field | `#111217` fill, `#3d3e48` border, heading-color value |
| Field focus | `#15161c` fill, gold border, `0 0 0 3px #e6b86a1c` ring |
| Field label / placeholder | `#d7d0c5` / `#81828f` |
| Error panel | `#efb8b3` text, `#693c3c22` fill, `#a46c6c66` border |

Alpha colors depend on their backing surface. Evaluate them on the intended dark background. Do not infer accessibility compliance from these token values alone.

## Typography and voice

Use the existing system stack: **Segoe UI, system-ui, sans-serif**. No downloaded font is required. Body size follows Bootstrap's default 1rem; paragraph line height inside media cards is 1.75. Actual rendering and intermediate font weights vary by operating system.

| Use | Size and treatment |
| --- | --- |
| Wordmark | 1.4rem, weight 750, tracking −.04em |
| Brand caption | .58rem, uppercase, tracking .19em |
| Collection page heading | `clamp(1.8rem, 4vw, 2.6rem)`, weight 700 |
| General h1–h4 | Ivory, tracking −.035em |
| Card title | 1.15rem, weight 700, line height 1.4 |
| Detail title | 1.8rem |
| Metadata heading | .72rem, uppercase, gold, tracking .1em |
| Eyebrow | .65rem, uppercase, gold, tracking .16em |
| Form label | .8rem, weight 650 |
| Standard button | .88rem, weight 650 |
| Card action | .76rem |
| Summary total | 2rem, weight 700, gold |

Interface copy should be English, concise, and personal: “My Listing,” “Add to my Listing,” “Watching,” and “Back to My Listings” reflect the current vocabulary. The initial-state audit recorded Spanish labels and unrelated fallback messages; E1 repairs replace them with English. Use clear action names and distinguish the user's 1–5 rating from TMDB's public rating out of 10.

## Layout, spacing, and shape

- Main content has a maximum width of 1160px, with 2.5rem top and 4rem bottom padding. Bootstrap containers provide additional viewport-dependent gutters.
- The media grid uses three equal columns with a 1.5rem gap. Cards align their action areas toward the bottom.
- Spacing follows the existing Bootstrap rhythm: .25, .5, .75, 1, 1.5, 2, 2.5, 3, and 4rem. Use the nearest established spacing rather than introducing arbitrary offsets.
- Media cards have a 1px border, 15px corner radius, and 1.4rem body padding. Search panels use 16px corners; authentication uses 18px; buttons, fields, and posters use 9px. Small cast tiles use 7px corners; errors use 10px.
- Shadows are restrained: search `0 16px 45px #0002`, authentication `0 25px 80px #0004`, detail poster `0 18px 35px #0005`.
- Detail content uses a 280px poster column and a flexible text column, a 3rem gap, and 2.5rem padding. Cast information uses two columns of small bordered tiles.
- Authentication is centered in the viewport, with a 430px maximum panel width and a 3px gold top edge. Editing uses a panel up to 650px wide and a compact 160px poster.

## Responsive behavior

| Width | Existing behavior |
| --- | --- |
| Above 991px | Three media columns; detail poster column up to 280px |
| 576–991px | Two media columns; 220px detail poster column; 1.5rem detail gap/padding |
| 575px and below | One media column; stacked details; one cast column; centered/wrapping navigation; 1.5rem screen top padding |

At the smallest breakpoint, detail posters are capped at 250px and authentication padding falls to 1.75rem. Keep controls and text within the viewport, allow long titles to wrap, and preserve readable spacing. The brand board has its own documentation layout but uses these same breakpoints.

## Imagery

Movie and TV posters are the primary imagery. Grid posters sit on a dark backing at a 2:3 aspect ratio with `object-fit: contain`, preserving the artwork without cropping. Detail posters remain proportional and larger than edit thumbnails. Keep imagery secondary to readable title and action text.

Use descriptive alternative text for meaningful posters. When artwork is unavailable, the intended treatment is a neutral dark placeholder with a textual explanation; the shared MediaPoster pattern now implements this fallback, including failed image loads. The brand board uses a clearly labeled poster placeholder rather than external artwork.

## UI patterns and states

- **Navigation:** quiet text actions, thin separation from the page, gold hover emphasis, and a subdued red logout action.
- **Search:** bordered dark panel, label above a flexible input/action row, and a compact movie/TV category control below it.
- **Media card:** title, proportional poster, personal metadata when relevant, then actions. Avoid competing accent colors or heavy ornament.
- **Collection summary:** bordered surface with a 2px gold top edge, a small muted state label, and a prominent gold count. Totals describe the whole collection.
- **Forms:** dark filled fields, clear labels, optional guidance, and a gold submit button. Keep destructive or cancel actions visually distinct.
- **Errors:** tinted bordered panel with a plain-language explanation and an appropriate retry action. Empty states should describe an empty collection or unmatched filters clearly.
- **Loading:** 36px circular indicator with a 3px border and gold leading edge, accompanied by “Loading…” text. Button text also communicates pending submission.
- **Feedback samples:** the board's buttons and panels demonstrate appearance only; its specimen is not a working collection screen. The current app uses browser alerts and confirmation dialogs in some flows, so their appearance is controlled by the browser.

## Interaction and accessibility guidance

Existing button transitions last .18s. The spinner rotates every .8s. Under `prefers-reduced-motion: reduce`, transitions and spinner animation are removed; the loading text remains essential.

Buttons have a 3px gold keyboard-focus outline offset by 4px. Fields use the gold border and subtle ring described above. Preserve visible keyboard focus and provide hover, active, disabled, loading, and error states appropriate to each control.

Associate every label with its field, use semantic headings and landmarks, provide accessible names, and announce meaningful asynchronous status/error updates. Do not communicate viewing state or failure by color alone. Check text contrast, keyboard operation, zoom, and narrow screens in a browser before claiming compliance. These are requirements for future design work; the initial-state audit identifies gaps in existing markup.

## Applying this guide

Keep the application stylesheet as the implementation source of truth for existing tokens. Reuse established patterns when adding features, and update this guide and the brand board together when visual decisions change. Product behavior belongs in feature specifications; this guide does not authorize new functionality. The brand board is local documentation, contains illustrative content, and does not alter the application stylesheet or behavior.


## Bootstrap customization and allowed components

The application bundles Bootstrap 5.3.3 from its npm dependency through `src/main.tsx`. Customization lives in `mi-cartelera-personal/src/index.css`, imported after Bootstrap. Keep Bootstrap layout utilities and semantic control classes as the base; use the existing color tokens and scoped selectors to customize surfaces, buttons, forms, and typography.

Reuse `container`, `row`, responsive column utilities, spacing/flex utilities, `card`/`card-body`, `btn` variants, `form-label`, `form-control`, `form-select`, `navbar`, and `btn-group`. Existing custom patterns include `media-grid`, `media-card`, `detail-layout`, error panels, and the loading indicator. Movie Night may reuse these patterns for candidates and summary/history panels. Bootstrap JavaScript plugins are not currently loaded; do not assume modal/dropdown behavior is available from CSS alone.

Prohibited for E2: adding another CSS/component framework, replacing the current font/identity, introducing arbitrary new brand colors or copied visual constants inside the interface spec, global overrides that regress E1, removing focus outlines without a visible replacement, color-only state communication, animated-only loading feedback, and unlabeled or inaccessible icon-only actions. Do not reproduce all stylesheet values in each feature document. If a genuinely missing visual pattern is needed, extend this guide and the shared stylesheet deliberately.

## Verifiable design criteria

These criteria apply to E2 and are planned acceptance checks, not claims that the existing application already passes. The interface spec must cite **DESIGN.md** by name and criterion id without copying visual values.

| ID | Requirement | Verification |
| --- | --- | --- |
| DES-01 | New screens use the existing Bootstrap classes and shared tokens/patterns; no additional UI/CSS framework or replacement identity | Review dependencies, new markup and styles against this guide; compare an E1 and E2 screen |
| DES-02 | Heading, body, metadata, poster proportions and action hierarchy follow the typography/imagery/pattern sections | Browser comparison with the brand board; inspect computed styles and uncropped poster rendering |
| DES-03 | Planning, history and detail stay readable without horizontal page overflow at viewport widths 375, 768 and 1280 CSS pixels; long titles wrap | Browser checks at each width plus 200% zoom on a desktop viewport; all actions remain reachable |
| DES-04 | Every input has an associated label; all actions work by keyboard; focus remains visible and logical after add/remove or navigation | Keyboard-only flow and label/accessibility inspection; focus must not be lost when a selected item is removed |
| DES-05 | Loading, error, empty, unavailable, over-budget, pending and disabled states have textual explanations; important total/error updates are announced | Exercise each state; inspect status/alert semantics with the accessibility tree and an assistive-technology check |
| DES-06 | Reduced-motion preference removes nonessential transitions/spinner animation while preserving loading text | Emulate prefers-reduced-motion and inspect motion/text during a pending request |
| DES-07 | Existing authenticated navigation and logout remain available, and existing E1 workflows keep their styling and behavior | Compare search, collection, edit and detail flows before/after E2; distinguish old defects from new regressions |
| DES-08 | Text contrast meets WCAG AA targets for normal and large text; meaningful UI boundaries/focus meet non-text contrast requirements, and state is never color-only | Measure actual rendered foreground/background pairs, including alpha blends and error/disabled-adjacent explanations; record ratios and text alternatives |

Design verification results belong in `docs/VERIFICACION.md`, with the student's obtained results, and `docs/AUDITORIA.md`, with criterion status/evidence. Passing a build does not prove a design criterion.


## Movie Night application

E2 reuses the existing surfaces and Bootstrap responsive columns. The planner places candidates beside a session summary on large screens and stacks them on smaller screens. The summary exposes movie time, break time, total and remaining time as a compact definition list with a polite live region. Removing a movie moves focus to the summary so keyboard focus is retained. Candidate errors and unavailable-duration reasons stay in text beside their controls; uncertain-save recovery locks draft editing until the unchanged save can be retried. History and saved detail use the same cards and poster fallback, with no editing controls. Saved detail includes a confirmed destructive Delete session action; the history footer stays visible through loading, retry and completion. Long saved names and movie titles wrap within their containers.

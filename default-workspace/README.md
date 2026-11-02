# Mayank Katnoria — Portfolio 2026

An interactive, multi-scene portfolio for **Mayank Katnoria** — full-stack developer and competitive programmer at IIIT Lucknow.

Built from scratch with HTML, CSS and vanilla JavaScript. No frameworks, no build step, no runtime dependencies. The 3D sculpture is drawn on a `<canvas>` with custom projection math, and the six full-screen scenes move through 3D space as you scroll.

**Local preview:** [http://127.0.0.1:4173](http://127.0.0.1:4173)

---

## What’s inside

### Home — a six-scene journey

| Scene | Content |
| --- | --- |
| 01 · Identity | Name, positioning, availability, interactive 3D sculpture |
| 02 · About | Bio, education, working principles, 3D student ID card |
| 03 · Stack | Interactive 3D tech keyboard with 30 skills and category filters |
| 04 · Work | 3D project deck with live screenshots and case-study links |
| 05 · Proof | CodeChef/Codeforces stats, 600+ problems, Hackofiesta, clubs |
| 06 · Contact | Email, copy-to-clipboard, socials, availability |

The hero sculpture can be **dragged to rotate** and **clicked to pulse**. Scenes transition with depth, rotation and fade as you move forward. Navigation works through the header, the right-hand scene rail, the mobile menu, keyboard scrolling and direct links such as `#work`.

### Project case-study pages

- [CampusSync](work/campus-sync.html) — multi-tenant credential platform, 90+ APIs, 50+ RLS policies
- [Nexus / Fuze](work/nexus.html) — AI content discovery with pgvector, semantic search and Redis caching
- [StoreHUB](work/storehub.html) — collaborative component marketplace with Go/Fiber and CI/CD

Each page includes the brief, architecture, build notes, impact metrics, real screenshots, live/source links and next-project navigation.

---

## Run it locally

```bash
python -m http.server 4173
```

Then open **http://localhost:4173**.

You can also open `index.html` directly, but serving the folder is recommended so relative paths and materials behave exactly as they will in production.

---

## Make it yours

### 1. Identity, bio, contact

Edit `index.html`:

- `<title>`, meta description and Open Graph tags
- `.logo` (`MK.` monogram)
- `.hero__title` — currently `MAYANK` / `KATNORIA`
- The about copy, principles, education and ID card
- Contact email: `mayankkatnoria518@gmail.com`
- Social links: GitHub, LinkedIn, CodeChef

Also update the footer on each of the three pages in `work/`.

### 2. Stack

Each key in the `.keyboard` block is a button with:

```html
data-name="React"
data-cat="frontend"
data-color="#61dafb"
data-desc="Component-driven interfaces..."
style="--icon:url('../assets/icons/react.svg')"
```

To add a tool, copy a key, change the attributes and drop a matching SVG into `assets/icons/`. The readout, filters and hover states update automatically.

> Icon URLs are resolved relative to `css/scene.css`, so the path starts with `../assets/icons/`.

### 3. Projects

Home cards live in the `.projects` / `.carousel` section of `index.html`. Each links to a page under `work/`.

Each case study has its own content, metrics, tags, live/source links and image. Screenshots are in `assets/projects/`:

- `campus-800.jpg`, `campus-1200.jpg`, `campus-mobile.jpg`
- `nexus-800.jpg`, `nexus-1200.jpg`, `nexus-mobile.jpg`

StoreHUB does not have a public live build, so its cover is a designed product mock — replace it with a real screenshot when the product is ready.

### 4. Achievements and clubs

Achievements, ratings, ranks and club descriptions live in the `#achievements` scene in `index.html`. The club descriptions are written from the roles listed on the resume (CP Wing, Axios Web Wing, Utkrisht Art Club) and can be edited to match your exact contributions.

Per your request, the site deliberately **does not include CGPA, Class X/XII marks or school details** — only the college, degree and branch.

### 5. 3D sculpture and motion

- `js/model.js` draws the torus-knot sculpture. Tune `KNOT_POINTS`, `scale` (search for `min * 0.128`), line widths and rotation speed here.
- `js/scene.js` controls the six-scene 3D transitions, navigation, stack keyboard, project carousel, counters, cursor and menu.
- `css/scene.css` controls scene layout, perspective and responsive behavior.

All movement respects `prefers-reduced-motion: reduce`. With reduced motion, the scenes become a normal stacked, scrollable page and the sculpture is rendered statically.

### 6. Colours and type

Tokens live at the top of `css/base.css`:

```css
--bg: #08080a;
--bone: #f2efe6;
--accent: #ff5a36;   /* changed per scene by JS */
```

Fonts are Space Grotesk, Instrument Serif and JetBrains Mono, loaded from Google Fonts.

---

## File map

```
.
├── index.html                 # six-scene home
├── work/
│   ├── campus-sync.html       # case study 01
│   ├── nexus.html             # case study 02
│   └── storehub.html          # case study 03
├── css/
│   ├── base.css               # tokens, reset, header, buttons, menu, footer
│   ├── scene.css              # 3D scenes, hero, stack, carousel, achievements
│   └── work.css               # case-study pages
├── js/
│   ├── model.js               # canvas 3D sculpture
│   ├── scene.js               # scene engine + interactions
│   └── work.js                # case-study reveals + image tilt
├── assets/
│   ├── icons/                 # 29 monochrome tech SVGs (Simple Icons)
│   ├── projects/              # live project screenshots
│   ├── favicon.svg
│   ├── og.png                 # 1200×630 social card
│   ├── preview-desktop.png
│   ├── preview-mobile.png
│   ├── preview-work.png
│   └── preview-case.png
├── og.html                    # source for the social card
└── README.md
```

---

## Deploy

### Vercel — recommended

This is a static site. There is no build step, no framework preset and no environment variables.

**From the dashboard**

1. Push this folder to GitHub (or GitLab / Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Use these settings:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** leave empty
   - **Output Directory:** leave empty (or `.`)
   - **Install Command:** leave empty
4. Click **Deploy**. Vercel serves `index.html` and the relative `css/`, `js/`, `work/` and `assets/` folders.
5. Optional: **Project → Settings → Domains** → add your domain and follow the DNS record Vercel gives you.

**From the CLI**

```bash
cd "C:\Users\mayan\OneDrive\Documents\deepseek-harness\default-workspace"
npx vercel login
npx vercel --prod
```

When prompted:

- Set up and deploy: **Y**
- Link to existing project: **N**
- Project name: your choice
- Directory: `./`
- Framework: **Other**
- Build command: **Enter** (empty)
- Output directory: **Enter** (empty)
- Development command: **Enter** (empty)

After the first deploy, future updates are just `npx vercel --prod` (or a push to the connected Git repo).

### Netlify

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the whole project folder onto the page.
3. Add your domain under **Domain settings** when ready.

### GitHub Pages

1. Push the folder to a GitHub repository.
2. **Settings → Pages → Deploy from a branch → main / root**.
3. The site will be available at `https://<username>.github.io/<repo>/`.

All paths are relative, so the site works from a subdirectory as well as a root domain.

### After deploying

Update the `og:image` meta tag in `index.html` (and the case pages) to an absolute URL:

```html
<meta property="og:image" content="https://your-domain.com/assets/og.png" />
```

To regenerate the social card after editing `og.html`:

```bash
chrome --headless=new --hide-scrollbars --window-size=1200,630 --screenshot=assets/og.png og.html
```

---

## Phone performance

Below **820px**, the site switches deliberately to a lighter rendering path:

- **Native scrolling** — no fixed 3D stage, no six full-screen compositor layers.
- **Static 3D sculpture** — the knot renders once and updates only while you drag or tap; no permanent animation loop.
- **No heavy effects on phones** — grain, backdrop blur, large blur filters, the rotating ring animation and giant outlined scene numbers are removed.
- **Responsive images** — `srcset` serves 800w JPEGs on phones instead of the old 1200–1440px PNGs.
- **Leaner fonts** — only the used Space Grotesk / JetBrains Mono weights are requested.
- **Less style churn** — section accents are scoped to each section, and nav state is not rewritten while scrolling.
- **Deferred offscreen work** — `content-visibility: auto` lets the browser skip painting sections that are not near the viewport.

Verified with GPU rasterization at a 2× CPU throttle on a 390×844 mobile emulation: no long tasks during a full scroll, ~7.5 ms average frame interval. The desktop version keeps the full 3D scene transitions and animated sculpture.

---

## Tested

- Chrome on desktop and mobile emulation
- 1440×1000, 1366×768, 1024×900
- 390×844 and 360×740 mobile
- No horizontal overflow at any tested width
- Keyboard navigation, Escape-to-close menu, `prefers-reduced-motion`
- No-JS fallback (all scenes stack and remain readable)

---

## Credits

- Project screenshots captured from the live CampusSync and Fuze deployments.
- Tech icons: [Simple Icons](https://simpleicons.org/) (CC0), recoloured with CSS masks.
- Fonts: [Google Fonts](https://fonts.google.com/) — Space Grotesk, Instrument Serif, JetBrains Mono.
- 3D sculpture, scene engine and all interactions: hand-written JavaScript with no libraries.

---

## Content note

All project metrics, roles and achievements come from the supplied resume and public profiles. Club descriptions are an expanded interpretation of the listed roles. The StoreHUB cover is a visual mock rather than a screenshot of a live deployment. Update any details that need to be more precise before publishing.

# TerraLex.org — Sitemap

- **Source:** https://www.terralex.org/
- **Date generated:** 2026-04-30
- **Status:** Live-site crawl (orchestrator pass)

This file is the structural inventory of `terralex.org` produced as the foundation for a per-page redesign brief. It captures the site's top-level pages, representative templated detail pages (firm profile, news article, cross-border guide, success story, practice group, industry sector team), key external destinations, and the local target file each page maps to in this Terralex redesign repo. Downstream subagents will turn each numbered entry in the "Pages-to-brief list" into a per-page redesign brief.

---

## Sitemap tree

- **Home** — https://www.terralex.org/
  - Annual Report 2025 (PDF) → https://api5.terralex.org/uploads/Terra_Lex_2025_Annual_Report_PDF_final_e170da684c.pdf
  - FDI Cross-Border Guide → https://www.terralex.org/insights-cross-border-guides/terralex-guide-to-foreign-direct-investment-new
- **Firms (directory)** — https://www.terralex.org/firms
  - (template) Firm profile page → https://www.terralex.org/firms/5a-law-firm-llp
- **Insights & Cross-Border Guides** — https://www.terralex.org/insights-cross-border-guides
  - (template) Guide detail page → https://www.terralex.org/insights-cross-border-guides/terralex-cross-border-real-estate-guide
- **MyLexi** — https://www.terralex.org/mylexi
- **News** — https://www.terralex.org/news
  - (template) News article → URL pattern `/news/<article-slug>` (individual article URLs are rendered client-side and were not extractable from the static fetch; subagent should capture one live example when briefing)
- **Events** — https://www.terralex.org/events
  - (no separate event-detail template confirmed — events appear to render inline on this page)
- **About** — https://www.terralex.org/about
  - About / Team subsection → https://www.terralex.org/about/team
- **Practice Groups & Industry Sector Teams (hub)** — https://www.terralex.org/practice-groups-Industry-sector-teams
  - Practice Groups index → https://www.terralex.org/practice-groups-Industry-sector-teams/groups
  - (template) Practice Group detail → https://www.terralex.org/practice-groups-Industry-sector-teams/groups/group-antitrust-competition
  - Industry Sector Teams index → https://www.terralex.org/practice-groups-Industry-sector-teams/industry-sector-teams
  - (template) Industry Sector Team detail → https://www.terralex.org/practice-groups-Industry-sector-teams/industry-sector-teams/ist-life-sciences
- **Success Stories** — https://www.terralex.org/success-stories
  - (template) Success story detail → https://www.terralex.org/success-stories/real-estate-client-praises-terralex-responsiveness
- **Search** — https://www.terralex.org/search
- **Sign-in (Member Intranet)** — https://www.terralex.org/sign-in
- **Contact Us** — https://www.terralex.org/contact-us
- **Terms & Conditions** — https://www.terralex.org/terms-and-conditions
- **Privacy Policy** — https://www.terralex.org/privacy-policy
- **External:** Connected Community (member portal) → https://terralex.connectedcommunity.org/home
- **External:** LinkedIn → https://www.linkedin.com/company/terralex/
- **External:** X / Twitter → https://x.com/terralex
- **External:** iOS App → https://apps.apple.com/us/app/terralex/id1525532860
- **External:** Android App → https://play.google.com/store/apps/details?id=com.terraLex.app

---

## Pages-to-brief list

1. home  —  https://www.terralex.org/  —  Marketing front door for the network: positions TerraLex as the elite global legal network and routes visitors to firms, guides, MyLexi, news, and contact.  —  target file: index.html
2. firms  —  https://www.terralex.org/firms  —  Filterable directory of all member law firms across 200+ jurisdictions.  —  target file: firms.html
3. firm-profile  —  https://www.terralex.org/firms/5a-law-firm-llp  —  Templated profile page for a single member firm (overview, attorneys, locations, practice areas, contact).  —  target file: firm.html
4. insights-cross-border-guides  —  https://www.terralex.org/insights-cross-border-guides  —  Hub listing TerraLex's cross-border comparison guides across practice areas (FDI, real estate, ESG, IP, etc.).  —  target file: new file: insights-cross-border-guides.html
5. guide-detail  —  https://www.terralex.org/insights-cross-border-guides/terralex-cross-border-real-estate-guide  —  Templated detail page for one cross-border guide, with jurisdiction-by-jurisdiction comparison content.  —  target file: new file: guide-detail.html
6. mylexi  —  https://www.terralex.org/mylexi  —  Product/marketing page for myLexi, the AI assistant for TerraLex member firms.  —  target file: mylexi.html
7. news  —  https://www.terralex.org/news  —  News index — list of articles, member-firm announcements, and network updates.  —  target file: new file: news.html
8. news-article  —  https://www.terralex.org/news/<article-slug>  —  Templated article page for a single news item (URL pattern confirmed; specific slug to be captured by subagent at brief time).  —  target file: new file: news-article.html
9. events  —  https://www.terralex.org/events  —  Events index listing upcoming and past TerraLex meetings, regional events, and webinars.  —  target file: new file: events.html
10. about  —  https://www.terralex.org/about  —  Organizational overview: leadership, officers, directors, emeritus, and network governance.  —  target file: new file: about.html
11. practice-groups-industry-sector-teams  —  https://www.terralex.org/practice-groups-Industry-sector-teams  —  Hub directory of TerraLex's practice groups and industry sector teams for finding specialized cross-border expertise.  —  target file: new file: practice-groups-industry-sector-teams.html
12. practice-group-detail  —  https://www.terralex.org/practice-groups-Industry-sector-teams/groups/group-antitrust-competition  —  Templated detail page for one practice group (member firms, contacts, scope).  —  target file: new file: practice-group-detail.html
13. industry-sector-team-detail  —  https://www.terralex.org/practice-groups-Industry-sector-teams/industry-sector-teams/ist-life-sciences  —  Templated detail page for one industry sector team.  —  target file: new file: industry-sector-team-detail.html
14. success-stories  —  https://www.terralex.org/success-stories  —  Index of cross-border collaboration case studies showcasing member-to-member referral wins.  —  target file: new file: success-stories.html
15. success-story-detail  —  https://www.terralex.org/success-stories/real-estate-client-praises-terralex-responsiveness  —  Templated detail page for one success story.  —  target file: new file: success-story-detail.html
16. search  —  https://www.terralex.org/search  —  Site-wide search results page (firms, attorneys, guides, news).  —  target file: new file: search.html
17. sign-in  —  https://www.terralex.org/sign-in  —  Member intranet sign-in (gateway to authenticated tools and Connected Community).  —  target file: new file: sign-in.html
18. contact-us  —  https://www.terralex.org/contact-us  —  Contact page with myLexi prompt, phone/email, and contact form.  —  target file: new file: contact-us.html
19. terms-and-conditions  —  https://www.terralex.org/terms-and-conditions  —  Site terms and conditions (legal).  —  target file: new file: terms-and-conditions.html
20. privacy-policy  —  https://www.terralex.org/privacy-policy  —  Site privacy policy (legal).  —  target file: new file: privacy-policy.html

---

## Notes — pages discovered but NOT briefed

- **About / Team subpath** (`/about/team`) — Treated as an in-page section/anchor of `/about` rather than a distinct template. Folded into the About brief; no separate brief.
- **Practice Groups index `/practice-groups-Industry-sector-teams/groups`** and **Industry Sector Teams index `/practice-groups-Industry-sector-teams/industry-sector-teams`** — These index URLs exist but are subviews of the Practice Groups & Industry Sector Teams hub. Not briefed separately; their content is covered by the hub brief plus the two templated detail briefs (#12 and #13).
- **Annual Report 2025 PDF** — Static PDF asset, not an HTML page; not briefed.
- **Connected Community** (`https://terralex.connectedcommunity.org/home`) — External member-portal subdomain, out of scope for this redesign benchmark.
- **LinkedIn / X / iOS App / Android App** — External profiles/apps, out of scope.
- **Event detail template** — No individual event-detail page URL was confirmed during the crawl; events appear to render inline on `/events`. If a subagent later confirms a separate template (e.g. `/events/<slug>`), an `event-detail` brief should be added.
- **design-system.html** (local-only) — Internal design-system reference page that already exists in the repo; not part of the live-site crawl, not briefed here.

---

## Per-page brief index

All 20 briefs live under `Benchmarks/pages/` and follow the same template (Live URL, Local target file, Page purpose, Current state observations, Pros, Cons tagged [UX]/[UI]/[Content]/[Accessibility]/[Mobile], Redesign plan, Instructions for Claude Code with the no-real-backend constraint).

| # | Slug | Brief file |
|---|------|------------|
| 1 | home | [pages/home.md](pages/home.md) |
| 2 | firms | [pages/firms.md](pages/firms.md) |
| 3 | firm-profile | [pages/firm-profile.md](pages/firm-profile.md) |
| 4 | insights-cross-border-guides | [pages/insights-cross-border-guides.md](pages/insights-cross-border-guides.md) |
| 5 | guide-detail | [pages/guide-detail.md](pages/guide-detail.md) |
| 6 | mylexi | [pages/mylexi.md](pages/mylexi.md) |
| 7 | news | [pages/news.md](pages/news.md) |
| 8 | news-article | [pages/news-article.md](pages/news-article.md) |
| 9 | events | [pages/events.md](pages/events.md) |
| 10 | about | [pages/about.md](pages/about.md) |
| 11 | practice-groups-industry-sector-teams | [pages/practice-groups-industry-sector-teams.md](pages/practice-groups-industry-sector-teams.md) |
| 12 | practice-group-detail | [pages/practice-group-detail.md](pages/practice-group-detail.md) |
| 13 | industry-sector-team-detail | [pages/industry-sector-team-detail.md](pages/industry-sector-team-detail.md) |
| 14 | success-stories | [pages/success-stories.md](pages/success-stories.md) |
| 15 | success-story-detail | [pages/success-story-detail.md](pages/success-story-detail.md) |
| 16 | search | [pages/search.md](pages/search.md) |
| 17 | sign-in | [pages/sign-in.md](pages/sign-in.md) |
| 18 | contact-us | [pages/contact-us.md](pages/contact-us.md) |
| 19 | terms-and-conditions | [pages/terms-and-conditions.md](pages/terms-and-conditions.md) |
| 20 | privacy-policy | [pages/privacy-policy.md](pages/privacy-policy.md) |

---

## Cross-cutting findings (from the briefs)

A few patterns surfaced across multiple briefs that should shape the redesign system before individual page work begins:

- **Live site is heavily JS-hydrated.** `/news`, `/events`, and detail pages return placeholder HTML in static fetches. Our redesigns can stay static for the prototype — but it confirms that we are working from screenshots and rendered observations, not the production data layer. No backend changes are proposed anywhere.
- **Sign-in is an Auth0 gate, not a credentials form.** `/sign-in` delegates to a third-party auth flow — the redesign restyles the gate (split-screen, brand left, single Auth0-routed CTA right) and explicitly does not add SSO/MFA/passwordless flows.
- **MyLexi is near-empty on the live site** (logo + paragraph). The redesign brief proposes the largest content build of any page: hero, demo, features, social proof, CTA — all driven by content we already have plus a static, front-end-only chat-widget demo.
- **Practice-group detail and industry-sector-team detail have no member-firm listings on the live site.** Both briefs make that the centrepiece. They share enough structure that the briefs recommend a single shared `group-detail.html` template, parameterised for Practice Group vs. Industry Sector Team.
- **Terms & Conditions and Privacy Policy share a long-form-legal pattern** with no TOC, buried "last updated" dates, and dense paragraphs. Both briefs converge on a shared `legal-doc` base layout (sticky TOC, narrow ~70ch measure, prominent dateline, deep-link anchors, back-to-top, print stylesheet).
- **Events detail template not confirmed.** Live `/events` is fully JS-rendered with no extractable detail-page URLs. If a real `/events/<slug>` template is later confirmed in a JS-capable session, add a 21st brief `pages/event-detail.md` then.

---

## Redesign priority order

The home (`index.html`) is already redesigned on this branch and serves as the visual-language reference. Recommended sequencing for the inner pages:

**Tier 1 — high-impact, network-defining pages (do first)**
1. **firms** — flagship directory; biggest visitor draw after home; sets the pattern for filterable index pages.
2. **mylexi** — biggest gap vs. live (near-empty page → fully-built product page); strongest "wow" win.
3. **firm-profile** — once `firms.html` lands, the profile template directly continues that flow.
4. **insights-cross-border-guides** + **guide-detail** — content-marketing cornerstone; pair these so the hub-to-detail flow is consistent.

**Tier 2 — supporting marketing pages**
5. **about** — story / leadership / governance; reinforces network credibility.
6. **success-stories** + **success-story-detail** — case-study evidence; reuses the home's existing success-story card pattern.
7. **news** + **news-article** — magazine-style index + readable long-form template; reuses the home's News & Insights cards.
8. **events** — featured next event + filterable archive.

**Tier 3 — directory & specialty pages**
9. **practice-groups-industry-sector-teams** (hub) — twin directory entry point.
10. **practice-group-detail** + **industry-sector-team-detail** — share one base `group-detail.html` template.

**Tier 4 — utility / legal / auth**
11. **search** — restyled around whatever search backend exists today.
12. **contact-us** — reskin the existing form + add real direct-contact info.
13. **sign-in** — restyle the Auth0 gate.
14. **terms-and-conditions** + **privacy-policy** — shared `legal-doc` base layout.

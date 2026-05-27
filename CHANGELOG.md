# Changelog

## [2.19.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.18.0...toast-stats-v2.19.0) (2026-05-27)


### Features

* **changes:** Phase 1 — snapshot diff engine + default district digest ([#793](https://github.com/taverns-red/toast-stats/issues/793)) ([#801](https://github.com/taverns-red/toast-stats/issues/801)) ([86d4ccb](https://github.com/taverns-red/toast-stats/commit/86d4ccb920a59160f42584b923a515eaf377ebeb))


### Bug Fixes

* **division:** recognition badge derives tier from the DDP single source ([#798](https://github.com/taverns-red/toast-stats/issues/798)) ([#805](https://github.com/taverns-red/toast-stats/issues/805)) ([07a6629](https://github.com/taverns-red/toast-stats/commit/07a662938a53947d6902ada2da313d83b6695180))
* **recognition:** consolidate division-recognition onto DDP source of truth + correct rules doc ([#799](https://github.com/taverns-red/toast-stats/issues/799)) ([#806](https://github.com/taverns-red/toast-stats/issues/806)) ([1433ed9](https://github.com/taverns-red/toast-stats/commit/1433ed9b3f6dc1f5c532f1cedc16a07572d72c2e))


### Documentation

* **lessons:** 123 — totals.distinguished* unpopulated mid-year, count from clubPerformance ([#793](https://github.com/taverns-red/toast-stats/issues/793)) ([#803](https://github.com/taverns-red/toast-stats/issues/803)) ([831431f](https://github.com/taverns-red/toast-stats/commit/831431f0eab3bf24143161c7d1ea96ebb6826cb1))

## [2.18.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.17.0...toast-stats-v2.18.0) (2026-05-27)


### Features

* **brand:** link footer Red Taverns attribution to portal ([#779](https://github.com/taverns-red/toast-stats/issues/779)) ([#789](https://github.com/taverns-red/toast-stats/issues/789)) ([cb745ec](https://github.com/taverns-red/toast-stats/commit/cb745ece25a63db0e9c6065829e20a1a1f061c2e))
* **seo:** per-route document titles ([#780](https://github.com/taverns-red/toast-stats/issues/780)) ([#790](https://github.com/taverns-red/toast-stats/issues/790)) ([2d2225b](https://github.com/taverns-red/toast-stats/commit/2d2225b9d2f56f423f8e9a77d1be6d85efaadf6f))
* **seo:** static share + SEO metadata in index.html ([#778](https://github.com/taverns-red/toast-stats/issues/778)) ([#788](https://github.com/taverns-red/toast-stats/issues/788)) ([2a94bbc](https://github.com/taverns-red/toast-stats/commit/2a94bbcc6c1077abff2a1dab6698230795fe10eb))


### Documentation

* **audit:** site & showcase audit + reusable capture script ([#778](https://github.com/taverns-red/toast-stats/issues/778)) ([#784](https://github.com/taverns-red/toast-stats/issues/784)) ([1d6022a](https://github.com/taverns-red/toast-stats/commit/1d6022a8691ff317929e69a19fc0416c743b97c0))

## [2.17.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.16.0...toast-stats-v2.17.0) (2026-05-26)


### Features

* **lessons:** depth-1 [[wikilink]] graph traversal for sprint lesson loading ([#772](https://github.com/taverns-red/toast-stats/issues/772)) ([#775](https://github.com/taverns-red/toast-stats/issues/775)) ([a593a0a](https://github.com/taverns-red/toast-stats/commit/a593a0ae5c4b15b3431ba8c170ca76a97f471c99))
* **monitor:** alert + backup cron when the daily pipeline silently misses a run ([#753](https://github.com/taverns-red/toast-stats/issues/753)) ([#761](https://github.com/taverns-red/toast-stats/issues/761)) ([1b0dc43](https://github.com/taverns-red/toast-stats/commit/1b0dc432c0a869fe2c49b0fb7ac25b324d876d4f))


### Bug Fixes

* **app-shell:** collapse primary nav into a disclosure menu &lt;768px ([#735](https://github.com/taverns-red/toast-stats/issues/735)) ([#764](https://github.com/taverns-red/toast-stats/issues/764)) ([21d185d](https://github.com/taverns-red/toast-stats/commit/21d185d6368974fe8d86b317398b93852c3513fa))
* **ci:** pr-preview-cleanup — checkout for firebase.json + capture stdout ([#776](https://github.com/taverns-red/toast-stats/issues/776)) ([#777](https://github.com/taverns-red/toast-stats/issues/777)) ([049d5fb](https://github.com/taverns-red/toast-stats/commit/049d5fbdf9f6c3454e5e04661a3a626e7b0f714c))
* **dark-mode:** migrate remaining components off prefers-scheme `dark:` to the theme toggle ([#715](https://github.com/taverns-red/toast-stats/issues/715)) ([#766](https://github.com/taverns-red/toast-stats/issues/766)) ([791bac0](https://github.com/taverns-red/toast-stats/commit/791bac0384c59d2dd0590fbe1bdf4b694b55ed2c))
* **landing:** reserve AwardsRaceSection slot to kill 0.198 landing-page CLS ([#750](https://github.com/taverns-red/toast-stats/issues/750)) ([#765](https://github.com/taverns-red/toast-stats/issues/765)) ([3d961f1](https://github.com/taverns-red/toast-stats/commit/3d961f1ee28f4d4f57ca19ee7e2811b78e80aa88))
* **security:** override uuid to ^11.1.1 to clear CVE-2026-41907 ([#755](https://github.com/taverns-red/toast-stats/issues/755)) ([#770](https://github.com/taverns-red/toast-stats/issues/770)) ([4b9600a](https://github.com/taverns-red/toast-stats/commit/4b9600ab030637ce14853e9c57104d3b1a508098))
* **sprint-runner:** --dry-run no longer mutates META_EPIC ([#694](https://github.com/taverns-red/toast-stats/issues/694)) ([#751](https://github.com/taverns-red/toast-stats/issues/751)) ([7fd25ef](https://github.com/taverns-red/toast-stats/commit/7fd25ef6e952d831099ebb1634e1a5d9c42cdce0))
* **sprint-runner:** honor operator steering — read issue comments + gate needs-product-review ([#767](https://github.com/taverns-red/toast-stats/issues/767)) ([#768](https://github.com/taverns-red/toast-stats/issues/768)) ([adc0737](https://github.com/taverns-red/toast-stats/commit/adc07376f0a3e90fabafbd2995da478cfc43343b))
* **sprint-runner:** refuse to auto-complete an epic with 0 parseable sprints ([#771](https://github.com/taverns-red/toast-stats/issues/771)) ([#774](https://github.com/taverns-red/toast-stats/issues/774)) ([351b6e1](https://github.com/taverns-red/toast-stats/commit/351b6e123b16cf2f8fd914ec1148ed5ba03eb744))


### Refactors

* **rankings:** consolidate duplicated Borda logic into analytics-core shared helpers ([#306](https://github.com/taverns-red/toast-stats/issues/306)) ([#759](https://github.com/taverns-red/toast-stats/issues/759)) ([244e649](https://github.com/taverns-red/toast-stats/commit/244e649f3aae2e34cef02c6895a50bdd1b2d3951))


### Documentation

* **fac:** resolve [#490](https://github.com/taverns-red/toast-stats/issues/490) — snapshot-only clubs are a registry-visibility signal ([#763](https://github.com/taverns-red/toast-stats/issues/763)) ([b22cf20](https://github.com/taverns-red/toast-stats/commit/b22cf20ea315f5e6fee9592f08de7608c317c116))
* **lessons:** 107 — monitor output freshness, not the best-effort scheduler ([#753](https://github.com/taverns-red/toast-stats/issues/753)) ([#762](https://github.com/taverns-red/toast-stats/issues/762)) ([b6b1087](https://github.com/taverns-red/toast-stats/commit/b6b108739087da0c62af625a17dfcc3c48bb756e))
* **security:** triage open uuid + @tootallnate/once alerts ([#754](https://github.com/taverns-red/toast-stats/issues/754)) ([#769](https://github.com/taverns-red/toast-stats/issues/769)) ([58d0a63](https://github.com/taverns-red/toast-stats/commit/58d0a63d8dbda2d9a883b68ad6a22b885829d485))

## [2.16.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.15.0...toast-stats-v2.16.0) (2026-05-26)


### Features

* **district:** KPI strip to spec — 4th card + tier legend (epic [#674](https://github.com/taverns-red/toast-stats/issues/674) Sprint 7) ([#681](https://github.com/taverns-red/toast-stats/issues/681)) ([#747](https://github.com/taverns-red/toast-stats/issues/747)) ([03c2cb9](https://github.com/taverns-red/toast-stats/commit/03c2cb943c8b2af18ff6d7fc965ccc2d24b970ac))
* **district:** lean Overview hub + delete On-this-page rail (epic [#674](https://github.com/taverns-red/toast-stats/issues/674), Sprint 5) ([#745](https://github.com/taverns-red/toast-stats/issues/745)) ([3a058fe](https://github.com/taverns-red/toast-stats/commit/3a058fe75b904b9923bf63793dcba492c69eb63e))
* **district:** promote Trends + Analytics to own routes (epic [#674](https://github.com/taverns-red/toast-stats/issues/674) Sprint 6) ([#746](https://github.com/taverns-red/toast-stats/issues/746)) ([6074f16](https://github.com/taverns-red/toast-stats/commit/6074f16ce9684484ca93ea333ab7038d9247be7d))
* **district:** secondary route-nav primitive (epic [#674](https://github.com/taverns-red/toast-stats/issues/674), Sprint 4) ([#678](https://github.com/taverns-red/toast-stats/issues/678)) ([#744](https://github.com/taverns-red/toast-stats/issues/744)) ([0746fc5](https://github.com/taverns-red/toast-stats/commit/0746fc575cbbcbc661e012dc9431e5e94497d6a2))


### Bug Fixes

* **district:** consolidate header action cluster into an overflow menu (epic [#674](https://github.com/taverns-red/toast-stats/issues/674) Sprint 2) ([#742](https://github.com/taverns-red/toast-stats/issues/742)) ([4b6e31e](https://github.com/taverns-red/toast-stats/commit/4b6e31edba13bf885e1df659fcb08e6b45be90ba))
* **district:** un-gate trend charts from viewport + theme-aware skeleton (epic [#674](https://github.com/taverns-red/toast-stats/issues/674) Sprint 1) ([#739](https://github.com/taverns-red/toast-stats/issues/739)) ([86c390c](https://github.com/taverns-red/toast-stats/commit/86c390cf80ca5952a4f1638a320f4b3c633edae8))


### Documentation

* **adr:** 005 — district subpage IA map + secondary route-nav (epic [#674](https://github.com/taverns-red/toast-stats/issues/674) Sprint 3) ([#743](https://github.com/taverns-red/toast-stats/issues/743)) ([8bc0a7b](https://github.com/taverns-red/toast-stats/commit/8bc0a7b808dfe54dd9d7e684196fdd7fa7aa64dc))
* **lessons:** 115 — a field's name can lie about whether it's populated in your surface ([#681](https://github.com/taverns-red/toast-stats/issues/681), [#674](https://github.com/taverns-red/toast-stats/issues/674)) ([#748](https://github.com/taverns-red/toast-stats/issues/748)) ([1239e93](https://github.com/taverns-red/toast-stats/commit/1239e93fdef6bc587714de088348c267dc8abb89))

## [2.15.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.14.0...toast-stats-v2.15.0) (2026-05-26)


### Features

* **cd:** release-gated production deploy (ADR-004) ([#707](https://github.com/taverns-red/toast-stats/issues/707)) ([#722](https://github.com/taverns-red/toast-stats/issues/722)) ([b20f426](https://github.com/taverns-red/toast-stats/commit/b20f426efd55762c0d9bdd42ea68c7db1fdd98cb))
* **clubs-table:** column model to handoff — DCP bar, cur/base, status & tier pills (epic [#665](https://github.com/taverns-red/toast-stats/issues/665), Sprint 3) ([#729](https://github.com/taverns-red/toast-stats/issues/729)) ([3e2fb7e](https://github.com/taverns-red/toast-stats/commit/3e2fb7e13c819dabb2dba09d00ffee701553fff7))
* **clubs-table:** re-skin controls row — search, segmented filter, quick chips (epic [#665](https://github.com/taverns-red/toast-stats/issues/665) Sprint 4) ([#731](https://github.com/taverns-red/toast-stats/issues/731)) ([e928449](https://github.com/taverns-red/toast-stats/commit/e928449227862b11ee7b17e9565ab8b4c1def2d8))
* **clubs-table:** re-skin table chrome to redesign tokens (epic [#665](https://github.com/taverns-red/toast-stats/issues/665), Sprint 2) ([#727](https://github.com/taverns-red/toast-stats/issues/727)) ([5ecdce3](https://github.com/taverns-red/toast-stats/commit/5ecdce3df15e6b87d9ac396829770b757d9dba48))
* **clubs-table:** remove pagination — single sticky-header table (epic [#665](https://github.com/taverns-red/toast-stats/issues/665), Sprint 1) ([#725](https://github.com/taverns-red/toast-stats/issues/725)) ([36b68a3](https://github.com/taverns-red/toast-stats/commit/36b68a3f5a5f6adb44834a750998d982c3779848))
* **clubs-table:** responsive — 640px card collapse + re-skinned cards (epic [#665](https://github.com/taverns-red/toast-stats/issues/665), Sprint 5) ([#732](https://github.com/taverns-red/toast-stats/issues/732)) ([859d7a2](https://github.com/taverns-red/toast-stats/commit/859d7a296c5feca48266e21ff07fcd7b71a072dd))
* **dx:** path-aware pre-commit/pre-push hooks — skip docs/lessons-only ([#720](https://github.com/taverns-red/toast-stats/issues/720)) ([#724](https://github.com/taverns-red/toast-stats/issues/724)) ([5585ffa](https://github.com/taverns-red/toast-stats/commit/5585ffa9dc47201dc2becc1d143e955e19b9fd02))


### Bug Fixes

* **chrome:** theme-toggle icon invisible in light mode ([#700](https://github.com/taverns-red/toast-stats/issues/700)) ([#717](https://github.com/taverns-red/toast-stats/issues/717)) ([120b13f](https://github.com/taverns-red/toast-stats/commit/120b13f6bef91f4bd5f3d235a4a959940b87b0be))


### Documentation

* **lessons:** 108 — verify a sticky header by measuring the sticky cell, not the thead wrapper ([#667](https://github.com/taverns-red/toast-stats/issues/667), [#665](https://github.com/taverns-red/toast-stats/issues/665)) ([#726](https://github.com/taverns-red/toast-stats/issues/726)) ([68fcef2](https://github.com/taverns-red/toast-stats/commit/68fcef2133faded5443c896ea2e9234f6be22966))
* **lessons:** 109 — render-time class guard scopes to resting state, not every state ([#668](https://github.com/taverns-red/toast-stats/issues/668), [#665](https://github.com/taverns-red/toast-stats/issues/665)) ([#728](https://github.com/taverns-red/toast-stats/issues/728)) ([e177921](https://github.com/taverns-red/toast-stats/commit/e177921b97de816a6d4d169a1cd15ee0fa9b0102))
* **lessons:** 110 — jsdom textContent ignores CSS text-transform; live innerText doesn't ([#669](https://github.com/taverns-red/toast-stats/issues/669), [#665](https://github.com/taverns-red/toast-stats/issues/665)) ([#730](https://github.com/taverns-red/toast-stats/issues/730)) ([d60ad76](https://github.com/taverns-red/toast-stats/commit/d60ad76c1954e6e2506a04e85f149c42445d94fd))
* **lessons:** 111 — native &lt;select&gt; ignores min-height in WebKit, breaks 44px touch target ([#671](https://github.com/taverns-red/toast-stats/issues/671), [#665](https://github.com/taverns-red/toast-stats/issues/665)) ([#736](https://github.com/taverns-red/toast-stats/issues/736)) ([4111de2](https://github.com/taverns-red/toast-stats/commit/4111de208548c2fd510bd1bb6c8c7a4e4d77e9fe))


### Tests

* **clubs-table:** a11y + verification pass (epic [#665](https://github.com/taverns-red/toast-stats/issues/665) Sprint 6) ([#672](https://github.com/taverns-red/toast-stats/issues/672)) ([#737](https://github.com/taverns-red/toast-stats/issues/737)) ([259f734](https://github.com/taverns-red/toast-stats/commit/259f734d4ebad19c84d7edfed39ced9ef14fa2d7))

## [2.14.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.13.0...toast-stats-v2.14.0) (2026-05-25)


### Features

* **analytics:** district remaining-to-min-Distinguished as absolute counts ([#686](https://github.com/taverns-red/toast-stats/issues/686)) ([#697](https://github.com/taverns-red/toast-stats/issues/697)) ([3fcc23a](https://github.com/taverns-red/toast-stats/commit/3fcc23aaea5e2b287aaff5806fd82692156b35df))
* **automation:** [#605](https://github.com/taverns-red/toast-stats/issues/605) META_EPIC mode — sprint-runner auto-advances across epics ([55942d8](https://github.com/taverns-red/toast-stats/commit/55942d8cc43a9a6c1543a9df317929629c30b118))
* **automation:** [#625](https://github.com/taverns-red/toast-stats/issues/625) sprint-runner worktree isolation + --gc reconciliation ([61ed040](https://github.com/taverns-red/toast-stats/commit/61ed040903362773d836fe614f11a81199c91423))
* **automation:** [#627](https://github.com/taverns-red/toast-stats/issues/627) sprint-runner cascade — launch next epic's sprint in same tick ([910c7de](https://github.com/taverns-red/toast-stats/commit/910c7defd65396be6f647f9b554a8518eb9cd6a0))
* **club:** [#618](https://github.com/taverns-red/toast-stats/issues/618) Sprint 1 — gradient hero, 8-stat grid, back-link ([#638](https://github.com/taverns-red/toast-stats/issues/638)) ([f397956](https://github.com/taverns-red/toast-stats/commit/f3979565eaaadfb9451a05b65996226d911270c6))
* **club:** [#619](https://github.com/taverns-red/toast-stats/issues/619) Sprint 2 — Membership Trend chart + DCP Status panel (2/3 + 1/3) ([#641](https://github.com/taverns-red/toast-stats/issues/641)) ([1a24bc7](https://github.com/taverns-red/toast-stats/commit/1a24bc7d10e0a9598991f635102acbe8452ef4ac))
* **club:** [#620](https://github.com/taverns-red/toast-stats/issues/620) Close-to-Distinguished callout reposition + DCP Goals Progress panel ([#642](https://github.com/taverns-red/toast-stats/issues/642)) ([2baf744](https://github.com/taverns-red/toast-stats/commit/2baf744eb626d19039b9901431014715d1addb5b))
* **club:** [#621](https://github.com/taverns-red/toast-stats/issues/621) Sprint 4 — Goal Achievement Timeline ([#643](https://github.com/taverns-red/toast-stats/issues/643)) ([62f8309](https://github.com/taverns-red/toast-stats/commit/62f830986629796c63d194f246774c9acefe9597))
* **district-ia:** back-to-district breadcrumb on every routed sub-page ([#577](https://github.com/taverns-red/toast-stats/issues/577)) ([#622](https://github.com/taverns-red/toast-stats/issues/622)) ([f6dedb3](https://github.com/taverns-red/toast-stats/commit/f6dedb30fe640bb6699a77574deb515d5404e7fb))
* **region:** table base → current → Δ column model (epic [#683](https://github.com/taverns-red/toast-stats/issues/683), Sprint 4) ([#698](https://github.com/taverns-red/toast-stats/issues/698)) ([caa8feb](https://github.com/taverns-red/toast-stats/commit/caa8febcdff2af8b673b6038855f5efb01eeb6c0))
* **region:** three Distinguished-remaining columns, absolute not % (epic [#683](https://github.com/taverns-red/toast-stats/issues/683), Sprint 5) ([#688](https://github.com/taverns-red/toast-stats/issues/688)) ([#702](https://github.com/taverns-red/toast-stats/issues/702)) ([7691f8f](https://github.com/taverns-red/toast-stats/commit/7691f8f0f0b31245124a0dbbb30919dd0f619851))
* **test-infra:** split vitest into unit + integration projects, restore pre-push gate ([#482](https://github.com/taverns-red/toast-stats/issues/482)) ([#635](https://github.com/taverns-red/toast-stats/issues/635)) ([7f49558](https://github.com/taverns-red/toast-stats/commit/7f4955846456b423b0abd11415c24ca49675afe6))


### Bug Fixes

* **a11y:** [#611](https://github.com/taverns-red/toast-stats/issues/611) Methodology / History / Landing dark-mode sweep (Track D final) ([#655](https://github.com/taverns-red/toast-stats/issues/655)) ([5cc19da](https://github.com/taverns-red/toast-stats/commit/5cc19dac1c271fc6cb08fcbdc475563f1e3a5c27))
* **automation:** [#623](https://github.com/taverns-red/toast-stats/issues/623) relax sprint-runner post-launch verify (retry + warn-not-die) ([f14977d](https://github.com/taverns-red/toast-stats/commit/f14977d01d8bfb208d2398bff0d6dcd6695290d1))
* **automation:** [#626](https://github.com/taverns-red/toast-stats/issues/626) close-then-tick race — reorder bootstrap + strengthen runner heuristic ([5dc906e](https://github.com/taverns-red/toast-stats/commit/5dc906e53aa8a4e3a65f49a8a96d76490c270126))
* **automation:** [#630](https://github.com/taverns-red/toast-stats/issues/630) issue-number-keyed identifiers + [#631](https://github.com/taverns-red/toast-stats/issues/631) worktree stdout capture ([9c712ce](https://github.com/taverns-red/toast-stats/commit/9c712cea31cba4310370e2312d7b92dff8d30786))
* **automation:** [#633](https://github.com/taverns-red/toast-stats/issues/633) + [#634](https://github.com/taverns-red/toast-stats/issues/634) — pgrep instead of `screen -ls | grep` (pipefail bug) ([4468b79](https://github.com/taverns-red/toast-stats/commit/4468b79e0daa5193d701c12252fa7c7e2818bd21))
* **automation:** [#636](https://github.com/taverns-red/toast-stats/issues/636) bootstrap prompt now auto-closes completed epics ([c482e21](https://github.com/taverns-red/toast-stats/commit/c482e2171e2ed233822a985ee50e3827cfb4010f))
* **automation:** [#637](https://github.com/taverns-red/toast-stats/issues/637) find_sprint_line_by_issue must end with `|| true` (set -e silent crash) ([e1a267a](https://github.com/taverns-red/toast-stats/commit/e1a267a4831737b802967d9e44711e13a25ba76d))
* **automation:** [#645](https://github.com/taverns-red/toast-stats/issues/645) bootstrap prompt — require workspace-package rebuild after source edits ([65ea08b](https://github.com/taverns-red/toast-stats/commit/65ea08b15e3481d24c4374ae5a2313479efe7982))
* **automation:** correct Remote Control name in 'Launched' log line ([bd12770](https://github.com/taverns-red/toast-stats/commit/bd12770cf46adca9d1e7ce21c0e6838f71bea60b))
* **awards:** [#608](https://github.com/taverns-red/toast-stats/issues/608) Awards section dark-mode contrast sweep ([#646](https://github.com/taverns-red/toast-stats/issues/646)) ([7b749c4](https://github.com/taverns-red/toast-stats/commit/7b749c47ed18e6a9ddb0d5b4ebcc7b60aaa6f46e))
* **club:** [#610](https://github.com/taverns-red/toast-stats/issues/610) ClubDetailPage dark-mode contrast sweep ([#654](https://github.com/taverns-red/toast-stats/issues/654)) ([f1b8090](https://github.com/taverns-red/toast-stats/commit/f1b8090c78455b3daa8a44d3d7a339baa57464ad))
* **club:** [#618](https://github.com/taverns-red/toast-stats/issues/618) pin hero pill text to AA-safe literals on the white pill ([#639](https://github.com/taverns-red/toast-stats/issues/639)) ([1dac46c](https://github.com/taverns-red/toast-stats/commit/1dac46c174ec26d17cb1083aff9faf7635d82546))
* **infra:** [#580](https://github.com/taverns-red/toast-stats/issues/580) staging bucket CORS to unblock PR preview channels ([#658](https://github.com/taverns-red/toast-stats/issues/658)) ([eb819ad](https://github.com/taverns-red/toast-stats/commit/eb819ade0a41d98f255936240da207ec13cd0954))
* **region:** /regions leaderboard invisible when OS=dark + app=light (epic [#683](https://github.com/taverns-red/toast-stats/issues/683), Sprint 8) ([#716](https://github.com/taverns-red/toast-stats/issues/716)) ([9a5a5b3](https://github.com/taverns-red/toast-stats/commit/9a5a5b36428873f86327e9fe5c1658896d61a168))
* **region:** district chip dark-mode contrast (epic [#683](https://github.com/taverns-red/toast-stats/issues/683), Sprint 7) ([#699](https://github.com/taverns-red/toast-stats/issues/699)) ([#714](https://github.com/taverns-red/toast-stats/issues/714)) ([231b879](https://github.com/taverns-red/toast-stats/commit/231b879cbacea83664d376c65b7f344cd6f8b91a))
* **region:** Net Club Growth shows signed net change, not distinguished-gap ([#684](https://github.com/taverns-red/toast-stats/issues/684)) ([#695](https://github.com/taverns-red/toast-stats/issues/695)) ([0f5e859](https://github.com/taverns-red/toast-stats/commit/0f5e859d688f83119d4c00906185684c65ba7fd1))
* **regions:** [#609](https://github.com/taverns-red/toast-stats/issues/609) Region pages dark-mode contrast sweep ([#652](https://github.com/taverns-red/toast-stats/issues/652)) ([37a96ee](https://github.com/taverns-red/toast-stats/commit/37a96ee2de31e349ced94549fb9b26895222a507))
* **regions:** index findability — jump-to-region finder + dark focus/hover contrast (epic [#683](https://github.com/taverns-red/toast-stats/issues/683)) ([#696](https://github.com/taverns-red/toast-stats/issues/696)) ([2fab238](https://github.com/taverns-red/toast-stats/commit/2fab238338b93430f99d2d95cd82d721b5aeee7d))


### Documentation

* CI/CD flow diagram + ADR-004 release-gated deployment (draft) ([#709](https://github.com/taverns-red/toast-stats/issues/709), [#707](https://github.com/taverns-red/toast-stats/issues/707)) ([#711](https://github.com/taverns-red/toast-stats/issues/711)) ([692475e](https://github.com/taverns-red/toast-stats/commit/692475e16587fe8e6ae0b619346024a0a677b252))
* **design:** [#617](https://github.com/taverns-red/toast-stats/issues/617) stash Club redesign handoff (Toast Stats v3.4) ([2565d93](https://github.com/taverns-red/toast-stats/commit/2565d939be4f0de7dbd40e6912d3dd7e004590af))
* interactive deep-dive diagram of the spawned Claude session ([79028b3](https://github.com/taverns-red/toast-stats/commit/79028b34c06efdeaf0b5d326e37bc5e1839a1e3c))
* interactive HTML diagram of the sprint runner automation ([d93ef8e](https://github.com/taverns-red/toast-stats/commit/d93ef8e013e5f360d459d58943c265d506883198))
* **lessons:** [#577](https://github.com/taverns-red/toast-stats/issues/577) verify-only relaunch lands on already-merged work ([#624](https://github.com/taverns-red/toast-stats/issues/624)) ([e11e21e](https://github.com/taverns-red/toast-stats/commit/e11e21e57641f99bf57a7f68650bac108d66812e))
* **lessons:** [#609](https://github.com/taverns-red/toast-stats/issues/609) lesson 094 — dark utilities fail by fg/bg remap asymmetry ([#653](https://github.com/taverns-red/toast-stats/issues/653)) ([cc9b7e0](https://github.com/taverns-red/toast-stats/commit/cc9b7e006f85802c05ca94c3b2e4f67f7297d0e0))
* **lessons:** [#614](https://github.com/taverns-red/toast-stats/issues/614) capture ESLint 10 @eslint/js unbundling lesson (101) ([ad95bbd](https://github.com/taverns-red/toast-stats/commit/ad95bbd44c4ba393d5a715d0ae14480a8591bd4a))
* **lessons:** [#618](https://github.com/taverns-red/toast-stats/issues/618) lesson 092 — fixed-bg elements need literal colours ([#640](https://github.com/taverns-red/toast-stats/issues/640)) ([b9c510b](https://github.com/taverns-red/toast-stats/commit/b9c510bea2270903419578925152f4f5a3a99637))
* **lessons:** [#621](https://github.com/taverns-red/toast-stats/issues/621) ticket helper signatures bend to the real data shape ([#644](https://github.com/taverns-red/toast-stats/issues/644)) ([52d6b97](https://github.com/taverns-red/toast-stats/commit/52d6b9712f941883e40aeaa86d537826dc517afe))
* **lessons:** [#634](https://github.com/taverns-red/toast-stats/issues/634) lesson 089 — pipefail + screen -ls exit 1 was the real cause ([beb4cbc](https://github.com/taverns-red/toast-stats/commit/beb4cbc6fae78ccc16ff97425f1b2a493c25856b))
* **lessons:** [#645](https://github.com/taverns-red/toast-stats/issues/645) lesson 092 — workspace-package dist gitignored, no auto-rebuild ([86b0102](https://github.com/taverns-red/toast-stats/commit/86b010266b4dbd360aa9f0c6699762a98fed8b35))
* **lessons:** [#651](https://github.com/taverns-red/toast-stats/issues/651) Sprint 0 — audit & categorize full lesson corpus ([#656](https://github.com/taverns-red/toast-stats/issues/656)) ([6eb2304](https://github.com/taverns-red/toast-stats/commit/6eb23044adfc061f7a9f6a53128a5e1d13327d8a))
* **lessons:** 106 — Closes #N auto-close defeats tick-before-close ordering ([#689](https://github.com/taverns-red/toast-stats/issues/689), [#626](https://github.com/taverns-red/toast-stats/issues/626)) ([454e2ad](https://github.com/taverns-red/toast-stats/commit/454e2ad7dfe35b7dde5be38f0ecaf3d291033d17))
* planning artifacts for region/district/clubs epics + gitignore scratch ([#665](https://github.com/taverns-red/toast-stats/issues/665), [#674](https://github.com/taverns-red/toast-stats/issues/674), [#683](https://github.com/taverns-red/toast-stats/issues/683)) ([#692](https://github.com/taverns-red/toast-stats/issues/692)) ([6ae6c36](https://github.com/taverns-red/toast-stats/commit/6ae6c369eecb2849e73f5e796f0964bfbd137b82))

## [2.13.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.12.0...toast-stats-v2.13.0) (2026-05-23)


### Features

* **a11y:** tablist arrow-key navigation + tabpanel linkage ([#384](https://github.com/taverns-red/toast-stats/issues/384)) ([#476](https://github.com/taverns-red/toast-stats/issues/476)) ([dfc06f0](https://github.com/taverns-red/toast-stats/commit/dfc06f0e32f70a3a116b206477762cfabbba6e7a))
* **anniversary:** hero badge + clubs-table Years column ([#445](https://github.com/taverns-red/toast-stats/issues/445) [#448](https://github.com/taverns-red/toast-stats/issues/448) [#443](https://github.com/taverns-red/toast-stats/issues/443)) ([#506](https://github.com/taverns-red/toast-stats/issues/506)) ([0f9b45b](https://github.com/taverns-red/toast-stats/commit/0f9b45b8c2ca22d49ac0bb30ed8a999ea265486d))
* **app-shell:** move ThemeToggle from footer to header ([#565](https://github.com/taverns-red/toast-stats/issues/565)) ([#566](https://github.com/taverns-red/toast-stats/issues/566)) ([175ade1](https://github.com/taverns-red/toast-stats/commit/175ade185a8faff0d1aa0dc3ade6d80bd8080261))
* **awards-race:** add progress bars + threshold sub-line per design ([#357](https://github.com/taverns-red/toast-stats/issues/357)) ([#404](https://github.com/taverns-red/toast-stats/issues/404)) ([e9de6a3](https://github.com/taverns-red/toast-stats/commit/e9de6a371dcd001eed8f0c45b190d7e22cac31d8))
* **awards-race:** wrap 3 cards in single bordered panel + timestamp meta ([#406](https://github.com/taverns-red/toast-stats/issues/406)) ([75046f7](https://github.com/taverns-red/toast-stats/commit/75046f7eee4c9f3596a0b426173249a58b628887))
* **brand:** [#339](https://github.com/taverns-red/toast-stats/issues/339) adopt Red Taverns Brand v1.0 tokens — Phase 1 (additive) ([#595](https://github.com/taverns-red/toast-stats/issues/595)) ([ab3d83a](https://github.com/taverns-red/toast-stats/commit/ab3d83ac1aab21bcc4404bd2eaa9852436b138b5))
* **ci:** per-PR Firebase Hosting preview channels ([#554](https://github.com/taverns-red/toast-stats/issues/554)) ([#561](https://github.com/taverns-red/toast-stats/issues/561)) ([bb79395](https://github.com/taverns-red/toast-stats/commit/bb79395346770649e72555bc70a017c0e4679252))
* **close-to-distinguished:** tighten threshold to ≤4 + unify across views ([#433](https://github.com/taverns-red/toast-stats/issues/433)) ([#441](https://github.com/taverns-red/toast-stats/issues/441)) ([c8190f4](https://github.com/taverns-red/toast-stats/commit/c8190f4022a8359f8c0e9dbf0a2c93c6658f7689))
* **clubs-table:** status segmented filter with counts ([#361](https://github.com/taverns-red/toast-stats/issues/361)) ([#470](https://github.com/taverns-red/toast-stats/issues/470)) ([4bc8e39](https://github.com/taverns-red/toast-stats/commit/4bc8e3945c66d8ba2fae4b5353a8283310a87412))
* **collector:** fetch-find-a-club CLI command ([#430](https://github.com/taverns-red/toast-stats/issues/430)) ([#484](https://github.com/taverns-red/toast-stats/issues/484)) ([3d1e7bc](https://github.com/taverns-red/toast-stats/commit/3d1e7bcc0c9d3a7a34ca474055440ae1a32c7832))
* **collector:** FindAClubMerger + pipeline wiring ([#429](https://github.com/taverns-red/toast-stats/issues/429)) ([#491](https://github.com/taverns-red/toast-stats/issues/491)) ([366dad3](https://github.com/taverns-red/toast-stats/commit/366dad31d9934af5bbdd84f6453bebef97b7563b))
* **components:** RegionsLeaderboard + RegionGrid — Sprint B of /regions epic ([#494](https://github.com/taverns-red/toast-stats/issues/494) [#495](https://github.com/taverns-red/toast-stats/issues/495) [#492](https://github.com/taverns-red/toast-stats/issues/492)) ([#499](https://github.com/taverns-red/toast-stats/issues/499)) ([66d1872](https://github.com/taverns-red/toast-stats/commit/66d18720d2625fa7da4bcbdbd5955d08aae13f96))
* **comprehension:** rename Methodology→How it works, wire help icon, add KPI/Awards-Race tooltips ([#412](https://github.com/taverns-red/toast-stats/issues/412) [#410](https://github.com/taverns-red/toast-stats/issues/410) [#413](https://github.com/taverns-red/toast-stats/issues/413)) ([#457](https://github.com/taverns-red/toast-stats/issues/457)) ([6c0a189](https://github.com/taverns-red/toast-stats/commit/6c0a18959ae3c05c9ffddc2fe0081c9f1c473e24))
* **district-clubs:** [#489](https://github.com/taverns-red/toast-stats/issues/489) surface FAC-only clubs (ATOs / prospective) ([#594](https://github.com/taverns-red/toast-stats/issues/594)) ([d076fba](https://github.com/taverns-red/toast-stats/commit/d076fba705466ce3dd4765eecd32c8e2cd209a51))
* **district-detail:** tighten Distinguished Status panel + collapse empty notable-dates cards ([#551](https://github.com/taverns-red/toast-stats/issues/551)) ([#553](https://github.com/taverns-red/toast-stats/issues/553)) ([9cfbbad](https://github.com/taverns-red/toast-stats/commit/9cfbbadff9f692106314acb76cb5d48f014d1ec5))
* **district-overview:** Distinguished Composition stack-bar ([#360](https://github.com/taverns-red/toast-stats/issues/360) slice 2) ([#466](https://github.com/taverns-red/toast-stats/issues/466)) ([94ec825](https://github.com/taverns-red/toast-stats/commit/94ec8258663c0a75199f191bda2ba3c59d660919))
* **district-overview:** Payment Composition donut ([#360](https://github.com/taverns-red/toast-stats/issues/360) slice 3) ([#467](https://github.com/taverns-red/toast-stats/issues/467)) ([ea917b8](https://github.com/taverns-red/toast-stats/commit/ea917b877767a26970e4b2f7ed0049b7bba9c6b5))
* **district-overview:** top-right rank badge on KPI cards ([#360](https://github.com/taverns-red/toast-stats/issues/360)) ([#465](https://github.com/taverns-red/toast-stats/issues/465)) ([5ddb49c](https://github.com/taverns-red/toast-stats/commit/5ddb49c34b944c97406d9479da864696e2847a0c))
* **district-overview:** wire all 5 payment types in donut ([#360](https://github.com/taverns-red/toast-stats/issues/360)) ([#469](https://github.com/taverns-red/toast-stats/issues/469)) ([16be673](https://github.com/taverns-red/toast-stats/commit/16be6734badd7b8c1894779cdb4d4fe112e259ed))
* **district-status:** concrete units + reorder + drop net in gap tiles ([#555](https://github.com/taverns-red/toast-stats/issues/555), [#556](https://github.com/taverns-red/toast-stats/issues/556)) ([#560](https://github.com/taverns-red/toast-stats/issues/560)) ([921d427](https://github.com/taverns-red/toast-stats/commit/921d4274d457b3451888ae69c2421e9e67f12de1))
* **district-tabs:** discoverability — bigger, bolder, hover preview ([#437](https://github.com/taverns-red/toast-stats/issues/437)) ([#453](https://github.com/taverns-red/toast-stats/issues/453)) ([fac3695](https://github.com/taverns-red/toast-stats/commit/fac3695373fe6189960068c8c08176604626184a))
* **district:** [#449](https://github.com/taverns-red/toast-stats/issues/449) longest-serving clubs leaderboard ([#593](https://github.com/taverns-red/toast-stats/issues/593)) ([7eb021f](https://github.com/taverns-red/toast-stats/commit/7eb021f202d6ea9709649fa7d75c6a0a3fa8a335))
* **district:** /district/:id/division/:divId + .../area/:areaId pages ([#424](https://github.com/taverns-red/toast-stats/issues/424) [#425](https://github.com/taverns-red/toast-stats/issues/425)) ([#464](https://github.com/taverns-red/toast-stats/issues/464)) ([c87f2eb](https://github.com/taverns-red/toast-stats/commit/c87f2eb91ffeb62a8fe8c283c87e7e21da126b85))
* **district:** Education Levels rollup on Analytics tab ([#426](https://github.com/taverns-red/toast-stats/issues/426)) ([#481](https://github.com/taverns-red/toast-stats/issues/481)) ([3376dc9](https://github.com/taverns-red/toast-stats/commit/3376dc9693feb654740f9f220dbcb7827760f71f))
* **district:** IA Phase 1 — stack Overview/Trends/Analytics into scrollable narrative ([#569](https://github.com/taverns-red/toast-stats/issues/569)) ([#573](https://github.com/taverns-red/toast-stats/issues/573)) ([29cb3dc](https://github.com/taverns-red/toast-stats/commit/29cb3dc240e4fd9a686663526450125e0e5e1a04))
* **district:** IA Phase 2 — /district/:id/clubs route with URL-param filter state ([#570](https://github.com/taverns-red/toast-stats/issues/570)) ([#576](https://github.com/taverns-red/toast-stats/issues/576)) ([970be3e](https://github.com/taverns-red/toast-stats/commit/970be3e774283ae34fa2ea31cc3de00eeca438dc))
* **district:** IA Phase 3 — route Divisions/Rankings + retire tab strip ([#571](https://github.com/taverns-red/toast-stats/issues/571)) ([#578](https://github.com/taverns-red/toast-stats/issues/578)) ([c71354b](https://github.com/taverns-red/toast-stats/commit/c71354bbdc1bc0f1b20a4c272feb25ffe2599364))
* **district:** IA Phase 4 — sticky KPI strip + anchor TOC + smooth scroll ([#572](https://github.com/taverns-red/toast-stats/issues/572)) ([#579](https://github.com/taverns-red/toast-stats/issues/579)) ([653d7bb](https://github.com/taverns-red/toast-stats/commit/653d7bbf05a70e9633d4c7006a825fb38712fd1d))
* **districts:** add Export CSV + Share buttons to action cluster ([#357](https://github.com/taverns-red/toast-stats/issues/357)) ([#405](https://github.com/taverns-red/toast-stats/issues/405)) ([64b99e8](https://github.com/taverns-red/toast-stats/commit/64b99e863f96fd7a2bda566ee79e24b5302dde85))
* **districts:** DDP tier chip + row density on rankings page ([#546](https://github.com/taverns-red/toast-stats/issues/546)) ([#549](https://github.com/taverns-red/toast-stats/issues/549)) ([e538da4](https://github.com/taverns-red/toast-stats/commit/e538da4fb5c4cd791ab918bef73f8542fe22c1b2))
* **districts:** District Search prominence — '/' shortcut + type-ahead + hero styling ([#435](https://github.com/taverns-red/toast-stats/issues/435)) ([#451](https://github.com/taverns-red/toast-stats/issues/451)) ([475912d](https://github.com/taverns-red/toast-stats/commit/475912d26893fd7f2c71c4fc5724eb175722e33d))
* **districts:** localStorage primitive + my-district sticky pin ([#420](https://github.com/taverns-red/toast-stats/issues/420) [#417](https://github.com/taverns-red/toast-stats/issues/417)) ([#458](https://github.com/taverns-red/toast-stats/issues/458)) ([01ba0c9](https://github.com/taverns-red/toast-stats/commit/01ba0c928bf8a4e930b434e6e834df8342274a7b))
* **districts:** orientation strip below lede ([#415](https://github.com/taverns-red/toast-stats/issues/415)) ([#459](https://github.com/taverns-red/toast-stats/issues/459)) ([24017ae](https://github.com/taverns-red/toast-stats/commit/24017aeb31da8781b34345cc9c612f8b69f81358))
* **districts:** persist sort/regions + 'what changed since last visit' diff strip ([#416](https://github.com/taverns-red/toast-stats/issues/416) [#418](https://github.com/taverns-red/toast-stats/issues/418)) ([#461](https://github.com/taverns-red/toast-stats/issues/461)) ([8f48f47](https://github.com/taverns-red/toast-stats/commit/8f48f47fab56b670543258200d05844b75e3790d))
* **districts:** rankings table — District first + standalone number chip ([#436](https://github.com/taverns-red/toast-stats/issues/436)) ([#452](https://github.com/taverns-red/toast-stats/issues/452)) ([65c669d](https://github.com/taverns-red/toast-stats/commit/65c669da3800a4c5d8ba4807d49c6ad8c8ca7927))
* **districts:** region filter — solo-select + state badge ([#434](https://github.com/taverns-red/toast-stats/issues/434)) ([#450](https://github.com/taverns-red/toast-stats/issues/450)) ([c1c5168](https://github.com/taverns-red/toast-stats/commit/c1c5168ad9005c42cd80f6e34b97de96f1b553ec))
* **district:** Total Members KPI card on District Detail ([#428](https://github.com/taverns-red/toast-stats/issues/428)) ([#460](https://github.com/taverns-red/toast-stats/issues/460)) ([29e36af](https://github.com/taverns-red/toast-stats/commit/29e36aff34773b09753f6be967e427809c62c8ce))
* **district:** upcoming anniversaries panel + milestones callout ([#446](https://github.com/taverns-red/toast-stats/issues/446) [#447](https://github.com/taverns-red/toast-stats/issues/447) [#443](https://github.com/taverns-red/toast-stats/issues/443)) ([#507](https://github.com/taverns-red/toast-stats/issues/507)) ([71d2dbb](https://github.com/taverns-red/toast-stats/commit/71d2dbbad5624458cf6a49d240228a967d8851da))
* **divisions:** Distinguished Program criteria explainer ([#362](https://github.com/taverns-red/toast-stats/issues/362) Divisions & Areas redesign) ([#471](https://github.com/taverns-red/toast-stats/issues/471)) ([f5b087c](https://github.com/taverns-red/toast-stats/commit/f5b087c83775f257d1f5458a826e2a9557fd0dc6))
* **find-a-club:** schema bump + Club hero CHARTERED + disable pre-push ([#429](https://github.com/taverns-red/toast-stats/issues/429) [#431](https://github.com/taverns-red/toast-stats/issues/431) [#432](https://github.com/taverns-red/toast-stats/issues/432)) ([#483](https://github.com/taverns-red/toast-stats/issues/483)) ([ca573cd](https://github.com/taverns-red/toast-stats/commit/ca573cd9f457a9a6f3e4954c7f932bf1a3d26531))
* **membership-trend:** GREEN — methodology surfacing on chart + /methodology section ([#438](https://github.com/taverns-red/toast-stats/issues/438)) ([#454](https://github.com/taverns-red/toast-stats/issues/454)) ([8b7e64f](https://github.com/taverns-red/toast-stats/commit/8b7e64fc40cde0a92415d60112add411c8e726d8))
* **overview:** District Overview KPI redesign — bullet bars + lean 3-card layout ([#550](https://github.com/taverns-red/toast-stats/issues/550)) ([#552](https://github.com/taverns-red/toast-stats/issues/552)) ([03615a2](https://github.com/taverns-red/toast-stats/commit/03615a2e65dd756791c32f510b8f576d11f77fee))
* **page+shell:** /regions page + enable Regions nav — Sprint C of /regions epic ([#496](https://github.com/taverns-red/toast-stats/issues/496) [#497](https://github.com/taverns-red/toast-stats/issues/497) [#492](https://github.com/taverns-red/toast-stats/issues/492)) ([#500](https://github.com/taverns-red/toast-stats/issues/500)) ([75a9be4](https://github.com/taverns-red/toast-stats/commit/75a9be472a1ced639ec04c5404dca880b3b21d11))
* **pipeline:** wire fetch-find-a-club into daily-pipeline.yml ([#429](https://github.com/taverns-red/toast-stats/issues/429)) ([#485](https://github.com/taverns-red/toast-stats/issues/485)) ([f6e32a5](https://github.com/taverns-red/toast-stats/commit/f6e32a52644f1cee13c28d528edd041941bb76c8))
* **print:** print stylesheet for clean board-meeting handouts ([#427](https://github.com/taverns-red/toast-stats/issues/427)) ([#477](https://github.com/taverns-red/toast-stats/issues/477)) ([cbb01db](https://github.com/taverns-red/toast-stats/commit/cbb01db5c4a4cd39262581a5af2d7b9c7d0f12cd))
* **region:** /region/:n landing page ([#423](https://github.com/taverns-red/toast-stats/issues/423)) ([#463](https://github.com/taverns-red/toast-stats/issues/463)) ([6bb558b](https://github.com/taverns-red/toast-stats/commit/6bb558b664b0dadc4caaabc7d8c2f2b9961aabf6))
* **region:** Club Growth % column + CGD officer-award rename ([#534](https://github.com/taverns-red/toast-stats/issues/534)) ([#540](https://github.com/taverns-red/toast-stats/issues/540)) ([98c8abf](https://github.com/taverns-red/toast-stats/commit/98c8abfa756b1ae33b3675afc821eefa6a438fe6))
* **region:** Distinguished countdown + Tier columns — closes Epic [#513](https://github.com/taverns-red/toast-stats/issues/513) ([#516](https://github.com/taverns-red/toast-stats/issues/516) [#517](https://github.com/taverns-red/toast-stats/issues/517)) ([#535](https://github.com/taverns-red/toast-stats/issues/535)) ([2aceb41](https://github.com/taverns-red/toast-stats/commit/2aceb4188312fdbdda7b4570bda44c5beaf29ed8))
* **region:** rollup KPIs + rank column + linkified chip — Sprint A of epic [#513](https://github.com/taverns-red/toast-stats/issues/513) ([#514](https://github.com/taverns-red/toast-stats/issues/514) [#515](https://github.com/taverns-red/toast-stats/issues/515) [#518](https://github.com/taverns-red/toast-stats/issues/518)) ([#526](https://github.com/taverns-red/toast-stats/issues/526)) ([49a6214](https://github.com/taverns-red/toast-stats/commit/49a6214ef337e039b3a127d5bb90e1f01febbbd7))
* **shell:** universal search palette opened with Cmd-K / Ctrl-K ([#422](https://github.com/taverns-red/toast-stats/issues/422)) ([#462](https://github.com/taverns-red/toast-stats/issues/462)) ([44f4877](https://github.com/taverns-red/toast-stats/commit/44f4877af850236dd30cab7370b4fe1198875199))
* **ui:** unified DataControlsBar across DistrictsPage + DistrictDetailPage ([#528](https://github.com/taverns-red/toast-stats/issues/528) [#529](https://github.com/taverns-red/toast-stats/issues/529) [#530](https://github.com/taverns-red/toast-stats/issues/530) [#531](https://github.com/taverns-red/toast-stats/issues/531)) ([#532](https://github.com/taverns-red/toast-stats/issues/532)) ([a7e5543](https://github.com/taverns-red/toast-stats/commit/a7e554313964d40644777e16706b055e359c2b48))
* **util:** aggregateRegions — Sprint A of /regions epic ([#493](https://github.com/taverns-red/toast-stats/issues/493), [#492](https://github.com/taverns-red/toast-stats/issues/492)) ([#498](https://github.com/taverns-red/toast-stats/issues/498)) ([668df67](https://github.com/taverns-red/toast-stats/commit/668df678f1433b7245f016bb9ecf26426befa002))
* **util:** getClubAnniversary — Sprint A of anniversaries epic ([#444](https://github.com/taverns-red/toast-stats/issues/444) [#443](https://github.com/taverns-red/toast-stats/issues/443)) ([#505](https://github.com/taverns-red/toast-stats/issues/505)) ([cad79c4](https://github.com/taverns-red/toast-stats/commit/cad79c4c504e2ec894f2b54d9bf732dbd49f5863))


### Bug Fixes

* **analytics:** % Distinguished uses Paid Club Base per TI DDP rule ([#537](https://github.com/taverns-red/toast-stats/issues/537)) ([#538](https://github.com/taverns-red/toast-stats/issues/538)) ([b7fa477](https://github.com/taverns-red/toast-stats/commit/b7fa47773b8155965199350d787d56b21bd32e45))
* **anniversary:** every multiple of 5 is a milestone, unbounded ([#509](https://github.com/taverns-red/toast-stats/issues/509)) ([#510](https://github.com/taverns-red/toast-stats/issues/510)) ([5bdf7f5](https://github.com/taverns-red/toast-stats/commit/5bdf7f501ed7c1088a03712a3c4c979024dd2f12))
* **anniversary:** tighter, denser layout per design handoff ([#511](https://github.com/taverns-red/toast-stats/issues/511)) ([#512](https://github.com/taverns-red/toast-stats/issues/512)) ([eb4086b](https://github.com/taverns-red/toast-stats/commit/eb4086bee8d8e852cc520275dabf0e74e4de612e))
* **breadcrumbs:** drop redundant top-level crumb on district + club detail ([#442](https://github.com/taverns-red/toast-stats/issues/442)) ([#455](https://github.com/taverns-red/toast-stats/issues/455)) ([5184313](https://github.com/taverns-red/toast-stats/commit/5184313932ba274577af645ad2dcc89ed292bf42))
* **collector-cli:** %Distinguished uses Paid Club Base ([#545](https://github.com/taverns-red/toast-stats/issues/545)) ([#548](https://github.com/taverns-red/toast-stats/issues/548)) ([861d80b](https://github.com/taverns-red/toast-stats/commit/861d80b2712d953dfb35782b14dfb1b967517c61))
* **css:** tailwind preflight was overriding every brand class — split layers ([#403](https://github.com/taverns-red/toast-stats/issues/403)) ([00ae821](https://github.com/taverns-red/toast-stats/commit/00ae821bbef9597f433b3388f3771b9e4ca3e414))
* **district-overview:** payment donut denominator is payments, not members ([#360](https://github.com/taverns-red/toast-stats/issues/360)) ([#468](https://github.com/taverns-red/toast-stats/issues/468)) ([f4aaa69](https://github.com/taverns-red/toast-stats/commit/f4aaa69afb89ce1dc2c087334df2b8fe8001b7e8))
* **district:** rename "District Recognition" → "Distinguished District Status" ([#358](https://github.com/taverns-red/toast-stats/issues/358)) ([#408](https://github.com/taverns-red/toast-stats/issues/408)) ([2ee1ef3](https://github.com/taverns-red/toast-stats/commit/2ee1ef3e2354cea57e0a1730820bf158b9b89754))
* **districts:** drop Analytics chip + redundant district number, no-op [#521](https://github.com/taverns-red/toast-stats/issues/521) ([#519](https://github.com/taverns-red/toast-stats/issues/519) [#520](https://github.com/taverns-red/toast-stats/issues/520) [#521](https://github.com/taverns-red/toast-stats/issues/521)) ([#523](https://github.com/taverns-red/toast-stats/issues/523)) ([4ae84a3](https://github.com/taverns-red/toast-stats/commit/4ae84a317352bd90f4f1f5d43fcc519f9611373c))
* **fac:** propagate FAC enrichment through ClubTrend so CHARTERED actually renders ([#503](https://github.com/taverns-red/toast-stats/issues/503)) ([#504](https://github.com/taverns-red/toast-stats/issues/504)) ([3c4a96c](https://github.com/taverns-red/toast-stats/commit/3c4a96c56795cdd97b5b293d559225669bd478cc))
* **hooks:** 5 setState-in-effect violations → render-phase sync ([#340](https://github.com/taverns-red/toast-stats/issues/340)) ([#475](https://github.com/taverns-red/toast-stats/issues/475)) ([70eabce](https://github.com/taverns-red/toast-stats/commit/70eabcea5fe92b596c99296e18e807070734d7ce))
* **methodology:** correct DCP tier definitions + club health classifications ([#439](https://github.com/taverns-red/toast-stats/issues/439), [#440](https://github.com/taverns-red/toast-stats/issues/440)) ([#456](https://github.com/taverns-red/toast-stats/issues/456)) ([a46fb00](https://github.com/taverns-red/toast-stats/commit/a46fb00ffd069e501a5e988658cde3d0453507a9))
* **overview:** bullet-bar zoom scale + region rank inline restyle ([#557](https://github.com/taverns-red/toast-stats/issues/557), [#558](https://github.com/taverns-red/toast-stats/issues/558)) ([#559](https://github.com/taverns-red/toast-stats/issues/559)) ([7d3176f](https://github.com/taverns-red/toast-stats/commit/7d3176fcbb82d8a319a6e28a0253e743d0e9689b))
* **overview:** tier-tick positioning — hotfix [#559](https://github.com/taverns-red/toast-stats/issues/559) visual regression ([#562](https://github.com/taverns-red/toast-stats/issues/562)) ([3a95f32](https://github.com/taverns-red/toast-stats/commit/3a95f32f699eb3e1bf9f8520fc0ce52e417ab6fd))
* **perf:** [#488](https://github.com/taverns-red/toast-stats/issues/488) short-circuit LazyComparisonPanel — drops CLS 0.217 → 0.01 ([#590](https://github.com/taverns-red/toast-stats/issues/590)) ([f2aa04c](https://github.com/taverns-red/toast-stats/commit/f2aa04c42e5da34fabc807a1f6ba1a28b1929cc9))
* **regions:** Borda-count region scoring + /methodology section ([#501](https://github.com/taverns-red/toast-stats/issues/501)) ([#502](https://github.com/taverns-red/toast-stats/issues/502)) ([06434c8](https://github.com/taverns-red/toast-stats/commit/06434c846f6a14774ad1847400d6decb492560a4))
* **theme:** [#564](https://github.com/taverns-red/toast-stats/issues/564) Phase 2 — opacity-variant dark-mode sweep + inert bg-amber-50/N fix ([#581](https://github.com/taverns-red/toast-stats/issues/581)) ([38720bd](https://github.com/taverns-red/toast-stats/commit/38720bd49dafdfb53c9ed38b270dc96c4c655c92))
* **theme:** [#564](https://github.com/taverns-red/toast-stats/issues/564) Phase 3 — light-mode small-text tightening ([#582](https://github.com/taverns-red/toast-stats/issues/582)) ([fe74ddb](https://github.com/taverns-red/toast-stats/commit/fe74ddbe9f15ae394a7d4ca38ef7e56c51d2c993))
* **theme:** [#564](https://github.com/taverns-red/toast-stats/issues/564) Phase 4 — axe-core regression coverage + unmitigated-utilities guard ([#584](https://github.com/taverns-red/toast-stats/issues/584)) ([a8ff059](https://github.com/taverns-red/toast-stats/commit/a8ff059465e76a42fc88e362ad87465477814b24))
* **theme:** dark-mode overrides for District Detail surface ([#564](https://github.com/taverns-red/toast-stats/issues/564) Phase 1) ([#567](https://github.com/taverns-red/toast-stats/issues/567)) ([aa18542](https://github.com/taverns-red/toast-stats/commit/aa1854269c1aa6ef9921c6ac6bf1c9f0f3ebb9ac))


### Refactors

* dedupe calculateDistinguishedPercent — shared helper in analytics-core ([#547](https://github.com/taverns-red/toast-stats/issues/547)) ([#585](https://github.com/taverns-red/toast-stats/issues/585)) ([2bf0415](https://github.com/taverns-red/toast-stats/commit/2bf0415ddd0fb08efcca21186e0236a9f28e54b6))
* extract &lt;DistrictChipAndName&gt; ([#522](https://github.com/taverns-red/toast-stats/issues/522)) ([#586](https://github.com/taverns-red/toast-stats/issues/586)) ([b632278](https://github.com/taverns-red/toast-stats/commit/b6322781d15ea8880979680bbccb1aef201dafb2))
* retire legacy district overview panels + fix flaky pre-push ([#472](https://github.com/taverns-red/toast-stats/issues/472) [#473](https://github.com/taverns-red/toast-stats/issues/473)) ([#474](https://github.com/taverns-red/toast-stats/issues/474)) ([ae7485e](https://github.com/taverns-red/toast-stats/commit/ae7485e06c8d1907b354e23d142b56a60ab5a413))


### Documentation

* **architecture:** interactive map + structured JSON for AI-agent consumption ([#542](https://github.com/taverns-red/toast-stats/issues/542)) ([f5c8d3f](https://github.com/taverns-red/toast-stats/commit/f5c8d3fa3d1205b4bc2561fe4e730f87af0113f8))
* closeout visual-fidelity audit — 6 PRs, prod matches designs ([f39f164](https://github.com/taverns-red/toast-stats/commit/f39f16462348a848ae0def7ad17853c24576eb28))
* **founder-log:** final tally — all chrome migrations live in v2.12.0 ([61e5ff4](https://github.com/taverns-red/toast-stats/commit/61e5ff4411315027a29243ed9f8a5c522692cc69))
* Lesson 57 (year-cumulative base=0) + spec entries for Region page rollup ([#513](https://github.com/taverns-red/toast-stats/issues/513) [#514](https://github.com/taverns-red/toast-stats/issues/514) [#515](https://github.com/taverns-red/toast-stats/issues/515) [#518](https://github.com/taverns-red/toast-stats/issues/518)) ([#527](https://github.com/taverns-red/toast-stats/issues/527)) ([d2a94e6](https://github.com/taverns-red/toast-stats/commit/d2a94e696faebdd35ded931cc3b9edc1dbfc84dd))
* Lesson 58 (invisible-select focus-within ring) + spec entry for DataControlsBar ([#528](https://github.com/taverns-red/toast-stats/issues/528)) ([#533](https://github.com/taverns-red/toast-stats/issues/533)) ([430fc2f](https://github.com/taverns-red/toast-stats/commit/430fc2f93d399e2b0592751dbb1a4d874bb2ea8a))
* Lesson 59 (pin related queries to same snapshot date) + spec entries for region countdown ([#516](https://github.com/taverns-red/toast-stats/issues/516) [#517](https://github.com/taverns-red/toast-stats/issues/517)) ([#536](https://github.com/taverns-red/toast-stats/issues/536)) ([5b0751e](https://github.com/taverns-red/toast-stats/commit/5b0751eb6e8230ef4094a6773c3ca872adc5c8b2))
* **lessons:** Lesson 56 — cache-primer hook calls rarely earn their keep ([#519](https://github.com/taverns-red/toast-stats/issues/519) [#520](https://github.com/taverns-red/toast-stats/issues/520) [#521](https://github.com/taverns-red/toast-stats/issues/521)) ([#524](https://github.com/taverns-red/toast-stats/issues/524)) ([453e983](https://github.com/taverns-red/toast-stats/commit/453e98335c585de9f61fa930f87c838eb72ccd9d))
* **lessons:** Lesson 60 — trust the program rules on percentage denominators ([#537](https://github.com/taverns-red/toast-stats/issues/537)) ([#539](https://github.com/taverns-red/toast-stats/issues/539)) ([f733034](https://github.com/taverns-red/toast-stats/commit/f73303499b5e2d8aac246636b0f987d9aadb6d66))
* **methodology:** reciprocal /awards links from Borda/DCP/Caveats ([#373](https://github.com/taverns-red/toast-stats/issues/373)) ([#478](https://github.com/taverns-red/toast-stats/issues/478)) ([a8d212e](https://github.com/taverns-red/toast-stats/commit/a8d212e92e58cff067a8eb2e1b695414a7ef2569))
* **spec:** record Club Anniversaries epic in product spec ([#443](https://github.com/taverns-red/toast-stats/issues/443)) ([#508](https://github.com/taverns-red/toast-stats/issues/508)) ([9ae6fc5](https://github.com/taverns-red/toast-stats/commit/9ae6fc52fb24d9dfb207d87dfec55fde31dee7d8))
* **spec:** update Distinguished countdown entry — 6 columns + CGD rename ([#534](https://github.com/taverns-red/toast-stats/issues/534)) ([#541](https://github.com/taverns-red/toast-stats/issues/541)) ([5d9cf09](https://github.com/taverns-red/toast-stats/commit/5d9cf09bc2cc5b55b8db1b61b3d3308ee920ed64))

## [2.12.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.11.0...toast-stats-v2.12.0) (2026-05-10)


### Features

* **club:** redesign Close-to-Distinguished call-out + move under hero ([#366](https://github.com/taverns-red/toast-stats/issues/366)) ([#401](https://github.com/taverns-red/toast-stats/issues/401)) ([7ac4fe8](https://github.com/taverns-red/toast-stats/commit/7ac4fe86715b11ecee1a697144db8ef725ff72a5))
* **club:** redesign Club detail hero header per handoff ([#23](https://github.com/taverns-red/toast-stats/issues/23) follow-up to [#366](https://github.com/taverns-red/toast-stats/issues/366)) ([#398](https://github.com/taverns-red/toast-stats/issues/398)) ([1cdf649](https://github.com/taverns-red/toast-stats/commit/1cdf64921d8bf620f647904bb280b44ae6755f8f))
* **clubs:** redesign quick-filter chips on Clubs tab ([#24](https://github.com/taverns-red/toast-stats/issues/24) follow-up to [#361](https://github.com/taverns-red/toast-stats/issues/361)) ([#399](https://github.com/taverns-red/toast-stats/issues/399)) ([649acdc](https://github.com/taverns-red/toast-stats/commit/649acdcdd78bfd2d53a188300868a621a7444fe1))


### Bug Fixes

* **deploy:** footer version was rendering as bare "v" — fix yaml/shell quoting ([#397](https://github.com/taverns-red/toast-stats/issues/397)) ([103d2b2](https://github.com/taverns-red/toast-stats/commit/103d2b290f05a7ef0070bc3e1497a8f1e23b132f))
* **visual:** post-audit visual regressions — Awards data, top bar, History chips, Districts toolbar/table ([#394](https://github.com/taverns-red/toast-stats/issues/394)) ([28c7e34](https://github.com/taverns-red/toast-stats/commit/28c7e346b4e0fbb3e2c773cd06dfc73f1bd5a3a0))


### Refactors

* **rankings:** chrome refresh on Global Rankings chart + multi-year table ([#365](https://github.com/taverns-red/toast-stats/issues/365)) ([#400](https://github.com/taverns-red/toast-stats/issues/400)) ([8e7f350](https://github.com/taverns-red/toast-stats/commit/8e7f350dda9c33a4b0a927eadbdd78de48ddc28f))


### Documentation

* **founder-log:** record Global Rankings chrome refresh + remaining cosmetic gap ([6140a95](https://github.com/taverns-red/toast-stats/commit/6140a95bd61fbd61f95f12844ea2421e006d606e))
* **founder-log:** record post-audit fixes + remaining visual gap ([#396](https://github.com/taverns-red/toast-stats/issues/396)) ([5640231](https://github.com/taverns-red/toast-stats/commit/56402310bd96bf4e1703aa400c0dd9c5cab5da14))

## [2.11.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.10.0...toast-stats-v2.11.0) (2026-05-10)


### Features

* **awards:** rebuild AwardsRaceSection as 3-card contender summary ([#357](https://github.com/taverns-red/toast-stats/issues/357)) ([#382](https://github.com/taverns-red/toast-stats/issues/382)) ([130ac87](https://github.com/taverns-red/toast-stats/commit/130ac87a7e86066f534d5faf50b53bef7977646d))
* **awards:** ship /awards page with top-10 leaderboards ([#370](https://github.com/taverns-red/toast-stats/issues/370) [#371](https://github.com/taverns-red/toast-stats/issues/371) [#372](https://github.com/taverns-red/toast-stats/issues/372) [#373](https://github.com/taverns-red/toast-stats/issues/373)) ([#392](https://github.com/taverns-red/toast-stats/issues/392)) ([0a3129d](https://github.com/taverns-red/toast-stats/commit/0a3129d70051f1a69b416542f053e573cca9b011))
* **club:** apply redesign panel chrome to ClubDetailPage ([#366](https://github.com/taverns-red/toast-stats/issues/366)) ([#389](https://github.com/taverns-red/toast-stats/issues/389)) ([071f970](https://github.com/taverns-red/toast-stats/commit/071f9709508881980b505ad16304255e13a8900a))
* **district:** apply 2026 redesign chrome to DistrictDetailPage header ([#358](https://github.com/taverns-red/toast-stats/issues/358)) ([#383](https://github.com/taverns-red/toast-stats/issues/383)) ([9c5df23](https://github.com/taverns-red/toast-stats/commit/9c5df2368b0353d576af5dd73caafcfe8d72f33a))
* **district:** extract DistrictDetailTabs primitive ([#359](https://github.com/taverns-red/toast-stats/issues/359)) ([#385](https://github.com/taverns-red/toast-stats/issues/385)) ([8c51940](https://github.com/taverns-red/toast-stats/commit/8c51940d6172cf778e23aa0da1462fa7a9ca0236))
* **districts:** apply 2026 redesign chrome to LandingPage in place ([#356](https://github.com/taverns-red/toast-stats/issues/356)) ([#381](https://github.com/taverns-red/toast-stats/issues/381)) ([9dc6662](https://github.com/taverns-red/toast-stats/commit/9dc6662fdb4ac5928fb295746626d04cd2c7a612))
* **history,methodology:** ship History year strip + full Methodology content ([#367](https://github.com/taverns-red/toast-stats/issues/367) [#368](https://github.com/taverns-red/toast-stats/issues/368)) ([#390](https://github.com/taverns-red/toast-stats/issues/390)) ([dbf6b0c](https://github.com/taverns-red/toast-stats/commit/dbf6b0c06ff7b283c094f437d69a818639b990f3))
* **overview:** apply redesign panel chrome to Overview tab components ([#360](https://github.com/taverns-red/toast-stats/issues/360)) ([#387](https://github.com/taverns-red/toast-stats/issues/387)) ([b6de4bc](https://github.com/taverns-red/toast-stats/commit/b6de4bcf708dca5857d8160758896857e9ace3b5))
* **routing:** wire /history + /methodology placeholder routes ([#355](https://github.com/taverns-red/toast-stats/issues/355)) ([#379](https://github.com/taverns-red/toast-stats/issues/379)) ([919f58e](https://github.com/taverns-red/toast-stats/commit/919f58e7a5ebf09a64af12f130bf50842f9086be))
* **shell:** build AppShell — sticky top bar + minimalist footer ([#354](https://github.com/taverns-red/toast-stats/issues/354)) ([#378](https://github.com/taverns-red/toast-stats/issues/378)) ([bacbfe2](https://github.com/taverns-red/toast-stats/commit/bacbfe25cdb2cc2b316972ecf632a5c1056687a2))
* **tabs:** bulk redesign panel chrome across all tab components ([#361](https://github.com/taverns-red/toast-stats/issues/361) [#362](https://github.com/taverns-red/toast-stats/issues/362) [#363](https://github.com/taverns-red/toast-stats/issues/363) [#364](https://github.com/taverns-red/toast-stats/issues/364) [#365](https://github.com/taverns-red/toast-stats/issues/365)) ([#388](https://github.com/taverns-red/toast-stats/issues/388)) ([26c4d10](https://github.com/taverns-red/toast-stats/commit/26c4d102bb36f8b6d42a7816ba02774d1027154e))
* **tokens:** add 2026 redesign token system alongside tm-* ([#353](https://github.com/taverns-red/toast-stats/issues/353)) ([#374](https://github.com/taverns-red/toast-stats/issues/374)) ([00a25d9](https://github.com/taverns-red/toast-stats/commit/00a25d9020ecdedac0fabb401d33365717497802))


### Bug Fixes

* actually count new charters from district-performance.csv ([#336](https://github.com/taverns-red/toast-stats/issues/336)) ([#343](https://github.com/taverns-red/toast-stats/issues/343)) ([c6fc153](https://github.com/taverns-red/toast-stats/commit/c6fc153c08e6d5804b17d9c49e5090f3fd3ae4dd))
* **shell:** drop double-v prefix on footer version ([#354](https://github.com/taverns-red/toast-stats/issues/354)) ([#380](https://github.com/taverns-red/toast-stats/issues/380)) ([50ae0cd](https://github.com/taverns-red/toast-stats/commit/50ae0cd2a7c0efd8d4bc0dc758d3b43114284b4d))


### Documentation

* **founder-log:** final summary — both epics complete ([#352](https://github.com/taverns-red/toast-stats/issues/352) [#370](https://github.com/taverns-red/toast-stats/issues/370)) ([#393](https://github.com/taverns-red/toast-stats/issues/393)) ([5246428](https://github.com/taverns-red/toast-stats/commit/5246428411306daa4abde9524fd81b1a041e0c68))

## [2.10.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.9.0...toast-stats-v2.10.0) (2026-04-22)


### Features

* display threshold + officer awards in trophy case ([#333](https://github.com/taverns-red/toast-stats/issues/333)) ([91bafe3](https://github.com/taverns-red/toast-stats/commit/91bafe36a7ee2a730f8dc783e4a03d74fa21df8b))
* Distinguished District tier tracking + trophy case ([#332](https://github.com/taverns-red/toast-stats/issues/332)) ([1e12e5c](https://github.com/taverns-red/toast-stats/commit/1e12e5cd696c9303dae58c5a17e61b89394e9b59))
* district-free club URL + club index ([#320](https://github.com/taverns-red/toast-stats/issues/320)) ([7f12903](https://github.com/taverns-red/toast-stats/commit/7f12903c8f85a2c270cb6bb47efdf4442ee5d3ae))
* division eligibility derived from area visit status ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([a7d2688](https://github.com/taverns-red/toast-stats/commit/a7d26888b2a5a383ec8921d58f2c61a940e53b93))
* gate area Distinguished status on club visit completion ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([f191c97](https://github.com/taverns-red/toast-stats/commit/f191c9786868da5e2feb8f9c12561010d5f8b406))
* implement ClubStrength, LeadershipExcellence, OfficerAwards calculators ([#333](https://github.com/taverns-red/toast-stats/issues/333)) ([10da8b9](https://github.com/taverns-red/toast-stats/commit/10da8b9b8cc8d7284fb7bc5343a7308c51176b6d))
* implement CompetitiveAwardsCalculator + pipeline integration ([#330](https://github.com/taverns-red/toast-stats/issues/330)) ([b81a1eb](https://github.com/taverns-red/toast-stats/commit/b81a1ebb7f4efaa49f8f7e2ae526640af45349c6))
* implement DistrictAwardsHistoryStore (GCS-backed R9 pattern) ([#333](https://github.com/taverns-red/toast-stats/issues/333)) ([e1c2697](https://github.com/taverns-red/toast-stats/commit/e1c269794bff81bc012272c07304013a2ef751fe))
* mark area Distinguished as provisional when visits incomplete ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([3459456](https://github.com/taverns-red/toast-stats/commit/3459456fef2df5db73749858de6cedf4e3086259))
* parse payment breakdown columns from All Districts CSV ([#327](https://github.com/taverns-red/toast-stats/issues/327)) ([df695cf](https://github.com/taverns-red/toast-stats/commit/df695cfdf489026629dd5292ccfe8bb7c8f7f5c3))
* parse prerequisite + Smedley columns from All Districts CSV ([#329](https://github.com/taverns-red/toast-stats/issues/329)) ([13589d2](https://github.com/taverns-red/toast-stats/commit/13589d226ae5668da9ace1b3a55cf058f7680faa))
* PaymentCompositionCard on District Detail Overview ([#327](https://github.com/taverns-red/toast-stats/issues/327)) ([25c0fcc](https://github.com/taverns-red/toast-stats/commit/25c0fcc28f36be41dec28bd0cbaa810f93cf8871))
* replace region filter disclosure with pill toggle bar ([#326](https://github.com/taverns-red/toast-stats/issues/326)) ([1a1ce01](https://github.com/taverns-red/toast-stats/commit/1a1ce0148c8914f0155ae94db4b27b8cb72e83ca))
* show average members per club on district overview ([#318](https://github.com/taverns-red/toast-stats/issues/318)) ([186a257](https://github.com/taverns-red/toast-stats/commit/186a2575cd244f1a58a8dd35e7f4d0fe28bce5cc))
* staging environment — Phase 1+2 infrastructure + pipeline ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([0be241b](https://github.com/taverns-red/toast-stats/commit/0be241b9041470037070affb96c3737173535fb0))
* surface competitive award standings on landing page ([#331](https://github.com/taverns-red/toast-stats/issues/331)) ([9451faf](https://github.com/taverns-red/toast-stats/commit/9451faf9f35b16e0d1770b1ced48bee13e77f897))
* wire threshold + officer awards into pipeline ([#333](https://github.com/taverns-red/toast-stats/issues/333)) ([fed8273](https://github.com/taverns-red/toast-stats/commit/fed82733ca407fa053f066471cb15e27aa898a32))


### Bug Fixes

* 'Close to Distinguished' button syncs sort state to URL ([5133273](https://github.com/taverns-red/toast-stats/commit/513327339ab13993ca12b3964d248bab5a53b137))
* district-snapshot-index uses snapshot date for daily updates ([#309](https://github.com/taverns-red/toast-stats/issues/309)) ([5767907](https://github.com/taverns-red/toast-stats/commit/57679070b883b35932dcc30dc7b00b8911592167))
* division eligibility is NOT gated on area visits ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([1b0fe8a](https://github.com/taverns-red/toast-stats/commit/1b0fe8a3d8e97b6a9790ab2dc7a67349a2177b2c))
* exclude new charters from District Club Retention Award ([#336](https://github.com/taverns-red/toast-stats/issues/336)) ([#337](https://github.com/taverns-red/toast-stats/issues/337)) ([239a31a](https://github.com/taverns-red/toast-stats/commit/239a31acbb424483ea546c76c85f129d6e6b5707))
* provisional badge in area performance table row ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([9f60720](https://github.com/taverns-red/toast-stats/commit/9f60720a405bc414343c8142e95a75b1e8ee5dc6))
* stabilize club detail smoke test selector ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([6534f48](https://github.com/taverns-red/toast-stats/commit/6534f48df657e591067d1af52c4781d401c77092))
* staging CDN URL detection survives Vite build optimization ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([4c628f7](https://github.com/taverns-red/toast-stats/commit/4c628f74969456c7559544fb2c81dc2f009a582a))
* Trends tab uses consistent data sources across all sections ([#319](https://github.com/taverns-red/toast-stats/issues/319)) ([3cd3689](https://github.com/taverns-red/toast-stats/commit/3cd36898f3f9301f715ff8b3195351c0c10fdfce))
* use build-time VITE_CDN_BASE_URL for staging CDN ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([ae8fea2](https://github.com/taverns-red/toast-stats/commit/ae8fea25b9c392bf80f885a4b3165d07377ebe94))


### Documentation

* add insights-driven engineering guidelines to CLAUDE.md ([84386ff](https://github.com/taverns-red/toast-stats/commit/84386ff4388231cd9604e2a8441492762e6e7877))
* ADR-002 staging environment and deployment flow ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([5bf5145](https://github.com/taverns-red/toast-stats/commit/5bf5145d076cfff963bae19b5f303a8bcc99f801))
* ADR-002 updated — separate staging GCS bucket + diff-based validation ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([9d873e2](https://github.com/taverns-red/toast-stats/commit/9d873e2ed56a8c5c71527d5bea4dcb220a281c7a))
* correct DAP/DDP eligibility rules — 75% visit threshold per round ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([5a43963](https://github.com/taverns-red/toast-stats/commit/5a439638fb112780c045fe2b1c678bd802bca820))
* District Awards Suite — rules reference + product spec ([#328](https://github.com/taverns-red/toast-stats/issues/328)) ([4ed3a12](https://github.com/taverns-red/toast-stats/commit/4ed3a1278194f72ddfae4deeb937d7932e10261c))
* mark [#333](https://github.com/taverns-red/toast-stats/issues/333) shipped + add Lesson 45 (GCS sync parity) ([27f3ab8](https://github.com/taverns-red/toast-stats/commit/27f3ab8902685bb9f57260f2bedac4fc3549bf0f))
* move insights guidelines from project to global CLAUDE.md ([873c297](https://github.com/taverns-red/toast-stats/commit/873c297dddb0202cb09710933edeab59e63d7053))


### Tests

* add failing tests for CompetitiveAwardsCalculator ([#330](https://github.com/taverns-red/toast-stats/issues/330)) ([33e5ae7](https://github.com/taverns-red/toast-stats/commit/33e5ae743458169a6177429698af20748afd1ab2))
* add failing tests for DistinguishedDistrictCalculator ([#332](https://github.com/taverns-red/toast-stats/issues/332)) ([a04f296](https://github.com/taverns-red/toast-stats/commit/a04f296564dfbfe398fedfb530b761f80f2c1e9d))
* add failing tests for prerequisite + Smedley CSV columns ([#329](https://github.com/taverns-red/toast-stats/issues/329)) ([291fde8](https://github.com/taverns-red/toast-stats/commit/291fde88e88863e578877539e88fbb49dec3a76d))
* add failing tests for threshold + officer award calculators ([#333](https://github.com/taverns-red/toast-stats/issues/333)) ([5630a95](https://github.com/taverns-red/toast-stats/commit/5630a951f5b2163c1175a117febc9c34d1928158))
* red phase — getLatestPayments helper for time-series consistency ([#319](https://github.com/taverns-red/toast-stats/issues/319)) ([569b5a0](https://github.com/taverns-red/toast-stats/commit/569b5a0d1c9d8b743e50ac1e7423bd8b7d7a4923))
* red phase — visit-gated area eligibility for DAP ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([36ac76c](https://github.com/taverns-red/toast-stats/commit/36ac76c4282063031d4b6a909cbd2ecfed7d54aa))

## [2.9.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.8.0...toast-stats-v2.9.0) (2026-04-07)


### Features

* Google Analytics 4 + release notes link in footer ([#314](https://github.com/taverns-red/toast-stats/issues/314), [#312](https://github.com/taverns-red/toast-stats/issues/312)) ([fa5a2be](https://github.com/taverns-red/toast-stats/commit/fa5a2be45e8fc2bd5aa5bcc596d7bd6d6fba63f8))


### Bug Fixes

* AreaDivisionRecognition requires CSP for distinguished count ([#311](https://github.com/taverns-red/toast-stats/issues/311)) ([f14f95c](https://github.com/taverns-red/toast-stats/commit/f14f95c55ab23e956747e9d564fa7f9a3bceabd9))
* daily pipeline upload uses snapshot date for closing periods ([#309](https://github.com/taverns-red/toast-stats/issues/309)) ([4872467](https://github.com/taverns-red/toast-stats/commit/48724676b28d1872df243ac9266f23a779c260a4))
* resolve all 4 Dependabot vulnerabilities ([f3d3b0c](https://github.com/taverns-red/toast-stats/commit/f3d3b0cdc9f3d8c9615c457b49c590f2db84be5a))


### Tests

* red phase — AreaDivisionRecognition should require CSP for distinguished ([#311](https://github.com/taverns-red/toast-stats/issues/311)) ([af02a40](https://github.com/taverns-red/toast-stats/commit/af02a40c684d2bfde7664d9387c423d530016339))

## [2.8.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.7.0...toast-stats-v2.8.0) (2026-04-06)


### Features

* add client-side provisional Distinguished utility ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([ee83434](https://github.com/taverns-red/toast-stats/commit/ee8343444dd7292dc6822c200031c10fd31d968d))
* add CSP submission status card to ClubDetailPage ([#298](https://github.com/taverns-red/toast-stats/issues/298)) ([302e080](https://github.com/taverns-red/toast-stats/commit/302e08017117839241a46808db909e9b3402c291))
* add isDistinguishedProvisional to ClubEligibilityUtils ([#287](https://github.com/taverns-red/toast-stats/issues/287)) ([851571a](https://github.com/taverns-red/toast-stats/commit/851571a7857baed14824a571a49b7393ec038ec3))
* compute confirmed Distinguished count from club data pre-April ([#304](https://github.com/taverns-red/toast-stats/issues/304)) ([861382b](https://github.com/taverns-red/toast-stats/commit/861382b6532245b42c3ef439a861977261cc1fa0))
* GlobalRankingsTab uses per-date rankings for accuracy ([#302](https://github.com/taverns-red/toast-stats/issues/302)) ([46c7b28](https://github.com/taverns-red/toast-stats/commit/46c7b28bb6e8f43f0ff58a9150b369c915781fdc))
* level-aware provisional thresholds + getConfirmedDistinguishedLevel ([#296](https://github.com/taverns-red/toast-stats/issues/296)) ([94c668f](https://github.com/taverns-red/toast-stats/commit/94c668f90dc57d56d8f09911cdce78049db7e937))
* show 'Provisional' subtitle with confirmed fallback level ([#297](https://github.com/taverns-red/toast-stats/issues/297)) ([36512e9](https://github.com/taverns-red/toast-stats/commit/36512e9d88d7f6930f2fb57a038423a2651e70a9))
* show CSP status on club detail modal ([#288](https://github.com/taverns-red/toast-stats/issues/288)) ([4478b01](https://github.com/taverns-red/toast-stats/commit/4478b01c6d35a50923faf304d9a3c33a11da82c3))
* show provisional Distinguished badge with asterisk + tooltip ([#287](https://github.com/taverns-red/toast-stats/issues/287)) ([6096a1e](https://github.com/taverns-red/toast-stats/commit/6096a1ec41b1659aa224b76ac9359f99ecc6d1ab))
* standard competition ranking for overallRank ties ([#303](https://github.com/taverns-red/toast-stats/issues/303)) ([49f3457](https://github.com/taverns-red/toast-stats/commit/49f3457185450e2c5823f17075c4926b5b57e139))
* transform derives closing period from CSV footer when metadata missing ([#292](https://github.com/taverns-red/toast-stats/issues/292), [#293](https://github.com/taverns-red/toast-stats/issues/293)) ([04e8161](https://github.com/taverns-red/toast-stats/commit/04e8161af4daaff03d40224791a4c4b590c5b08c))
* use client-side provisional detection in all badge views ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([06314f7](https://github.com/taverns-red/toast-stats/commit/06314f748916df2998ea05f43a71f7b36b344b71))
* wire isProvisionallyDistinguished into analytics pipeline ([#287](https://github.com/taverns-red/toast-stats/issues/287)) ([30dde5b](https://github.com/taverns-red/toast-stats/commit/30dde5b6d6698061d0843ee24eb1c3c8e6806c13))


### Bug Fixes

* add abbreviated month names to closing period parser ([#286](https://github.com/taverns-red/toast-stats/issues/286)) ([ee3ee87](https://github.com/taverns-red/toast-stats/commit/ee3ee87ce0ae95e05638412aec7a87df18e67bd9))
* add closing period debug logging + fallback to initial parse ([#309](https://github.com/taverns-red/toast-stats/issues/309)) ([dedc133](https://github.com/taverns-red/toast-stats/commit/dedc13311596f19c3c75b6aea30a94aa3a159b95))
* add cspSubmitted to Zod schema so snapshots preserve it ([#300](https://github.com/taverns-red/toast-stats/issues/300)) ([d1406a9](https://github.com/taverns-red/toast-stats/commit/d1406a9026d8cfa497a28836f5f558c17fc90485))
* apply tie-handling and confirmed Distinguished to TransformService ([#303](https://github.com/taverns-red/toast-stats/issues/303), [#304](https://github.com/taverns-red/toast-stats/issues/304), [#306](https://github.com/taverns-red/toast-stats/issues/306)) ([f5a936a](https://github.com/taverns-red/toast-stats/commit/f5a936a82f1738b82c3ad2276897d879a6190484))
* clean orphan prev-year dirs and harden LATEST_DATE resolution ([#295](https://github.com/taverns-red/toast-stats/issues/295)) ([33f633d](https://github.com/taverns-red/toast-stats/commit/33f633d668b6e9d8668c77addeea5adf2e869cba))
* fetch rankings from GCS when local cache cleaned in rebuild mode ([e9b910b](https://github.com/taverns-red/toast-stats/commit/e9b910b8d28eb72b53f67e55b1921a7b61d0473a))
* landing page rankings table now loads per-date data ([#301](https://github.com/taverns-red/toast-stats/issues/301)) ([f1d58dc](https://github.com/taverns-red/toast-stats/commit/f1d58dc9eb87dee2123892117ee518d4404424d4))
* landing page table uses overallRank from data instead of array index ([#303](https://github.com/taverns-red/toast-stats/issues/303)) ([3b01f62](https://github.com/taverns-red/toast-stats/commit/3b01f628e3089a30c95cbc6a48baa2ec78179102))
* mirror level-aware provisional thresholds in client-side fallback ([#296](https://github.com/taverns-red/toast-stats/issues/296)) ([8959305](https://github.com/taverns-red/toast-stats/commit/8959305bb099a07d92e4c7c0eda6b0b08e61468d))
* normalize cspSubmitted via getCSPStatus to prevent undefined ([#290](https://github.com/taverns-red/toast-stats/issues/290)) ([1d2ea00](https://github.com/taverns-red/toast-stats/commit/1d2ea0080b9ac60861c97afe860a5b48dd416298))
* rank-history uses snapshot dates instead of raw-csv dates ([#302](https://github.com/taverns-red/toast-stats/issues/302)) ([c2495e4](https://github.com/taverns-red/toast-stats/commit/c2495e4ee17e34811f8022e1437dbb5ac3762456))
* readCacheMetadata always verifies CSV footer when isClosingPeriod=false ([#309](https://github.com/taverns-red/toast-stats/issues/309)) ([0a6f201](https://github.com/taverns-red/toast-stats/commit/0a6f2011bcb0b9bdae3e12d766536deeba5de402))
* replace misleading 'Top X%' with ordinal percentile ([#305](https://github.com/taverns-red/toast-stats/issues/305)) ([4595547](https://github.com/taverns-red/toast-stats/commit/459554726768c004da06a21eabd361376c117f8b))


### Documentation

* add data pipeline flow reference document ([5a12b02](https://github.com/taverns-red/toast-stats/commit/5a12b025d8330153c294a23f7e92727998514c47))
* update product spec and add lesson 44 ([#296](https://github.com/taverns-red/toast-stats/issues/296), [#297](https://github.com/taverns-red/toast-stats/issues/297), [#298](https://github.com/taverns-red/toast-stats/issues/298), [#299](https://github.com/taverns-red/toast-stats/issues/299)) ([24d9a9f](https://github.com/taverns-red/toast-stats/commit/24d9a9fabc74d1dd53cf0fb8b66dc8f37abdbf0f))


### Tests

* add aprilRenewals to integration test mocks ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([bf23a00](https://github.com/taverns-red/toast-stats/commit/bf23a0064d99d27aab6d22760f5c7e77d5b0e875))
* migrate provisional Distinguished tests to ClubDetailPage ([#299](https://github.com/taverns-red/toast-stats/issues/299)) ([4a39390](https://github.com/taverns-red/toast-stats/commit/4a393908e1cbf349dcd8e68b2606d4bdd77ea2ee))
* red phase — compute confirmed Distinguished from club data pre-April ([#304](https://github.com/taverns-red/toast-stats/issues/304)) ([1e13097](https://github.com/taverns-red/toast-stats/commit/1e1309770384e6eec472bb4b4b6d9cbb06726820))
* red phase — CSV footer fallback in readCacheMetadata ([#292](https://github.com/taverns-red/toast-stats/issues/292)) ([4589e57](https://github.com/taverns-red/toast-stats/commit/4589e5796913164219f443c2103589cf400d80bb))
* red phase — level-specific provisional thresholds and confirmed level ([#296](https://github.com/taverns-red/toast-stats/issues/296)) ([bf273cc](https://github.com/taverns-red/toast-stats/commit/bf273cc46e2186321c692a0d3e3d06a58d5ed0c8))
* red phase — Multi-Year table should use per-date rankings ([#302](https://github.com/taverns-red/toast-stats/issues/302)) ([d44c6c7](https://github.com/taverns-red/toast-stats/commit/d44c6c7e3b4674af92012eb71a7057592fc62d40))
* red phase — overallRank should handle ties with standard competition ranking ([#303](https://github.com/taverns-red/toast-stats/issues/303)) ([9e03dfe](https://github.com/taverns-red/toast-stats/commit/9e03dfed90e80d421b739aebee11173938890e65))
* red phase — per-date rankings override in GlobalRankingsTab ([#302](https://github.com/taverns-red/toast-stats/issues/302)) ([413ed83](https://github.com/taverns-red/toast-stats/commit/413ed83bf36bf84807dc5bc6fa89c29868b021ac))
* red phase — provisional Distinguished badge tests ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([0056f67](https://github.com/taverns-red/toast-stats/commit/0056f6731bae8a7b1f3ed9b1ec34f734e53cf764))
* red phase — replace 'Top X%' with ordinal percentile ([#305](https://github.com/taverns-red/toast-stats/issues/305)) ([8d4e077](https://github.com/taverns-red/toast-stats/commit/8d4e0774de0f8fcb17f0dcc08759d0329f5219f1))

## [2.7.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.6.0...toast-stats-v2.7.0) (2026-04-04)


### Features

* sync column filters to URL for deep links ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([9b76f70](https://github.com/taverns-red/toast-stats/commit/9b76f702f14515b33337e44d0afc311a80f8aa21))
* sync program year and date to URL for deep links ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([8222d46](https://github.com/taverns-red/toast-stats/commit/8222d46cbf356ca0e12393ac713210eb6b24b2b2))
* wire CDN cache monitoring into fetch layer ([#255](https://github.com/taverns-red/toast-stats/issues/255)) ([c7136bf](https://github.com/taverns-red/toast-stats/commit/c7136bf3ee26580b29e63bf2d5707369d3aa7fa5))


### Bug Fixes

* remove duplicate import and unused var from rebase ([#281](https://github.com/taverns-red/toast-stats/issues/281)) ([438444c](https://github.com/taverns-red/toast-stats/commit/438444c6f36aa6bf34683517c5287c4ded911e9c))
* Restore CSV closing period detection natively during orchestration ([#278](https://github.com/taverns-red/toast-stats/issues/278)) ([86ebfde](https://github.com/taverns-red/toast-stats/commit/86ebfded001555f5a93afefdcf69b4ed03884892))
* update closing period mock to parse CSV footer ([#281](https://github.com/taverns-red/toast-stats/issues/281)) ([ce1ec30](https://github.com/taverns-red/toast-stats/commit/ce1ec3049f00b87d06a9cff0a6c94fb9a69e7906))


### Documentation

* add CLAUDE.md, sprint lessons, and update product spec ([#255](https://github.com/taverns-red/toast-stats/issues/255), [#272](https://github.com/taverns-red/toast-stats/issues/272)) ([882aaf0](https://github.com/taverns-red/toast-stats/commit/882aaf028011e27902fc65caeaa3381d84caf0c4))
* append lesson 42 — logger migration breaks test spies ([#283](https://github.com/taverns-red/toast-stats/issues/283)) ([b04e634](https://github.com/taverns-red/toast-stats/commit/b04e6348191457dea0068a9821e54f468a4a4394))


### Tests

* add comprehensive CSV export test coverage ([#282](https://github.com/taverns-red/toast-stats/issues/282)) ([f086c95](https://github.com/taverns-red/toast-stats/commit/f086c95f4eaeab2949de5cb42d029f585d7f28ce))
* update test spies from console.* to logger ([#283](https://github.com/taverns-red/toast-stats/issues/283)) ([9201c50](https://github.com/taverns-red/toast-stats/commit/9201c500365cc72627188f49cbc685dfb5a47e24))

## [2.6.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.5.0...toast-stats-v2.6.0) (2026-04-03)


### Features

* add ClubsNeedingMembersCard to Overview tab ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([951b186](https://github.com/taverns-red/toast-stats/commit/951b186cf87184dd5346e4b8e47dd57e3713090b))
* add computeMembersToDistinguished utility ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([942c551](https://github.com/taverns-red/toast-stats/commit/942c55132d7c7400a318ab6d615df05ddd62278a))
* add deriveGoalContext and findClubsNeedingMembers helpers ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([44644fe](https://github.com/taverns-red/toast-stats/commit/44644febb7fa2912b1bd9593014c8ea20dcff1fa))
* add remote error reporting to ErrorBoundary ([#254](https://github.com/taverns-red/toast-stats/issues/254)) ([39a2a0c](https://github.com/taverns-red/toast-stats/commit/39a2a0c98f405fa9d9b9188c604d74948219e442))
* add useUrlState hook for URL-synced state ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([6a852f7](https://github.com/taverns-red/toast-stats/commit/6a852f702258b4d96f32d67ee11449c30e08786a))
* **core:** incorporate granular DCP goals into data pipeline ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([dde0439](https://github.com/taverns-red/toast-stats/commit/dde04394bb22bf0c0d660e31110ce59ea711215c))
* **frontend:** prioritize exact goal flags for members to distinguished logic ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([3b5f686](https://github.com/taverns-red/toast-stats/commit/3b5f6867d0e56001854a4bf4de5a8a5559bbb146))
* sync additional tables with URL params ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([a68c640](https://github.com/taverns-red/toast-stats/commit/a68c64070a289340ace0aca69a6a225b8f636a13))
* sync ClubsTable pagination with URL params ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([a6da02e](https://github.com/taverns-red/toast-stats/commit/a6da02e0fff08fc3c061b5dd936f65fe99e26864))
* **ui:** add 'close to distinguished' card ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([d4e08aa](https://github.com/taverns-red/toast-stats/commit/d4e08aa166303ca7d5f8ead7275283fec81a68d9))
* **ui:** add members needed column and retain pagination state ([#272](https://github.com/taverns-red/toast-stats/issues/272), [#273](https://github.com/taverns-red/toast-stats/issues/273)) ([7269e4d](https://github.com/taverns-red/toast-stats/commit/7269e4dde54b53d021251fcd3dd3ea0e10fa17e6))


### Bug Fixes

* compute payment YoY from time-series data ([#269](https://github.com/taverns-red/toast-stats/issues/269)) ([3e3975b](https://github.com/taverns-red/toast-stats/commit/3e3975b4b2d98c72c935f4e9fb4cade5cea68eec))
* paginate GCS delimiter listing to retrieve all date directories ([#152](https://github.com/taverns-red/toast-stats/issues/152)) ([e5b259d](https://github.com/taverns-red/toast-stats/commit/e5b259db0544b2c82ec6b1bf18605d46ab1e2a2b))
* **ui:** add membersNeeded to applyFilter switch statement ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([5c37ef4](https://github.com/taverns-red/toast-stats/commit/5c37ef4b0c1b949c93630e102565d42cd44c83da))
* use correct CDN field name 'May Visit award' for second-round visits ([#268](https://github.com/taverns-red/toast-stats/issues/268)) ([c6b9113](https://github.com/taverns-red/toast-stats/commit/c6b911383d3b205aca41502482dc64ef4a7a73f8))


### Refactors

* split LazyCharts into individual files to fix fast refresh warning ([#251](https://github.com/taverns-red/toast-stats/issues/251)) ([9a8139d](https://github.com/taverns-red/toast-stats/commit/9a8139d7a4e3ef40f135cad9456cfba9ce145530))


### Documentation

* add lesson about CSV-record mock format for integration tests ([#261](https://github.com/taverns-red/toast-stats/issues/261)) ([1ed509d](https://github.com/taverns-red/toast-stats/commit/1ed509d89828a19fba05c0c35f18c343eaf8564e))
* add lesson for members-to-distinguished computation ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([62437e4](https://github.com/taverns-red/toast-stats/commit/62437e40ef9cd41025b28fc0774d3d458130e2e5))
* add Sprint 17 lessons for [#268](https://github.com/taverns-red/toast-stats/issues/268) and [#269](https://github.com/taverns-red/toast-stats/issues/269) ([b04a347](https://github.com/taverns-red/toast-stats/commit/b04a347c0791c9649b0187049f9cccadbacf94c0))
* update lessons with sprint 17 discoveries ([c6e6136](https://github.com/taverns-red/toast-stats/commit/c6e61360a0c2eb823b9aa0fee88c3cf5cc774b74))


### Tests

* add integration test suite for critical user journeys ([#261](https://github.com/taverns-red/toast-stats/issues/261)) ([f5909df](https://github.com/taverns-red/toast-stats/commit/f5909dff46c7fad65680ead0836df4985a1fee47))
* align ClubsTable integration tests with Members Needed column layout ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([f0c44b8](https://github.com/taverns-red/toast-stats/commit/f0c44b86ac7f255bead974bca53e231e29faab43))

## [2.5.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.4.0...toast-stats-v2.5.0) (2026-03-29)


### Features

* add responsive X-axis tick density for mobile charts ([#237](https://github.com/taverns-red/toast-stats/issues/237)) ([821dded](https://github.com/taverns-red/toast-stats/commit/821dded09edb74c6e5324a3b04c78fbc67b80f9c))
* add tie-aware ranking for Top Growth and DCP lists ([#236](https://github.com/taverns-red/toast-stats/issues/236)) ([d5655f0](https://github.com/taverns-red/toast-stats/commit/d5655f0aa0c07f05ba8134868fd674fd40348f14))
* unify chart loading skeletons with animated bars ([#235](https://github.com/taverns-red/toast-stats/issues/235)) ([30c99c0](https://github.com/taverns-red/toast-stats/commit/30c99c02b66aab2abd78ca4929eaa60af41ac9fe))


### Bug Fixes

* add ignoreDeprecations for TS7 moduleResolution=node10 deprecation ([aab7f32](https://github.com/taverns-red/toast-stats/commit/aab7f322febb51ba4f33396aad2ea7ef1b58e4ee))
* add missing fetchCdnSnapshotIndex mock to LandingPage tests ([#233](https://github.com/taverns-red/toast-stats/issues/233)) ([c03f194](https://github.com/taverns-red/toast-stats/commit/c03f194e40e7478b03f2e5fa5d61a226532a9fb1))
* date count inconsistency between landing and district pages ([#233](https://github.com/taverns-red/toast-stats/issues/233)) ([e8b968d](https://github.com/taverns-red/toast-stats/commit/e8b968dae5ec235d2d5200f4a0f0f59807c02d9f))


### Documentation

* add Sprint 14 lessons ([#233](https://github.com/taverns-red/toast-stats/issues/233)) ([ad8ccde](https://github.com/taverns-red/toast-stats/commit/ad8ccde77e84290d76aa8e3115e0fb1892346bb7))


### Tests

* add unit coverage for Sprint 15 UX utilities ([a5de16e](https://github.com/taverns-red/toast-stats/commit/a5de16e8925382f7288aed1327f8e9ecf09ebd08))
* fix useResponsiveChartTicks logic and add a11y DOM tests ([#18](https://github.com/taverns-red/toast-stats/issues/18)) ([ba9a668](https://github.com/taverns-red/toast-stats/commit/ba9a6688ac1157496fb849a1add777178548534a))

## [2.4.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.3.0...toast-stats-v2.4.0) (2026-03-28)


### Features

* multi-year trend comparison overlay on membership chart ([#238](https://github.com/taverns-red/toast-stats/issues/238)) ([29aa42f](https://github.com/taverns-red/toast-stats/commit/29aa42f333345c6040d3fdc64fe8bee86f95333e))
* per-club DCP goal progress card on club detail page ([#242](https://github.com/taverns-red/toast-stats/issues/242)) ([591f733](https://github.com/taverns-red/toast-stats/commit/591f733b47c716c1cae5ad71ded480767d803b00))
* persist tab & sort state in URL search params ([#230](https://github.com/taverns-red/toast-stats/issues/230)) ([f025c62](https://github.com/taverns-red/toast-stats/commit/f025c629bd14d95ff62adbfb177107b83cf76ba9))


### Bug Fixes

* club.membershipBase ?? membershipTrend[0].count ?? currentMembers ([d7109df](https://github.com/taverns-red/toast-stats/commit/d7109df4ec34912d779ec45854a9b14d9b75d7c0))
* ClubDCPGoalsCard not visible — data path and column names ([#242](https://github.com/taverns-red/toast-stats/issues/242)) ([e23e92d](https://github.com/taverns-red/toast-stats/commit/e23e92db62d8003f7f8cfe15c5eb49dbed2dbbd6))
* gap-to-tier now accounts for net growth alternative ([#239](https://github.com/taverns-red/toast-stats/issues/239)) ([af6b7a0](https://github.com/taverns-red/toast-stats/commit/af6b7a0f8510e877df2f88c48fd7009d960c018e))
* gap-to-tier uses membershipBase instead of trend[0] ([#241](https://github.com/taverns-red/toast-stats/issues/241)) ([d7109df](https://github.com/taverns-red/toast-stats/commit/d7109df4ec34912d779ec45854a9b14d9b75d7c0))
* HistoricalRankChart uses selected program year for label ([#232](https://github.com/taverns-red/toast-stats/issues/232)) ([9c8eb41](https://github.com/taverns-red/toast-stats/commit/9c8eb41268bcea4fe7731488b47b64ed9165abea))
* multi-year chart uses merged dataset for proper X-axis alignment ([#243](https://github.com/taverns-red/toast-stats/issues/243)) ([ed8fad3](https://github.com/taverns-red/toast-stats/commit/ed8fad32bce5680886447d3bf4722c7093448c09))
* multi-year payments chart uses timeSeries CDN data ([#243](https://github.com/taverns-red/toast-stats/issues/243)) ([c5909d9](https://github.com/taverns-red/toast-stats/commit/c5909d9da4938e220c2adf6ca45fb51be1ce4eca))
* replace membership projections with health-based distinguished outlook ([#231](https://github.com/taverns-red/toast-stats/issues/231)) ([8409fbd](https://github.com/taverns-red/toast-stats/commit/8409fbd75409113a895fb221578f8f429ee08015))


### Documentation

* add multi-year chart alignment lesson ([#243](https://github.com/taverns-red/toast-stats/issues/243)) ([22170ad](https://github.com/taverns-red/toast-stats/commit/22170ad81f06adbcb84dd98837466cb0e78ef5c1))
* add Sprint 11 DCP goals lesson ([#242](https://github.com/taverns-red/toast-stats/issues/242)) ([8ab1acf](https://github.com/taverns-red/toast-stats/commit/8ab1acf40e61948510bb55fad71ca16916275be8))
* add Sprint 11 lessons ([#239](https://github.com/taverns-red/toast-stats/issues/239), [#231](https://github.com/taverns-red/toast-stats/issues/231), [#232](https://github.com/taverns-red/toast-stats/issues/232), [#230](https://github.com/taverns-red/toast-stats/issues/230), [#238](https://github.com/taverns-red/toast-stats/issues/238)) ([f50b7ef](https://github.com/taverns-red/toast-stats/commit/f50b7efa81a76a19ce80f06ec820caf524b97061))


### Tests

* update DCP section test for renamed component ([#231](https://github.com/taverns-red/toast-stats/issues/231)) ([3cd715b](https://github.com/taverns-red/toast-stats/commit/3cd715baf362fe99f9c2c06b5ac61139e3032b38))

## [2.3.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.2.0...toast-stats-v2.3.0) (2026-03-27)


### Features

* performance & observability — Lighthouse CI, code-split Recharts, CDN monitoring, error telemetry ([#222](https://github.com/taverns-red/toast-stats/issues/222), [#223](https://github.com/taverns-red/toast-stats/issues/223), [#224](https://github.com/taverns-red/toast-stats/issues/224), [#225](https://github.com/taverns-red/toast-stats/issues/225)) ([1edc44a](https://github.com/taverns-red/toast-stats/commit/1edc44a28cd6dde583dbcbe790c92d4793694464))


### Documentation

* add code-split Recharts lazy barrel lesson ([#223](https://github.com/taverns-red/toast-stats/issues/223)) ([13c3795](https://github.com/taverns-red/toast-stats/commit/13c3795d5fe1bfae15036a8b1b5f3d9170890235))

## [2.2.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.1.0...toast-stats-v2.2.0) (2026-03-27)


### Features

* **analytics-core:** growth velocity, division heatmap, seasonal risk scoring ([#219](https://github.com/taverns-red/toast-stats/issues/219), [#220](https://github.com/taverns-red/toast-stats/issues/220), [#221](https://github.com/taverns-red/toast-stats/issues/221)) ([7eda0ee](https://github.com/taverns-red/toast-stats/commit/7eda0eef0aa563f609608fee53725edc86c3d6fe))
* **frontend:** growth velocity card and division heatmap ([#219](https://github.com/taverns-red/toast-stats/issues/219), [#220](https://github.com/taverns-red/toast-stats/issues/220)) ([d812125](https://github.com/taverns-red/toast-stats/commit/d8121259fa7eb218f5be8899d7a1efaaf75a302c))


### Documentation

* add analytics-core barrel rebuild lesson ([#219](https://github.com/taverns-red/toast-stats/issues/219), [#220](https://github.com/taverns-red/toast-stats/issues/220), [#221](https://github.com/taverns-red/toast-stats/issues/221)) ([1a8d5b6](https://github.com/taverns-red/toast-stats/commit/1a8d5b6e8bb2213172a34d6a9e0bfc2a392af349))

## [2.1.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v2.0.0...toast-stats-v2.1.0) (2026-03-26)


### Features

* accessibility & mobile responsiveness ([#216](https://github.com/taverns-red/toast-stats/issues/216), [#217](https://github.com/taverns-red/toast-stats/issues/217), [#218](https://github.com/taverns-red/toast-stats/issues/218)) ([9a63787](https://github.com/taverns-red/toast-stats/commit/9a63787939405240f2048d8ecc9f8c4f88502e62))
* accessibility & mobile responsiveness ([#216](https://github.com/taverns-red/toast-stats/issues/216), [#217](https://github.com/taverns-red/toast-stats/issues/217), [#218](https://github.com/taverns-red/toast-stats/issues/218)) ([7931882](https://github.com/taverns-red/toast-stats/commit/793188218581381f7d5355d51dc3b6675d9e05a6))
* add data freshness indicators ([#213](https://github.com/taverns-red/toast-stats/issues/213), [#214](https://github.com/taverns-red/toast-stats/issues/214), [#215](https://github.com/taverns-red/toast-stats/issues/215)) ([881b4e2](https://github.com/taverns-red/toast-stats/commit/881b4e2e6d4016acf8237cde6b9cf11e85ae4b4e))


### Documentation

* add lessons from Sprint 7 ([#213](https://github.com/taverns-red/toast-stats/issues/213), [#214](https://github.com/taverns-red/toast-stats/issues/214), [#215](https://github.com/taverns-red/toast-stats/issues/215)) ([6571fe1](https://github.com/taverns-red/toast-stats/commit/6571fe1ead5ee0955dd55b600f06629adc06fcab))

## [2.0.0](https://github.com/taverns-red/toast-stats/compare/toast-stats-v1.0.0...toast-stats-v2.0.0) (2026-03-26)

### ⚠ BREAKING CHANGES

- Express backend removed entirely
- Backend analytics endpoints removed:
  - DELETE analytics.ts (8 endpoints, 1722 lines)
  - DELETE analyticsSummary.ts (1 endpoint, 594 lines)
  - DELETE PreComputedAnalyticsReader.ts (1163 lines)
  - DELETE 6 test files (2543 lines)

### Features

- 4-step prune pipeline — backfill, raw-csv pruning, orchestrator ([#152](https://github.com/taverns-red/toast-stats/issues/152)) ([737fe4d](https://github.com/taverns-red/toast-stats/commit/737fe4d2781952eeeb065a1bcabaa7eb903ecbcd))
- Add `@toastmasters/analytics-core` as a dependency to `scraper-cli` and include its build in the data pipeline CI. ([8a5d4e4](https://github.com/taverns-red/toast-stats/commit/8a5d4e40314708f82b9bfe8e18a437bd6e7e5b71))
- add backfill script for district-snapshot index ([c56a819](https://github.com/taverns-red/toast-stats/commit/c56a819ff7154975fb687cc57b8eac289bffe154))
- add backfill-club-trends script for dense program-year data ([#79](https://github.com/taverns-red/toast-stats/issues/79)) ([d93f6fb](https://github.com/taverns-red/toast-stats/commit/d93f6fb48f35e5811adf676efb7cc70028c76ba2))
- add BackfillOrchestrator and backfill CLI command ([#123](https://github.com/taverns-red/toast-stats/issues/123)) ([896eb39](https://github.com/taverns-red/toast-stats/commit/896eb3942a8a47b4d0417a88f482a13a77534222))
- add CDN manifest generation (v1/latest.json, v1/dates.json) to pipeline ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([824095b](https://github.com/taverns-red/toast-stats/commit/824095be8c0298adadb825ad9ab04ba14fb726d0))
- add CDN metadata to pipeline uploads — gzip, Content-Type, immutable caching ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([e443591](https://github.com/taverns-red/toast-stats/commit/e443591a9571eb4990fc0af437a1836324d1517e))
- add CDN-first data layer — cdn.ts client, 4 hooks updated with Express fallback ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([2af7012](https://github.com/taverns-red/toast-stats/commit/2af7012ab392168c4850398805106c121e2ab462))
- add ClosingDateRegistry for auto-maintaining closing dates ([#203](https://github.com/taverns-red/toast-stats/issues/203)) ([37ecc8c](https://github.com/taverns-red/toast-stats/commit/37ecc8c88f9a03810cdc2ef21ab58849ee0bbd2a))
- add club detail subpage with routing ([#208](https://github.com/taverns-red/toast-stats/issues/208)) ([4829b4b](https://github.com/taverns-red/toast-stats/commit/4829b4b8c74e63879f53ab51a3acec1547c9edb6))
- add collector-cli rebuild and prune commands ([#181](https://github.com/taverns-red/toast-stats/issues/181)) ([8a8a2ac](https://github.com/taverns-red/toast-stats/commit/8a8a2ac08a578b8d3c3e2f6f53c3fdae07b1eff2))
- add dark mode based on taverns-red colour scheme ([#120](https://github.com/taverns-red/toast-stats/issues/120)) ([1aa1a2c](https://github.com/taverns-red/toast-stats/commit/1aa1a2c8b5b0a8e9f5bfc45f29475109bb3c7bbc))
- add data pipeline and deployment workflows with Workload Identity Federation setup for GCP. ([779ff07](https://github.com/taverns-red/toast-stats/commit/779ff075358a2582bfaedb48b9e26f244342fbf8))
- add DCP Projections table to Analytics tab ([#6](https://github.com/taverns-red/toast-stats/issues/6)) ([79d2cb3](https://github.com/taverns-red/toast-stats/commit/79d2cb3cf23129f7d89f6459405965fd30db35ea))
- add DCP projections utility module ([#6](https://github.com/taverns-red/toast-stats/issues/6)) ([f23daa1](https://github.com/taverns-red/toast-stats/commit/f23daa18ff16862d397184911282bede7944db32))
- add district comparison mode with radar chart and pin/unpin ([#93](https://github.com/taverns-red/toast-stats/issues/93)) ([7bd039d](https://github.com/taverns-red/toast-stats/commit/7bd039d0b89e84bcfafffe9ace64b51a8defdae3))
- add district search bar to Global Rankings table ([#91](https://github.com/taverns-red/toast-stats/issues/91)) ([217f007](https://github.com/taverns-red/toast-stats/commit/217f0072938ea47494bc1728ade1bd540beecaae))
- add DistrictSnapshotIndexService with tests ([be07c7f](https://github.com/taverns-red/toast-stats/commit/be07c7fe0fbf1e445877818d68996b388304f776))
- add DistrictSnapshotIndexWriter with tests ([683657c](https://github.com/taverns-red/toast-stats/commit/683657cfb5818bdec0a3ba90f4869d5a7ef6addc))
- add fields parameter to useDistrictStatistics and pass divisions for lazy loading ([f9577a0](https://github.com/taverns-red/toast-stats/commit/f9577a0356b276cd52b812ff096688271874e3c3))
- add fields query parameter to statistics endpoint for response optimization ([87a1cc7](https://github.com/taverns-red/toast-stats/commit/87a1cc72734148d661237f7ac4359c2870cc1c4c))
- add findMonthEndKeeperForward — forward-scan month-end discovery ([#152](https://github.com/taverns-red/toast-stats/issues/152)) ([4c5d1b0](https://github.com/taverns-red/toast-stats/commit/4c5d1b055c91a0cfab7c7447ad324908bc58deb9))
- add full YoY backfill script for entire GCS cache ([#77](https://github.com/taverns-red/toast-stats/issues/77)) ([bd43d08](https://github.com/taverns-red/toast-stats/commit/bd43d0887e77d04be2f31f0576a04ef23d16c2c2))
- add GCS direct upload support to backfill command ([#123](https://github.com/taverns-red/toast-stats/issues/123)) ([6d2bd52](https://github.com/taverns-red/toast-stats/commit/6d2bd527b43abd6794f968fc6c7dbd20c9e9ed9e))
- add HttpCsvDownloader with direct CSV URL construction ([#123](https://github.com/taverns-red/toast-stats/issues/123)) ([64095e2](https://github.com/taverns-red/toast-stats/commit/64095e21496c4b64d3574437e2dd100e6f24b415))
- Add local Docker build script, document its usage, and update pre-push hook to run it along with granular test commands. ([2f29b6c](https://github.com/taverns-red/toast-stats/commit/2f29b6c4aecc61c90195370806320f476efb799d))
- add membershipBase to ClubTrend for accurate base membership display ([#164](https://github.com/taverns-red/toast-stats/issues/164)) ([c2e9b30](https://github.com/taverns-red/toast-stats/commit/c2e9b30e8a6e0cfb043fb4860e2a60756edaf711))
- add rank-history generation to rebuild command ([#181](https://github.com/taverns-red/toast-stats/issues/181)) ([53fdde8](https://github.com/taverns-red/toast-stats/commit/53fdde86aa3d8ee7aa194ab63799498ab5b06d24))
- add redtaverns favicon ([6c82504](https://github.com/taverns-red/toast-stats/commit/6c825048200f63691f00e1e9909925b6f9ad4854))
- Add repository URL to package.json and `cspSubmitted` field to the district statistics club interface. ([617b97b](https://github.com/taverns-red/toast-stats/commit/617b97b1526e9336838acccedc3165261cfe3933))
- add rescrape mode to data pipeline ([#201](https://github.com/taverns-red/toast-stats/issues/201)) ([f7966db](https://github.com/taverns-red/toast-stats/commit/f7966db3f96382e2a50cdfb15196909e3c4b29a8))
- add rescrape-historical pipeline mode for one-time data fix ([#205](https://github.com/taverns-red/toast-stats/issues/205)) ([6adf4b0](https://github.com/taverns-red/toast-stats/commit/6adf4b0b09124907f7b26f959e509d7c822d9435))
- add service usage consumer role to WIF setup script ([ae1dbf8](https://github.com/taverns-red/toast-stats/commit/ae1dbf872efa57361944e8a56b675d718b25d7d2))
- add site footer with attribution, source link, and disclaimer ([#88](https://github.com/taverns-red/toast-stats/issues/88)) ([a6699ed](https://github.com/taverns-red/toast-stats/commit/a6699edaf08d00f9961dca8d6a198883dc02e41c))
- add tooltip info icons to table column headers ([#92](https://github.com/taverns-red/toast-stats/issues/92)) ([9a31280](https://github.com/taverns-red/toast-stats/commit/9a31280fd15922cc72850af1b0d36d8ff4722bb8))
- add topGrowthClubs and dcpGoalAnalysis to pre-computed analytics ([#84](https://github.com/taverns-red/toast-stats/issues/84)) ([acc2886](https://github.com/taverns-red/toast-stats/commit/acc2886f28b03dc15eb8a1dc0bc12f3711dc7163))
- add tracked-district analytics badge to rankings table ([1e13b98](https://github.com/taverns-red/toast-stats/commit/1e13b98a42c5e0719bf92d6bb275dde3e01038b3))
- **admin:** implement force-cancel stuck jobs with modal dialog ([344fbf2](https://github.com/taverns-red/toast-stats/commit/344fbf2c971b985542765f73d62da14e45e2d977))
- **admin:** implement singleton backfill service and snapshot inspection ([cec0114](https://github.com/taverns-red/toast-stats/commit/cec0114151a95a1c9db2b2923e9929b3826c1b3e))
- **analytics-core:** complete district overview data consistency implementation ([a0b4f35](https://github.com/taverns-red/toast-stats/commit/a0b4f3584be97dbfbd0b8ee0608ca7569436c014))
- **analytics-core:** fix membership change calculation with normalized district ID lookup ([844eea1](https://github.com/taverns-red/toast-stats/commit/844eea1f41d9e384fb3d0c64d5c1ea4d35da985a))
- **analytics-core:** implement club renewal data fix with district performance merge ([7b83942](https://github.com/taverns-red/toast-stats/commit/7b839423101abab48e4b4a0ad3be6a60ea4a2c53))
- **analytics-core:** implement division and area data wiring with raw CSV preservation ([1750308](https://github.com/taverns-red/toast-stats/commit/175030829f19ebb3caa499d1a2dea6a3b6f008eb))
- **analytics-core:** implement per-metric rankings calculation and integration ([f857447](https://github.com/taverns-red/toast-stats/commit/f857447b81b59cf6067274f75a807b9a2023fffa))
- **analytics-core:** implement performance targets calculation with recognition levels ([e8c4104](https://github.com/taverns-red/toast-stats/commit/e8c4104627439ce1e9189defccb987166a6a39c9))
- **analytics-core:** use totalPayments from rankings for membership progress ([bc7c51c](https://github.com/taverns-red/toast-stats/commit/bc7c51c6e3886712ed0a15d189bb4eecbcecbda6))
- **analytics:** add bounded LRU cache and precomputed analytics pipeline ([ff76112](https://github.com/taverns-red/toast-stats/commit/ff76112d7d6b294059c1cdc7aefebb61d60743e8))
- **analytics:** add memberCountChange field to distinguish member count from payment metrics ([94ce7f5](https://github.com/taverns-red/toast-stats/commit/94ce7f5d0cf4da2f041e5a1ac9df3d425df071c1))
- **analytics:** add paymentsTrend data to district analytics response ([14105a2](https://github.com/taverns-red/toast-stats/commit/14105a2ee10850d4b3f2d843c3dfbee3ead9b7a2))
- **analytics:** complete precomputed analytics alignment implementation ([fe0faae](https://github.com/taverns-red/toast-stats/commit/fe0faaed288bca05a3da5f8a90c1c4dbe793a3db))
- **analytics:** fix analytics-summary data source to use district analytics file ([2336509](https://github.com/taverns-red/toast-stats/commit/2336509724161abab26c201411a29ab403ff28f5))
- **analytics:** fix payments trend data source and year-over-year comparison ([219178e](https://github.com/taverns-red/toast-stats/commit/219178eaf584472ebdb35009efd709dd7a7adfc6))
- **analytics:** fix trends tab data display across three system layers ([33bc5ff](https://github.com/taverns-red/toast-stats/commit/33bc5ffd6facf994bc69e03c2511af2b273046a9))
- **analytics:** implement analytics availability checker and integrate with snapshot operations ([9a22d3c](https://github.com/taverns-red/toast-stats/commit/9a22d3c4acbdbbd7ac53c2db9a8c5a65e5109bf1))
- **analytics:** implement date-aware snapshot selection for analytics endpoints ([7e8a4c7](https://github.com/taverns-red/toast-stats/commit/7e8a4c738449be9f30659f22c7d7bef1edada87c))
- **analytics:** implement distinguished clubs type fix with property-based testing ([24ad6a8](https://github.com/taverns-red/toast-stats/commit/24ad6a8b76221af336c38508f64d472b8c8756ca))
- **analytics:** implement district analytics performance infrastructure ([897fb38](https://github.com/taverns-red/toast-stats/commit/897fb38fc0cf219fe7092dd818d0f97c038f3b0c))
- **analytics:** implement district analytics performance optimization ([5e76117](https://github.com/taverns-red/toast-stats/commit/5e76117b0154ae976d71c3d3e4287c547c4a83ba))
- **analytics:** integrate pre-computed analytics generation into backfill pipeline ([ef03b61](https://github.com/taverns-red/toast-stats/commit/ef03b61ce5fa0d236904e6da725be800965baaf2))
- **analytics:** move backend analytics modules to analytics-core ([7e75263](https://github.com/taverns-red/toast-stats/commit/7e75263c6b4bc3ec7804a844b4558fa16618930f))
- auto-discover districts from Toastmasters CSV in data pipeline ([#141](https://github.com/taverns-red/toast-stats/issues/141)) ([da79820](https://github.com/taverns-red/toast-stats/commit/da798208f2701ba114efd9c417989202d9c1c0f5))
- automatic semantic versioning with footer display ([#136](https://github.com/taverns-red/toast-stats/issues/136)) ([0fe9f50](https://github.com/taverns-red/toast-stats/commit/0fe9f50f9c2b7f759d7a89265d03de32eaf2ca04))
- **backend,frontend:** remove backfill system and consolidate to scraper-cli ([5b1ac34](https://github.com/taverns-red/toast-stats/commit/5b1ac34ea83076481f5baadc45f905cd72cc32ff))
- **backend:** add performance targets transformation for per-metric rankings ([1868183](https://github.com/taverns-red/toast-stats/commit/186818370a792594801c8904186cd3613d6a8d3c))
- **backend:** complete backend computation removal and analytics-core integration ([b462b4c](https://github.com/taverns-red/toast-stats/commit/b462b4ce278ff27b788a0cb15451fc1a739a755b))
- **backend:** complete refresh-service computation removal and analytics migration ([17dbf27](https://github.com/taverns-red/toast-stats/commit/17dbf273e48bf5c52c61821d158ce9159af4a02b))
- backfill writes metadata.json per date for transform compatibility ([#125](https://github.com/taverns-red/toast-stats/issues/125)) ([428205f](https://github.com/taverns-red/toast-stats/commit/428205fbe3a3e8482651b86934196e0fc762d300))
- **backfill:** implement unified backfill service with job management ([2abd669](https://github.com/taverns-red/toast-stats/commit/2abd6694cee2bb37d4d949de26d03985f2c887cc))
- code-split DistrictDetailPage with React.lazy + Suspense ([#169](https://github.com/taverns-red/toast-stats/issues/169)) ([8ff5fbd](https://github.com/taverns-red/toast-stats/commit/8ff5fbdd60d9e5449fbe71cbecf8c3d7d9739b46))
- color-code Health, Growth, and DCP sub-scores in Leadership table ([#90](https://github.com/taverns-red/toast-stats/issues/90)) ([9757f84](https://github.com/taverns-red/toast-stats/commit/9757f84af2648d4d992b42223303f8533fa949c8))
- Configure Vitest coverage thresholds, add a pre-push test hook, and refine SnapshotStore cache invalidation. ([25fe8c5](https://github.com/taverns-red/toast-stats/commit/25fe8c5e120f892514de53acd06029d4349cfa47))
- convert 7 remaining hooks to CDN-only ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([c13dd07](https://github.com/taverns-red/toast-stats/commit/c13dd079645bcaf9af76ed235897c2eaba62986e))
- convert last 2 Express hooks to CDN, delete api.ts ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([fb280ea](https://github.com/taverns-red/toast-stats/commit/fb280ea9a5ec01a32029ab68a2d8538e96e886e4))
- convert rankings to CDN + add v1/rankings.json pipeline step ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([14f8138](https://github.com/taverns-red/toast-stats/commit/14f813897a2db198889b0e6014f9a999829ee88c))
- delete backend analytics routes, CDN-only frontend ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([b23183c](https://github.com/taverns-red/toast-stats/commit/b23183c29850533476595f76a25b656ba9d06dc3))
- delete Express backend, CDN-only architecture ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([7d8fde0](https://github.com/taverns-red/toast-stats/commit/7d8fde0c205f0670967c6432aec6e70d9b434081))
- detect and skip corrupt CSVs during transform ([#199](https://github.com/taverns-red/toast-stats/issues/199)) ([f7cfb36](https://github.com/taverns-red/toast-stats/commit/f7cfb3698d22126f72ec3a2e4cb6b0b98c085dd6))
- enhance club detail card with stats grid, base membership, and DCP milestone bars ([#163](https://github.com/taverns-red/toast-stats/issues/163)) ([89226af](https://github.com/taverns-red/toast-stats/commit/89226af84bfd42a714bc216164fbd004010fbccc))
- enhance club detail graph with program year context ([#79](https://github.com/taverns-red/toast-stats/issues/79)) ([7d209a1](https://github.com/taverns-red/toast-stats/commit/7d209a16e278f58ca297d3e950cf5d26a8b0e4a4))
- enrich per-club trends with dense program-year data ([#79](https://github.com/taverns-red/toast-stats/issues/79)) ([01b426c](https://github.com/taverns-red/toast-stats/commit/01b426cb0c865299d485aa05bc957525e79ed35a))
- Establish experiment and lessons learned templates, replacing previous coding principles in AGENTS.md. ([d411639](https://github.com/taverns-red/toast-stats/commit/d411639f0a456583e036005cccf85ef9637d3697))
- establish TDD and test coverage policies by updating pre-commit/pre-push hooks, CI, Vitest configurations, and adding engineering principles documentation. ([a8e6766](https://github.com/taverns-red/toast-stats/commit/a8e676603f71ab75711e8343a9c21503e6c91e69))
- extract shared GCS helpers and pure classifier libs ([#147](https://github.com/taverns-red/toast-stats/issues/147) [#148](https://github.com/taverns-red/toast-stats/issues/148) [#149](https://github.com/taverns-red/toast-stats/issues/149)) ([92ffb75](https://github.com/taverns-red/toast-stats/commit/92ffb758c7a12cb9f32f1f85697830ebc1f6a770))
- find month-end dates from raw-csv GCS metadata ([#147](https://github.com/taverns-red/toast-stats/issues/147)) ([fa1aa8f](https://github.com/taverns-red/toast-stats/commit/fa1aa8fa5e627f2d44db8a021ea2467275bf7633))
- **firestore:** implement chunked batch writes with retry logic for snapshot storage ([e0ca06a](https://github.com/taverns-red/toast-stats/commit/e0ca06a34bfe2802f22446bcf8bee82ecf68c14c))
- **frontend:** add date range validation to prevent invalid analytics queries ([3a40bc0](https://github.com/taverns-red/toast-stats/commit/3a40bc0ba1284423af376afc21be9819606b3873))
- **frontend:** add shared contracts dependency and improve type safety ([9aa3dc9](https://github.com/taverns-red/toast-stats/commit/9aa3dc901832fef34c550595a7e90ee8883a14da))
- **frontend:** auto-select valid program year when current selection unavailable ([f32647b](https://github.com/taverns-red/toast-stats/commit/f32647be4c816e07d7fb53640756f50814365d47))
- **frontend:** enable multi-year payments trend display by removing data override ([10d423c](https://github.com/taverns-red/toast-stats/commit/10d423ce868b0ba8af1b17c525b1a656e216e5c0))
- **frontend:** handle distinguishedProjection object format in analytics fallback ([662e1e1](https://github.com/taverns-red/toast-stats/commit/662e1e1aae5608e4e843601b4e1d2f0a713d879b))
- **frontend:** hide analytics tab pending DCP goal analysis data availability ([7be8e4c](https://github.com/taverns-red/toast-stats/commit/7be8e4c87bcb63422f2aff40268284a30ba3bc92))
- **frontend:** remove division rankings and area performance chart components ([880b635](https://github.com/taverns-red/toast-stats/commit/880b635929044112c9d366c217bc030f2d142c5e))
- **frontend:** rewire trends tab to use aggregated analytics for historical data ([35d4f4c](https://github.com/taverns-red/toast-stats/commit/35d4f4c3b68c8ff1642401632213401da4d249be))
- generate and prune month-end GCS snapshots ([#148](https://github.com/taverns-red/toast-stats/issues/148), [#149](https://github.com/taverns-red/toast-stats/issues/149)) ([dc15771](https://github.com/taverns-red/toast-stats/commit/dc15771fff55bb0083238c805f79df8ebf159d13))
- Implement daily data pipeline workflow for scraping, transforming, and analyzing Toastmasters data, updating WIF setup with required GCP services and roles. ([c4df88f](https://github.com/taverns-red/toast-stats/commit/c4df88f6701f0cf78748196d77f61bf27b6a3bb7))
- improve Global Rankings UX with progressive loading ([5a78b06](https://github.com/taverns-red/toast-stats/commit/5a78b06d563d911f5d78db08633d4352091c2ad6))
- incremental ClubTrendsStore replaces all-snapshot loading for dense club trends ([#144](https://github.com/taverns-red/toast-stats/issues/144)) ([6933ffa](https://github.com/taverns-red/toast-stats/commit/6933ffae26aae8940e8a616ab4dc80894da6f07a))
- Introduce `test:coverage` script and `@vitest/coverage-v8` for standardized test coverage execution in pre-push and CI workflows. ([345e59f](https://github.com/taverns-red/toast-stats/commit/345e59fb74570f3b8ccdaf1eb04e24da637f18e0))
- introduce iMessage notification workflow and document new lessons on analytics data granularity. ([c922240](https://github.com/taverns-red/toast-stats/commit/c92224039c316a198a360fc0fe1f02102c391dfe))
- invert ranking chart Y-axis — Overall shows rank instead of Borda count ([#89](https://github.com/taverns-red/toast-stats/issues/89)) ([4105185](https://github.com/taverns-red/toast-stats/commit/4105185a6aec171610d29be8c9da1c6b8a14fa7b))
- make PreComputedAnalyticsReader GCS-aware for Cloud Run ([4364252](https://github.com/taverns-red/toast-stats/commit/436425230b675507903fc483af16ffa8e639b03a))
- make region selectors collapsible on mobile ([799e936](https://github.com/taverns-red/toast-stats/commit/799e936e8bd544b0cc54451bd9fd0124d32113c0))
- **memory-management:** implement V8 heap configuration and memory monitoring ([d72e330](https://github.com/taverns-red/toast-stats/commit/d72e330d9b9c659841837c48be328f7ebc8c4d4a))
- optimize cached-dates endpoint with pre-computed index ([094ef5c](https://github.com/taverns-red/toast-stats/commit/094ef5cee1fcd2c9d07f7f02b326b947b532bced))
- progressive loading — per-section skeletons for divisions, trends, analytics tabs ([#169](https://github.com/taverns-red/toast-stats/issues/169)) ([c3e20f0](https://github.com/taverns-red/toast-stats/commit/c3e20f083357f5b2139c02c739069e05b4951f42))
- **rankings:** implement district validation filtering in backfill and snapshot services ([bb3dcb4](https://github.com/taverns-red/toast-stats/commit/bb3dcb4409c690cd7d5310cfcc7b5175544f3045))
- re-enable Analytics tab on district detail page ([#78](https://github.com/taverns-red/toast-stats/issues/78)) ([e21582c](https://github.com/taverns-red/toast-stats/commit/e21582c51374328bb17a9a284622b15cf2343147))
- reorder Global Rankings tab — table above the fold ([#83](https://github.com/taverns-red/toast-stats/issues/83)) ([062b85d](https://github.com/taverns-red/toast-stats/commit/062b85d2d917f163c2cb99d76b847c4fa8baf8df)), closes [#82](https://github.com/taverns-red/toast-stats/issues/82)
- reorganize landing page — rankings table above the fold ([#83](https://github.com/taverns-red/toast-stats/issues/83)) ([f830bba](https://github.com/taverns-red/toast-stats/commit/f830bbaf41ba0feb8a5e109b52f0851c67b21cb7))
- replace Firestore storage implementations with GCS for time series indexes and district configurations. ([b26debd](https://github.com/taverns-red/toast-stats/commit/b26debde09525702e9d3309e499ceaab1bdfdc41))
- replace node-cache with bounded lru-cache ([122a5a0](https://github.com/taverns-red/toast-stats/commit/122a5a0018917555a409026764c2da54bde7f09f))
- replace node-cache with bounded lru-cache ([7ee3384](https://github.com/taverns-red/toast-stats/commit/7ee3384f0d824e7915fd76c8a8aee847dbce02a1))
- replace node-cache with bounded lru-cache ([8090c92](https://github.com/taverns-red/toast-stats/commit/8090c92872b1349e28bca16dc3319ed2da896fd7))
- retain penultimate dates during prune ([#203](https://github.com/taverns-red/toast-stats/issues/203)) ([3756951](https://github.com/taverns-red/toast-stats/commit/3756951a556152725f75471b231d93f3711d8232))
- **scraper-cli:** add preflight auth check to fail fast on GCS credential issues ([41a04af](https://github.com/taverns-red/toast-stats/commit/41a04af323ecc14789818ec5c873fa6dce4ffd35))
- **scraper-cli:** extend month-end closing period handling to analytics computation ([e555b59](https://github.com/taverns-red/toast-stats/commit/e555b592b6a570d528c3a535c9d99bcccb956077))
- **scraper-cli:** implement month-end closing period detection and compliance ([689f868](https://github.com/taverns-red/toast-stats/commit/689f868b6b1d6a88a7a8fcb30f471760897c2f9c))
- **scraper-cli:** implement upload performance enhancements with streaming and dependency injection ([aaebc5f](https://github.com/taverns-red/toast-stats/commit/aaebc5fc1de7005aa9c22725fd68cc6f0cb3208b))
- **scraper-cli:** wrap district snapshots in PerDistrictData format ([fe32d54](https://github.com/taverns-red/toast-stats/commit/fe32d54732ac1c9e61e7bfaea1966e40eefa99ca))
- **scripts:** add bulk upload script for local cache to Firestore ([2fcc8db](https://github.com/taverns-red/toast-stats/commit/2fcc8db4887458ef084f987903e823fb88f713eb))
- **scripts:** refactor upload script to match new local file structure ([d1134a9](https://github.com/taverns-red/toast-stats/commit/d1134a91736728687cd447f69c9fb39252bf6a35))
- serve time-series via CDN + useTimeSeries hook ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([73b2c07](https://github.com/taverns-red/toast-stats/commit/73b2c07232c67dfbd9afaf16d54b656faa18404d))
- **shared-contracts:** establish canonical ClubHealthStatus type and resolve value mismatch ([916be21](https://github.com/taverns-red/toast-stats/commit/916be217390afdad12825f427aab2d1f42b201a2))
- **shared-contracts:** implement shared data contracts package ([3d8ce42](https://github.com/taverns-red/toast-stats/commit/3d8ce42b5f8e1a15a9e61b78f3fb4b91bbe8345c))
- show Global Rankings tab for untracked districts instead of empty state ([d3b45aa](https://github.com/taverns-red/toast-stats/commit/d3b45aa7ab92279d4aff2965440ec2985d2ae868))
- **snapshot-storage:** implement GCS-backed snapshot storage provider ([f2817a6](https://github.com/taverns-red/toast-stats/commit/f2817a68e9d6628f05ffe7d784ba36f1bcb75d13))
- **snapshot-store:** implement concurrent read deduplication for listSnapshots ([64629d7](https://github.com/taverns-red/toast-stats/commit/64629d7942603e49e7323174b014b31e6812a77a))
- **snapshot-store:** implement latest snapshot pointer for O(1) cold-start resolution ([d5370ce](https://github.com/taverns-red/toast-stats/commit/d5370cef3f3d58b55c7a15feb7f7c78128110190))
- **storage:** implement snapshot deletion storage abstraction ([41d40fd](https://github.com/taverns-red/toast-stats/commit/41d40fd59de17ff04e2d4bd5f81db3ab1ec82a8d))
- switch API from Gateway to HTTPS LB at api.taverns.red ([#14](https://github.com/taverns-red/toast-stats/issues/14)) ([007fb81](https://github.com/taverns-red/toast-stats/commit/007fb81af27be8b9cbf4168e580e48d12d4c1f68))
- unified data pipeline — daily, rebuild, prune modes ([#191](https://github.com/taverns-red/toast-stats/issues/191)) ([f30f3b1](https://github.com/taverns-red/toast-stats/commit/f30f3b18672356a29e8f3d99e12d2be543fd15bc))
- update backend Dockerfile for monorepo support and optimize Cloud Build context with `.gcloudignore` and deployment workflow. ([832c45d](https://github.com/taverns-red/toast-stats/commit/832c45d0c2e7937ea6f085c618a05c018b9cda71))
- update district-snapshot index after upload ([bf91132](https://github.com/taverns-red/toast-stats/commit/bf91132372fc18d8db9168cd6a593fbbe371ac23))
- use listSnapshotIds + hasAllDistrictsRankings in AvailableProgramYearsService ([ca47ccb](https://github.com/taverns-red/toast-stats/commit/ca47ccbf1524ef2fda01c8cd03dbc399b9ac2d54))
- wire ClubDetailModal to use dense club trends from club-trends-index ([#79](https://github.com/taverns-red/toast-stats/issues/79)) ([9dee66b](https://github.com/taverns-red/toast-stats/commit/9dee66bb618ddf05a81a60ec5e1cc8111de062e0))
- wire useTimeSeries into DistrictDetailPage ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([c08da58](https://github.com/taverns-red/toast-stats/commit/c08da584bf8cc1bbe86ea5725376867e00aa7593))
- wire YoY comparison from CDN time-series data ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([f9d6ba7](https://github.com/taverns-red/toast-stats/commit/f9d6ba70824e3068b142adc613acf15f9f626d16))

### Bug Fixes

- add /api prefix to production API base URL ([75e3ad5](https://github.com/taverns-red/toast-stats/commit/75e3ad5d21357fd79f0d7037239137fa47d3c66d))
- add 60s deadline to all API Gateway backend endpoints ([32bb85c](https://github.com/taverns-red/toast-stats/commit/32bb85c376eb61e531993a6e91996180cbdc32c1))
- add dark mode overrides for colored utility classes, form controls, and blockquotes ([#121](https://github.com/taverns-red/toast-stats/issues/121), [#122](https://github.com/taverns-red/toast-stats/issues/122)) ([e3c80c2](https://github.com/taverns-red/toast-stats/commit/e3c80c20d0246fb0991acb15a43da343b6b4f74a))
- add diagnostic listing of service accounts before IAM binding ([7817041](https://github.com/taverns-red/toast-stats/commit/78170416b42322d49ca62f85e034984bbc377e6f))
- add district discovery to rescrape mode ([#201](https://github.com/taverns-red/toast-stats/issues/201)) ([aae3c2b](https://github.com/taverns-red/toast-stats/commit/aae3c2bfece5f383a726010a5bc33399f803ca3f))
- add districtId validation to hasDistrictInSnapshot ([#75](https://github.com/taverns-red/toast-stats/issues/75)) ([fcd401b](https://github.com/taverns-red/toast-stats/commit/fcd401bcf8c6050e1dd5fcdfcc33f23a00f9f838))
- add monthEndDate to export URL for month-specific CSV data ([#204](https://github.com/taverns-red/toast-stats/issues/204)) ([87e2d0f](https://github.com/taverns-red/toast-stats/commit/87e2d0fc4d595ab70160608beb1e8d9883978143))
- add node: prefix to Node built-in imports in collector-cli ([#104](https://github.com/taverns-red/toast-stats/issues/104)) ([0c686f8](https://github.com/taverns-red/toast-stats/commit/0c686f8b0d797026ab783c3d4e2fe78858498ddf))
- add POST /districts/rank-history-batch to API Gateway OpenAPI spec ([109bfd1](https://github.com/taverns-red/toast-stats/commit/109bfd10be19f1078ac711db1916c84b5ac1112f))
- add spacing between Program Year Progress label and percentage ([bd9bf54](https://github.com/taverns-red/toast-stats/commit/bd9bf5413c22b6cb24cf9cae1a926ad7086700d7))
- **admin:** handle missing snapshot IDs with fallback display ([66a2bd6](https://github.com/taverns-red/toast-stats/commit/66a2bd63d7d23518de4f28cbe36564a211af1519))
- allow unauthenticated Cloud Run access (API Gateway removed) ([3113850](https://github.com/taverns-red/toast-stats/commit/3113850b53791e046948338b9d6803bc0cd561bd))
- **analytics:** add path traversal validation to prevent directory escape attacks ([2e80b9a](https://github.com/taverns-red/toast-stats/commit/2e80b9a6834035c6b7748383322f7f30447807a5))
- **analytics:** re-derive path from trusted base to prevent taint chain ([498c24c](https://github.com/taverns-red/toast-stats/commit/498c24c40e0079ecd4092d434a5757872c67b737))
- apply Borda tie-neutralization to TransformService rankings ([#198](https://github.com/taverns-red/toast-stats/issues/198)) ([bd2b47f](https://github.com/taverns-red/toast-stats/commit/bd2b47f010e6cf4774fd7f702a7dfec5e3bbcb87))
- auto-invoke CLI when run via npx tsx ([#123](https://github.com/taverns-red/toast-stats/issues/123)) ([3762152](https://github.com/taverns-red/toast-stats/commit/3762152cca9e4e75265e5e33335f5deb70abd6dd))
- backfill CLI stores CSVs in transform-compatible format ([#125](https://github.com/taverns-red/toast-stats/issues/125)) ([4b8fc2a](https://github.com/taverns-red/toast-stats/commit/4b8fc2aa1b69fd6fa92b14ceafe93b660885bb45))
- backfill outputDir should use cacheDir root, not /backfill subdir ([#123](https://github.com/taverns-red/toast-stats/issues/123)) ([c851799](https://github.com/taverns-red/toast-stats/commit/c851799162ffd393451b83e6c4815cc39df02713))
- **backfill:** correct progress calculation and completed items filtering ([5b2a836](https://github.com/taverns-red/toast-stats/commit/5b2a836c340d435334c9e5f94cab824c61925fab))
- **backfill:** use UTC methods in date formatting to prevent timezone issues ([a137893](https://github.com/taverns-red/toast-stats/commit/a137893873d6fa0577104b93ed24d6acee984a1d))
- broaden district ID filter to accept single-letter districts F, U ([#145](https://github.com/taverns-red/toast-stats/issues/145)) ([e200d6e](https://github.com/taverns-red/toast-stats/commit/e200d6ee6293d406bd4dd2d47f450e23719b3978))
- club detail modal y-axis inversion when all values are equal ([#107](https://github.com/taverns-red/toast-stats/issues/107)) ([506aa9d](https://github.com/taverns-red/toast-stats/commit/506aa9d8fab3ef57fa91bc107c1d213f3d1b5335))
- club net change uses base vs current membership ([#194](https://github.com/taverns-red/toast-stats/issues/194)) ([21e07bc](https://github.com/taverns-red/toast-stats/commit/21e07bcc140d2db4689496546f77a7dcd3734160))
- convert manualChunks to function for Rolldown compatibility ([#175](https://github.com/taverns-red/toast-stats/issues/175)) ([fb533a3](https://github.com/taverns-red/toast-stats/commit/fb533a3d89cbd9ca98422460f60a279a0db038c6))
- correct Firebase Hosting service agent email format ([aa023bd](https://github.com/taverns-red/toast-stats/commit/aa023bd55c44949391c0971ae07b755e9c3a3e5d))
- correct jq paths in pipeline summary for scrape results ([1d50765](https://github.com/taverns-red/toast-stats/commit/1d507650424b7e101545d1b04d88e1646e81ff2b))
- correct membership badge value and scope DCP timeline ([#76](https://github.com/taverns-red/toast-stats/issues/76), [#79](https://github.com/taverns-red/toast-stats/issues/79)) ([8f2a7c7](https://github.com/taverns-red/toast-stats/commit/8f2a7c76cfd2b69eee66d44c901572e843207304))
- correct path.resolve assertions in CacheConfigService tests ([#103](https://github.com/taverns-red/toast-stats/issues/103)) ([823940a](https://github.com/taverns-red/toast-stats/commit/823940ad1ecbb5c4175784549e4287cecb9db746))
- dark mode overrides for brand color tokens and gradient cards ([#121](https://github.com/taverns-red/toast-stats/issues/121), [#122](https://github.com/taverns-red/toast-stats/issues/122)) ([73174fd](https://github.com/taverns-red/toast-stats/commit/73174fd57e4fb139006c338f8dd7aa2b65c66715))
- dark mode overrides for brand opacity classes, amber, and insights ([#121](https://github.com/taverns-red/toast-stats/issues/121), [#122](https://github.com/taverns-red/toast-stats/issues/122)) ([1752348](https://github.com/taverns-red/toast-stats/commit/1752348083e6de72c52ce02f7c5e0f1830678056))
- date selector typo and region spacing ([#195](https://github.com/taverns-red/toast-stats/issues/195), [#196](https://github.com/taverns-red/toast-stats/issues/196)) ([8fb93a8](https://github.com/taverns-red/toast-stats/commit/8fb93a85e1624cefef43fb91a1eb227675b515cb))
- derive member count change from trend data instead of broken field ([#76](https://github.com/taverns-red/toast-stats/issues/76)) ([cfbaebd](https://github.com/taverns-red/toast-stats/commit/cfbaebde208971700dac402eb2a572afd76fc43b))
- derive program year from dataMonth, not closingDate ([#205](https://github.com/taverns-red/toast-stats/issues/205)) ([6f0e790](https://github.com/taverns-red/toast-stats/commit/6f0e790c1096404172bd149032c018865811efb6))
- detect openapi.yaml changes across all commits in a push ([de36c6f](https://github.com/taverns-red/toast-stats/commit/de36c6fa8f6db190c02e368020eed0a9a703609a))
- detect the format and work with whichever shape it finds. ([f5baac0](https://github.com/taverns-red/toast-stats/commit/f5baac033eaf17273ffdf634f11d8aba7df4b621))
- district detail page — rankings, date selector, cleanup ([#183](https://github.com/taverns-red/toast-stats/issues/183)) ([271224b](https://github.com/taverns-red/toast-stats/commit/271224b114feff3dc3983f9b19a022f918a32d68))
- Division & Area tab empty — unwrap CDN snapshot data key ([#184](https://github.com/taverns-red/toast-stats/issues/184)) ([5b99953](https://github.com/taverns-red/toast-stats/commit/5b9995375a82c819c5b07e2ddb7ebcc26ce57ca1))
- fall back to gsutil ls against GCS when local snapshots are empty. ([519882d](https://github.com/taverns-red/toast-stats/commit/519882d7e72581ef9851642ace696c3d34d91d7c))
- filter 'As of' date rows from district ID parsing ([#145](https://github.com/taverns-red/toast-stats/issues/145)) ([6be4166](https://github.com/taverns-red/toast-stats/commit/6be4166c8ee1adbbaef00692b4b1e172d1c09eff))
- filter club modal trend data by selected program year ([#119](https://github.com/taverns-red/toast-stats/issues/119)) ([42b6c7e](https://github.com/taverns-red/toast-stats/commit/42b6c7e3b068f83e1b374a14fc0ee3b6feab3a46))
- filter non-district CSV rows from auto-discovery; add DATE fallback in Step 4 ([#145](https://github.com/taverns-red/toast-stats/issues/145)) ([aec402b](https://github.com/taverns-red/toast-stats/commit/aec402b3e7af3117e30612f35949560dfd9dde02))
- footer alignment — equal-width columns and right-align disclaimer ([#101](https://github.com/taverns-red/toast-stats/issues/101)) ([00aca13](https://github.com/taverns-red/toast-stats/commit/00aca130033b48e594df923c497e0339e5ecb73c))
- footer vertical alignment — inline-flex on links and consistent line-height ([#101](https://github.com/taverns-red/toast-stats/issues/101)) ([b2cdaf3](https://github.com/taverns-red/toast-stats/commit/b2cdaf3a10849a87b6aa7a2d2b5ad3bf9753e4a4))
- **frontend:** add defensive null checks for leadership insights data ([247e074](https://github.com/taverns-red/toast-stats/commit/247e0747c24dcfe15e7f9ff7288967de2d3c4a35))
- **frontend:** add fallback colors to chart components ([a23c024](https://github.com/taverns-red/toast-stats/commit/a23c024b87ad1f6e3c01ea9b2020707d7ad1d0bb))
- grant Firebase Hosting service agent Cloud Run Invoker role ([2f278a5](https://github.com/taverns-red/toast-stats/commit/2f278a5ebcaf88592c59aea4c45088169e2781bd))
- gsutil cp -r double-nesting — use globs for GCS snapshot upload ([#191](https://github.com/taverns-red/toast-stats/issues/191)) ([6f4a545](https://github.com/taverns-red/toast-stats/commit/6f4a54523f9f648b476b420604e82293344d6c2f))
- load all program-year snapshots in computeDistrictAnalytics for dense club trends ([#108](https://github.com/taverns-red/toast-stats/issues/108), [#113](https://github.com/taverns-red/toast-stats/issues/113)) ([2716f86](https://github.com/taverns-red/toast-stats/commit/2716f86d9205e53798266dbe4ea9bd65fb08eee0))
- lower best practice divisions threshold from 75 to 60 ([#117](https://github.com/taverns-red/toast-stats/issues/117)) ([355402c](https://github.com/taverns-red/toast-stats/commit/355402cc7d17206ccb6bd475a02ffe2233df72f4))
- make spinner visible by combining all query loading states ([03dee2f](https://github.com/taverns-red/toast-stats/commit/03dee2fb9955550ace56518377f0f1255b264f03))
- make theme toggle icon visible on dark footer background ([#120](https://github.com/taverns-red/toast-stats/issues/120)) ([7e07e3c](https://github.com/taverns-red/toast-stats/commit/7e07e3ccf338fafa71a6b8dc25264892875a259f))
- manifest latest.json falls back to GCS listing after rebuild ([#200](https://github.com/taverns-red/toast-stats/issues/200)) ([519882d](https://github.com/taverns-red/toast-stats/commit/519882d7e72581ef9851642ace696c3d34d91d7c))
- member change badge uses payment base and pipeline uses --force-analytics ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([2af26d5](https://github.com/taverns-red/toast-stats/commit/2af26d5fe326b242e6d2dd74621b985ee9a4b603))
- migrate CacheService from node-cache to lru-cache ([ae4adc5](https://github.com/taverns-red/toast-stats/commit/ae4adc5ec8e4d6236c99acc47e46fd9d45f9ef71))
- migrate CacheService from node-cache to lru-cache ([6cf668b](https://github.com/taverns-red/toast-stats/commit/6cf668b9e1d59cd1a2348b3f91e79c9241f1726f))
- mobile UX improvements for tab bar, table columns, and export button ([#85](https://github.com/taverns-red/toast-stats/issues/85), [#86](https://github.com/taverns-red/toast-stats/issues/86), [#87](https://github.com/taverns-red/toast-stats/issues/87)) ([0157450](https://github.com/taverns-red/toast-stats/commit/0157450cefb1c16a719d6d54e1b15b827c03ca2e))
- neutralize Borda count for tied categories and fix copy/date selector ([#197](https://github.com/taverns-red/toast-stats/issues/197), [#198](https://github.com/taverns-red/toast-stats/issues/198), [#180](https://github.com/taverns-red/toast-stats/issues/180)) ([b26e514](https://github.com/taverns-red/toast-stats/commit/b26e514515080ec0b9ffc8b0917247b13a57240f))
- nuke cache/raw-csv before download for clean slate ([#205](https://github.com/taverns-red/toast-stats/issues/205)) ([94f135a](https://github.com/taverns-red/toast-stats/commit/94f135a6728217907eca078d1dff6a00a3ee0fb4))
- patch paymentsTrend with accumulated time-series data ([#206](https://github.com/taverns-red/toast-stats/issues/206)) ([17b1b89](https://github.com/taverns-red/toast-stats/commit/17b1b89b9e445280222a4397eab9285fa7efac40))
- paymentBase field name mismatch and empty topGrowthClubs ([#190](https://github.com/taverns-red/toast-stats/issues/190), [#185](https://github.com/taverns-red/toast-stats/issues/185)) ([652e865](https://github.com/taverns-red/toast-stats/commit/652e865b71bd57f82bbbc77fe02aa89319be0cb5))
- payments trend chart shows 0 — wire performanceTargets from CDN ([#183](https://github.com/taverns-red/toast-stats/issues/183)) ([a08f086](https://github.com/taverns-red/toast-stats/commit/a08f0864899cf3cb3eca1fbbf9c143e854bba0d7))
- prefix numeric district names with 'District' ([#188](https://github.com/taverns-red/toast-stats/issues/188)) ([a1deb0d](https://github.com/taverns-red/toast-stats/commit/a1deb0da0412e8afedaf7ff5adf1d7e6be2fdeba))
- prevent deploy from stripping Cloud Run public access ([0eda63c](https://github.com/taverns-red/toast-stats/commit/0eda63c5f4371b16209fa3639c309973c804e67d))
- rank-history download filename collisions ([#186](https://github.com/taverns-red/toast-stats/issues/186)) ([7f4899a](https://github.com/taverns-red/toast-stats/commit/7f4899a5d50691933f01c89644167217c8ab2fa5))
- rebuild only freshly downloaded dates, not stale dirs ([#205](https://github.com/taverns-red/toast-stats/issues/205)) ([4d669e9](https://github.com/taverns-red/toast-stats/commit/4d669e961a8112b2e1809aec9c94ab61d38b4e65))
- rebuild uses actual snapshot date, not raw-csv date ([#193](https://github.com/taverns-red/toast-stats/issues/193)) ([1b09833](https://github.com/taverns-red/toast-stats/commit/1b09833df983a9c4c7d67da2579fe4eee137a555))
- remove --clean-snapshots from rescrape-historical ([#205](https://github.com/taverns-red/toast-stats/issues/205)) ([ac36756](https://github.com/taverns-red/toast-stats/commit/ac36756477c6a3c94bab665f3f74cdcfc555a339))
- remove [@theme](https://github.com/theme) spacing overrides that broke Tailwind v4 max-w-\* utilities ([c847858](https://github.com/taverns-red/toast-stats/commit/c8478583525f24715830c93388f18c1b06a9ca02))
- remove /api prefix from API URLs — Cloud Run routes at root ([#14](https://github.com/taverns-red/toast-stats/issues/14)) ([48bb7fc](https://github.com/taverns-red/toast-stats/commit/48bb7fcdf7262e680a6d314e4a5cdb18c0227847))
- remove DistrictConfigurationService and update tests for dynamic district discovery ([#139](https://github.com/taverns-red/toast-stats/issues/139)) ([dbe6c77](https://github.com/taverns-red/toast-stats/commit/dbe6c77e0470ec855904f013d66e67263e8145ed))
- remove invalid --force from compute-analytics in rebuild ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([b41d1c9](https://github.com/taverns-red/toast-stats/commit/b41d1c9ec68c0d26bcb6fb3ae145ca00e25d5ade))
- remove redundant district name and date range from Overview ([#81](https://github.com/taverns-red/toast-stats/issues/81)) ([4ea755f](https://github.com/taverns-red/toast-stats/commit/4ea755f341ece30f2106800dabb2c277d6890917))
- remove stale Source Sans 3 [@font-face](https://github.com/font-face) URLs causing 404s ([29f2920](https://github.com/taverns-red/toast-stats/commit/29f29202b01c9905c9ed5bd6c54064f71dc375da))
- remove stale woff2 font preload URLs ([b818ee8](https://github.com/taverns-red/toast-stats/commit/b818ee8b220cc734e87c724d48ba13debcc4aa46))
- remove stray expression and add lesson 29 ([#135](https://github.com/taverns-red/toast-stats/issues/135)) ([12d02a1](https://github.com/taverns-red/toast-stats/commit/12d02a1a48810ac832f1759baaa0d948a1cc7a74))
- remove unknown --cache-dir flag from rebuild command ([#205](https://github.com/taverns-red/toast-stats/issues/205)) ([2cc4f12](https://github.com/taverns-red/toast-stats/commit/2cc4f12d2a2c40fb32e1fce5477fabf65c2bc2fd))
- rename .agents to .agent and add rebuild scripts ([851a364](https://github.com/taverns-red/toast-stats/commit/851a364db955f7ad53bb8273f55c7e20c27f025f))
- rename .agents to .agent and add rebuild scripts ([7becfa0](https://github.com/taverns-red/toast-stats/commit/7becfa0b488cb95c5fca748ff8c7cdb57e5fb697))
- replace fixed 14-day scan window with full next-month prefix filter ([#152](https://github.com/taverns-red/toast-stats/issues/152)) ([9e2d498](https://github.com/taverns-red/toast-stats/commit/9e2d498fa8eb3b32d4c57786f99a8aa219d2bd84))
- resolve eslint v10 lint errors in collector-cli ([#105](https://github.com/taverns-red/toast-stats/issues/105)) ([d170bef](https://github.com/taverns-red/toast-stats/commit/d170bef0b817d3433787b16b1ac353f6be0922f1))
- resolve word-per-line text wrapping in untracked district empty state ([8be8a56](https://github.com/taverns-red/toast-stats/commit/8be8a56172ac6d60578434ace2169ab781577b2e))
- restore API Gateway architecture with correct gateway name ([844d0c8](https://github.com/taverns-red/toast-stats/commit/844d0c803452cdb913723c2e1a7458419627417f))
- restore missing Lesson 06 header in lessons.md ([#84](https://github.com/taverns-red/toast-stats/issues/84)) ([8caecff](https://github.com/taverns-red/toast-stats/commit/8caecffde0e7a114062478c29c8fcf75766327d0))
- retain original rank when search filtering the rankings table ([#102](https://github.com/taverns-red/toast-stats/issues/102)) ([afceb93](https://github.com/taverns-red/toast-stats/commit/afceb933b3461aaea9932b2148f83c4879f21cb3))
- revert DCP progress panel to list-based timeline ([#166](https://github.com/taverns-red/toast-stats/issues/166)) ([eff6256](https://github.com/taverns-red/toast-stats/commit/eff62560a2f56cc15edd1fe7b4db3fca139e54e4))
- revert monthEndDate from daily pipeline — breaks current-month data ([#204](https://github.com/taverns-red/toast-stats/issues/204)) ([5128917](https://github.com/taverns-red/toast-stats/commit/5128917c15f04ab85b5f45cbb00d87e8e08354f6))
- route API through Firebase Hosting rewrite instead of API Gateway ([ac6d84a](https://github.com/taverns-red/toast-stats/commit/ac6d84a2120db4c9ae53a7948e236143c00c660e))
- route API through Firebase Hosting rewrite instead of API Gateway ([86909d7](https://github.com/taverns-red/toast-stats/commit/86909d70d0eee88828403fa7b094ec4b1a090ce3))
- show correct overall rank in comparison panel ([#109](https://github.com/taverns-red/toast-stats/issues/109), [#110](https://github.com/taverns-red/toast-stats/issues/110)) ([d7178ff](https://github.com/taverns-red/toast-stats/commit/d7178ff6189bd61bc1a92451bf4987899a88cac1))
- show empty state immediately for districts without ranking data ([22f3ae8](https://github.com/taverns-red/toast-stats/commit/22f3ae80f0e706dd4d99bfa541e847a0be354404))
- show graceful error state for untracked districts ([d04d6df](https://github.com/taverns-red/toast-stats/commit/d04d6dfe08bb09690810c428f550a94f58fe9105))
- skip GCS nuke for per-year rescrape runs ([#205](https://github.com/taverns-red/toast-stats/issues/205)) ([ecd08e6](https://github.com/taverns-red/toast-stats/commit/ecd08e6c0ad73a6c91c0db799710b86cb11e6647))
- snapshot-index always writes nested format, frontend normalizes on read ([#182](https://github.com/taverns-red/toast-stats/issues/182)) ([b2a7b93](https://github.com/taverns-red/toast-stats/commit/b2a7b93642beff045a726c2a0bdd332083760556))
- snapshot-index format mismatch — support flat and nested formats ([#182](https://github.com/taverns-red/toast-stats/issues/182)) ([f5baac0](https://github.com/taverns-red/toast-stats/commit/f5baac033eaf17273ffdf634f11d8aba7df4b621))
- **snapshot-store:** distribute DCP goals across all clubs to preserve total awards ([17a4ea1](https://github.com/taverns-red/toast-stats/commit/17a4ea1923d49a74cbc3a637a926867848853a36))
- **snapshot-store:** preserve club status counts through round-trip serialization ([44c6751](https://github.com/taverns-red/toast-stats/commit/44c67517913e2595b02b18713f17cac44e95c126))
- sort cached-dates descending (newest first) for consistency ([6a2d1a0](https://github.com/taverns-red/toast-stats/commit/6a2d1a08105bc56a635191b8bbf69da0c75b9816))
- switch GCS bucket to toast-stats-data-ca ([#162](https://github.com/taverns-red/toast-stats/issues/162)) ([0968315](https://github.com/taverns-red/toast-stats/commit/0968315eb4b28d2afca60a43b5136e824f757fc6))
- sync previous year snapshots for YoY comparison ([#77](https://github.com/taverns-red/toast-stats/issues/77)) ([de22b4f](https://github.com/taverns-red/toast-stats/commit/de22b4f0cb59399b49a8b89f3c9d2c2485b698a4))
- treat missing writeComplete as true in GCS snapshot storage ([e92a4c4](https://github.com/taverns-red/toast-stats/commit/e92a4c47174c30439c86631302634d80d056dfd0))
- try allUsers IAM binding for Cloud Run public access ([1c4c64c](https://github.com/taverns-red/toast-stats/commit/1c4c64c42513a298abb01dca66adc13b45c4a7f3))
- update district-snapshot-index in nightly pipeline ([#138](https://github.com/taverns-red/toast-stats/issues/138)) ([bb86ee9](https://github.com/taverns-red/toast-stats/commit/bb86ee93d74d4050937d18d19608ca0b772f80fe))
- update integration and accessibility tests for removed ProgramYearSelector ([89d44df](https://github.com/taverns-red/toast-stats/commit/89d44df7b06cec76d6dbfd0f5653206c588480b6))
- update test mocks for CDN-only analytics ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([a53463d](https://github.com/taverns-red/toast-stats/commit/a53463d53a93f902752c2335228e31c53e299a95))
- use 1h revalidating cache for snapshots/analytics, not 1yr immutable ([#207](https://github.com/taverns-red/toast-stats/issues/207)) ([ca9f1bf](https://github.com/taverns-red/toast-stats/commit/ca9f1bf8add54bfa8db40360e8db60a712a747e2))
- use Compute Engine default SA for Cloud Run invoker binding ([42ea5ed](https://github.com/taverns-red/toast-stats/commit/42ea5ed6f2f047ef5469e52804522bbf0cad3f03))
- use console.error instead of console.log in analytics-core fallback loggers ([#100](https://github.com/taverns-red/toast-stats/issues/100)) ([bbd3396](https://github.com/taverns-red/toast-stats/commit/bbd33968a44a75245c0770a56b9d88f66a0c4fcc))
- use correct API (toast-stats) and gateway (toast-stats-gw) ([8f18cd8](https://github.com/taverns-red/toast-stats/commit/8f18cd848537de4ea7fb1b783ee87ed0ca1d9219))
- use GCS-backed TimeSeriesIndexService on Cloud Run ([fbc0be6](https://github.com/taverns-red/toast-stats/commit/fbc0be6446d1f55ea780f841d8d054e67103eef0))
- use membershipBase fallback for single-snapshot growth score ([#111](https://github.com/taverns-red/toast-stats/issues/111)) ([1cadca0](https://github.com/taverns-red/toast-stats/commit/1cadca09fedba6fdd3347bb84cd69889470e1b2f))
- use standard Tailwind classes for analytics badge visibility ([7910599](https://github.com/taverns-red/toast-stats/commit/79105991a90a59a369d0dc8d744e5037f167398a))
- Validate district IDs when collecting directories and log invalid entries. ([c0c2030](https://github.com/taverns-red/toast-stats/commit/c0c2030703991528e9a800b6fbfb18f34f584e39))
- **validation:** remove inappropriate data freshness checks for historical snapshots ([de2317e](https://github.com/taverns-red/toast-stats/commit/de2317e300aab18d40556259b476bee0ff29af59))
- wrap ClubDetailModal tests with QueryClientProvider ([#79](https://github.com/taverns-red/toast-stats/issues/79)) ([74fd60b](https://github.com/taverns-red/toast-stats/commit/74fd60b5907fa9f4c765c2302c4b60ef0f27342b))

### Refactors

- **admin:** remove authentication and improve dialog responsiveness ([2766fb5](https://github.com/taverns-red/toast-stats/commit/2766fb5175c4202e534e88521f88287f95a7d66b))
- consolidate over-engineered property tests into unit tests ([626f180](https://github.com/taverns-red/toast-stats/commit/626f180584b013096dd48120479efdee724ddf9a))
- convert dates queries to CDN fetchCdnDates ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([7a1c433](https://github.com/taverns-red/toast-stats/commit/7a1c43302bd7918b8f75ee41292bf1c51adcfe6f))
- convert useAggregatedAnalytics and useVulnerableClubs to CDN-only ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([b54e40d](https://github.com/taverns-red/toast-stats/commit/b54e40dd28bbb7fa4e293888ee684ad51bfff6e1))
- decompose SnapshotStore into dedicated reader, writer, disc… ([f51ea74](https://github.com/taverns-red/toast-stats/commit/f51ea743d8a1dc5a384d60f659d373e8b0b1d6f9))
- decompose SnapshotStore into dedicated reader, writer, discovery, and path utility modules. ([cd171e6](https://github.com/taverns-red/toast-stats/commit/cd171e6fe8eb1dd03743d1e5cb63dcc859f02216))
- deduplicate ILogger — import from canonical serviceInterfaces.ts ([90953ee](https://github.com/taverns-red/toast-stats/commit/90953ee2b565662110a8100feb7a19a1ac11ae27))
- **districts:** extract query parameter parsing into shared utility ([ecad695](https://github.com/taverns-red/toast-stats/commit/ecad695fb3b072a3e19131b73b106e6fb9b59908))
- extract CLI helpers and deduplicate verbose logger ([9a24feb](https://github.com/taverns-red/toast-stats/commit/9a24febe229915adabce8a623e11270b16467dc2))
- extract club eligibility calculations to a shared utility t… ([b30df92](https://github.com/taverns-red/toast-stats/commit/b30df9246a89d9eb326b76722d9ecda213c6e14e))
- extract club eligibility calculations to a shared utility to eliminate duplication and fix distinguished level naming inconsistencies. ([155ff98](https://github.com/taverns-red/toast-stats/commit/155ff988a7e3c5c5ded0f5eadcd048181c128946))
- extract CSV parsing and statistics from RawCSVCacheService ([cad0d83](https://github.com/taverns-red/toast-stats/commit/cad0d83a075662644a7730ff7354a161369e1d3f))
- extract OrchestratorCacheAdapter from ScraperOrchestrator ([bdf01b5](https://github.com/taverns-red/toast-stats/commit/bdf01b52f1b150998a99861bb3bb9054186e6eb3))
- extract shared CachePaths module from BackfillOrchestrator and OrchestratorCacheAdapter ([#126](https://github.com/taverns-red/toast-stats/issues/126)) ([28fda10](https://github.com/taverns-red/toast-stats/commit/28fda102f9f66db910631b53f47c03ee2eea74f3))
- extract SnapshotStore types into snapshot/types.ts, migrate type-only consumers ([#129](https://github.com/taverns-red/toast-stats/issues/129)) ([dec1667](https://github.com/taverns-red/toast-stats/commit/dec1667548b3b75afa5fcb8c41fae7377908310e))
- extract types and helpers from oversized frontend hooks ([329b5e6](https://github.com/taverns-red/toast-stats/commit/329b5e667ac39d84a78555883d4596af36ed7395))
- extract types and index utils from FirestoreSnapshotStorage into firestore/ sub-modules ([b2e6665](https://github.com/taverns-red/toast-stats/commit/b2e6665e191ac3c813fb03f7f8c8cbbe4dc36036))
- **frontend:** remove fallback data warning from district detail page ([c64e78d](https://github.com/taverns-red/toast-stats/commit/c64e78d5ae57dc4b0e1310419aa4122ced07231a))
- merge duplicate club detail modals into shared component ([#80](https://github.com/taverns-red/toast-stats/issues/80)) ([cbdf25e](https://github.com/taverns-red/toast-stats/commit/cbdf25e5e7ea3ab8638b069af5f66fc5b76edfff))
- migrate frontend types to shared-contracts — DistrictRanking, ProgramYearWithData, AvailableRankingYearsResponse ([#130](https://github.com/taverns-red/toast-stats/issues/130)) ([8572f0f](https://github.com/taverns-red/toast-stats/commit/8572f0f1ca76ff3a5ef172c509f3075e83a695bd))
- migrate property-based tests to standard unit tests across … ([f6b46fb](https://github.com/taverns-red/toast-stats/commit/f6b46fb318e10744921cb6c2a8862c84d66d61d9))
- migrate property-based tests to standard unit tests across various modules. ([48642ef](https://github.com/taverns-red/toast-stats/commit/48642ef44658a93e3b1723ac4e2e7d6f7324e6b3))
- remove API Gateway, use HTTPS LB at api.taverns.red ([#14](https://github.com/taverns-red/toast-stats/issues/14)) ([8fe4d90](https://github.com/taverns-red/toast-stats/commit/8fe4d9048b76465b8f06fefec2d802f2d19f6e07))
- remove DCPProjectionsTable from Analytics tab ([#187](https://github.com/taverns-red/toast-stats/issues/187)) ([61ed46a](https://github.com/taverns-red/toast-stats/commit/61ed46a3c89b35d1c5d9e419c80f2931eec5c180))
- remove dead-weight admin system ([4dca7bb](https://github.com/taverns-red/toast-stats/commit/4dca7bbf02d05ac6840993da161738ea066c294d))
- Remove legacy JavaScript analytics modules and update related TypeScript interfaces and utilities. ([bf72eac](https://github.com/taverns-red/toast-stats/commit/bf72eac13deab09e88db5169964ffd1fad9d0533))
- Remove meta-level property tests for test utilities and upd… ([51fe303](https://github.com/taverns-red/toast-stats/commit/51fe303e15a6a8fc6e129de42c0304693a651ed6))
- Remove meta-level property tests for test utilities and update various existing property tests. ([36a44c1](https://github.com/taverns-red/toast-stats/commit/36a44c13ebc57e7f9629f396393c533cf1534358))
- remove stale Express API references ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([071fa67](https://github.com/taverns-red/toast-stats/commit/071fa676d2d7898834bde63677a18d1df222b166))
- rename scraper-cli to collector-cli across the codebase ([#99](https://github.com/taverns-red/toast-stats/issues/99)) ([eac9a3b](https://github.com/taverns-red/toast-stats/commit/eac9a3ba3d1b857e0c53efeef953584b73edae66))
- renumber an existing lesson and remove two lessons from `lessons.md` ([1aad223](https://github.com/taverns-red/toast-stats/commit/1aad22365db8e1ddfcfe3c805208ea1ca6575f2e))
- Restructure analytics types into domain-specific files and extract frontend hook logic into reusable utilities. ([2ae8d96](https://github.com/taverns-red/toast-stats/commit/2ae8d961708e4bb81d93bbf41e70c432f2ea9448))
- split designTokens.ts into domain-specific modules ([#134](https://github.com/taverns-red/toast-stats/issues/134)) ([d56746e](https://github.com/taverns-red/toast-stats/commit/d56746e47c022d1216fe8712e616fd64aed56c09))
- split types.ts (1218 lines) into 8 domain files with re-export barrel ([b704cc8](https://github.com/taverns-red/toast-stats/commit/b704cc8215bede4736c61c747d58a925a475a4df))

### Performance

- add GCS cache warm-up for efficient resume ([#123](https://github.com/taverns-red/toast-stats/issues/123)) ([0d9d06e](https://github.com/taverns-red/toast-stats/commit/0d9d06e763b59fef1f8127b6d9805ddddd3f8c75))
- increase rescrape download rate from 2 to 8 req/sec ([#205](https://github.com/taverns-red/toast-stats/issues/205)) ([44e96e8](https://github.com/taverns-red/toast-stats/commit/44e96e87e1fe9fbea818384092deaa1b9f1acf4f))
- migrate daily pipeline from Playwright to HTTP CSV downloads ([#124](https://github.com/taverns-red/toast-stats/issues/124)) ([004bdd4](https://github.com/taverns-red/toast-stats/commit/004bdd4452354420a92f810591f9a6f7d8c6c2e9))
- optimize /cache/dates and /cached-dates endpoints ([1f5c063](https://github.com/taverns-red/toast-stats/commit/1f5c063185d753b1522dbd803e77d19296c5568b))
- optimize global rankings tab load time ([#115](https://github.com/taverns-red/toast-stats/issues/115)) ([5f2edf9](https://github.com/taverns-red/toast-stats/commit/5f2edf987a8b159e924210fe2600604b12996976))
- parallelize rank-history GCS reads with pre-filtering and caching ([b1f4ce2](https://github.com/taverns-red/toast-stats/commit/b1f4ce2ec6856f753d19ac385328d16021fe74e9))
- parallelize time-series CDN overlay uploads in all pipeline modes ([717ac27](https://github.com/taverns-red/toast-stats/commit/717ac27762f71d5d2f2018b045d4a4e3459b9663))
- replace listSnapshots with listSnapshotIds + add batch rank-history endpoint ([2411b1d](https://github.com/taverns-red/toast-stats/commit/2411b1d8feb32746fec47d6aaf2f9d3359d43fbf))
- two-phase approach reads ~10 GCS files instead of ~2000 ([a8029e0](https://github.com/taverns-red/toast-stats/commit/a8029e0652902a0881197d029d6148215d1a6428))

### Documentation

- Add a blank line for spacing in the formatting workflow documentation. ([2d0c5bf](https://github.com/taverns-red/toast-stats/commit/2d0c5bf9e488919819a699cf54590fbf6288b343))
- Add a blank line for spacing in the formatting workflow documentation. ([adbbde4](https://github.com/taverns-red/toast-stats/commit/adbbde4d2038888cd35c2d1bd01c09e65bd02c5f))
- add architecture, design system, and ADR documents ([#202](https://github.com/taverns-red/toast-stats/issues/202)) ([439c4d0](https://github.com/taverns-red/toast-stats/commit/439c4d0043d1bd44b46b43e7db3cfaf6e6932902))
- add Borda tie-neutralization lesson ([#198](https://github.com/taverns-red/toast-stats/issues/198)) ([9f934b4](https://github.com/taverns-red/toast-stats/commit/9f934b453a93f14ba32cadcd002d15be11a5b7b7))
- add bulk-cdn-hook-conversion lesson ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([315ab9e](https://github.com/taverns-red/toast-stats/commit/315ab9e860dbef5b48ff1ea6ff90a5d9d68c5ff3))
- add cdn-rankings-conversion lesson ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([0d5b295](https://github.com/taverns-red/toast-stats/commit/0d5b29577707e40ec696a83d9d9e8cc5f285b839))
- add club detail card review and dead code analysis ([ab807d1](https://github.com/taverns-red/toast-stats/commit/ab807d122a5ce63089bedbacd530e40a7d53f2cf))
- add curated rules.md, /before-task workflow, and trim lessons.md header ([67e0278](https://github.com/taverns-red/toast-stats/commit/67e02783880f61dd10bdf97930f821c22ab8e475))
- add deploy-verify workflow for live site validation ([9030db6](https://github.com/taverns-red/toast-stats/commit/9030db63d761782b49f6f4b8df902571fef9450d))
- add documentation detailing code formatting rules, Prettier configuration, and verification steps. ([70f89ff](https://github.com/taverns-red/toast-stats/commit/70f89ff7ee9c579e2f22090e3cf50cfb2b6efcd7))
- add documentation detailing code formatting rules, Prettier configuration, and verification steps. ([078c772](https://github.com/taverns-red/toast-stats/commit/078c7726d50952eb563fd976f4e1f9eac09e2af9))
- add feature specs for cached-dates optimization, district coverage, and statistics response ([9e3ff67](https://github.com/taverns-red/toast-stats/commit/9e3ff6787979c54bc8cad3cc3725fe2c7a9debf3))
- add fields parameter to statistics endpoint in openapi specs ([a4b015d](https://github.com/taverns-red/toast-stats/commit/a4b015d27d678791e4dfa5463c01ef7880b45666))
- add lesson — gsutil cp -r double-nesting bug ([#191](https://github.com/taverns-red/toast-stats/issues/191)) ([2924cc3](https://github.com/taverns-red/toast-stats/commit/2924cc338f7827e89c464ca13641abb44643c781))
- add lesson — streaming rebuild for disk-bounded CI ([#191](https://github.com/taverns-red/toast-stats/issues/191)) ([89f6aed](https://github.com/taverns-red/toast-stats/commit/89f6aed88132b0201485be7bfd934d02d84e7351))
- add lesson — Tier 1 pipeline data quality bugs ([#190](https://github.com/taverns-red/toast-stats/issues/190), [#185](https://github.com/taverns-red/toast-stats/issues/185), [#186](https://github.com/taverns-red/toast-stats/issues/186)) ([2bacab4](https://github.com/taverns-red/toast-stats/commit/2bacab4b29a7c8679277b84126d402d3f2106a44))
- add lesson 04 — summary vs full analytics data granularity ([#76](https://github.com/taverns-red/toast-stats/issues/76)) ([bbaaf4f](https://github.com/taverns-red/toast-stats/commit/bbaaf4f7e392040f06539cfd525fa3c691f73a33))
- add lesson 06 — above-the-fold layout reorder ([#83](https://github.com/taverns-red/toast-stats/issues/83)) ([8e22948](https://github.com/taverns-red/toast-stats/commit/8e22948d11938f329aa910218fa39d877229d3a6))
- add lesson 06 — identify correct component before coding ([#83](https://github.com/taverns-red/toast-stats/issues/83)) ([54311d4](https://github.com/taverns-red/toast-stats/commit/54311d4d5e8dbb5290c061d17f8414902c086b29))
- add lesson 07 — pure frontend projections ([#6](https://github.com/taverns-red/toast-stats/issues/6)) ([3e4099c](https://github.com/taverns-red/toast-stats/commit/3e4099cc85feb8efef95cd7fa371ead6ed57b30d))
- add lesson 08 — pre-computed type contracts ([#84](https://github.com/taverns-red/toast-stats/issues/84)) ([90ff2d8](https://github.com/taverns-red/toast-stats/commit/90ff2d87ef60de39bf8ba4e9e9ffba240a817304))
- add lesson 09 — batching similar mobile issues ([#85](https://github.com/taverns-red/toast-stats/issues/85), [#86](https://github.com/taverns-red/toast-stats/issues/86), [#87](https://github.com/taverns-red/toast-stats/issues/87)) ([e33bc8a](https://github.com/taverns-red/toast-stats/commit/e33bc8a021a6245c60f17101956cc5c75564372a))
- add lesson 12 — global UI elements in router layout ([#88](https://github.com/taverns-red/toast-stats/issues/88)) ([b46d4c0](https://github.com/taverns-red/toast-stats/commit/b46d4c07965b8c998174fc842c18b9449bea587b))
- add lesson 13 — reuse existing helpers before creating new ones ([#90](https://github.com/taverns-red/toast-stats/issues/90)) ([1cdde27](https://github.com/taverns-red/toast-stats/commit/1cdde27c1ab5654b7f40d978bcae53e0d537db73))
- add lesson 16 — factory path resolution in test assertions ([#103](https://github.com/taverns-red/toast-stats/issues/103)) ([6bef653](https://github.com/taverns-red/toast-stats/commit/6bef653c80a7005c9ffea2f96fad2c3e6c06e26b))
- add lesson 17 — include hidden dirs in bulk renames ([#99](https://github.com/taverns-red/toast-stats/issues/99)) ([29c7e8b](https://github.com/taverns-red/toast-stats/commit/29c7e8b29bd716c016a87ec6fc8bdf3acf45330d))
- add lesson 18 — normalize heterogeneous metrics for radar chart ([#93](https://github.com/taverns-red/toast-stats/issues/93)) ([700df41](https://github.com/taverns-red/toast-stats/commit/700df419e4d0de744bac4da7a69183065188ec8f))
- add Lesson 19 about Dependabot major bump compatibility ([#105](https://github.com/taverns-red/toast-stats/issues/105)) ([895e452](https://github.com/taverns-red/toast-stats/commit/895e4528a462c6046b5882919251551b6dd7e052))
- add lesson 20 about CSS-level dark mode strategy ([#120](https://github.com/taverns-red/toast-stats/issues/120)) ([2ff9f83](https://github.com/taverns-red/toast-stats/commit/2ff9f83a7724f98e2c69f844d35e35b5cc7933c4))
- add lesson 22 — don't infer context from data when parent knows ([#119](https://github.com/taverns-red/toast-stats/issues/119)) ([19f30e0](https://github.com/taverns-red/toast-stats/commit/19f30e0b5d5ee17873574eab59acc661dae34cc7))
- add lesson 23 — probe for direct download URLs ([#123](https://github.com/taverns-red/toast-stats/issues/123)) ([2f64835](https://github.com/taverns-red/toast-stats/commit/2f648352d21b783bd4a7546a314ae6f4e5b7dc01))
- add lesson 24 on in-memory index pattern ([#115](https://github.com/taverns-red/toast-stats/issues/115)) ([86e79bb](https://github.com/taverns-red/toast-stats/commit/86e79bb3f864bfe93532a058a7f286f8930e631a))
- add lesson 25 — data collection storage contract ([#125](https://github.com/taverns-red/toast-stats/issues/125)) ([c49b102](https://github.com/taverns-red/toast-stats/commit/c49b1022216ca02f30c084d0aaf120276cf38132))
- add Lesson 28 — default return values mask data availability ([#111](https://github.com/taverns-red/toast-stats/issues/111)) ([c4cccf4](https://github.com/taverns-red/toast-stats/commit/c4cccf4cd3805ebad8cfcf62e85c7b70144658ce))
- add lesson 30 — replace external process deps with HTTP ([#124](https://github.com/taverns-red/toast-stats/issues/124)) ([91b52e3](https://github.com/taverns-red/toast-stats/commit/91b52e30d888c79150f6d21be128b7b8a00d52e7))
- add lesson 31 — investigate duplication claims before refactoring ([#127](https://github.com/taverns-red/toast-stats/issues/127), [#129](https://github.com/taverns-red/toast-stats/issues/129)) ([b6e7a2f](https://github.com/taverns-red/toast-stats/commit/b6e7a2fb1d64daef5a986da4e075b2d52693ade0))
- add lesson 34 for pipeline whitelist removal companion to [#141](https://github.com/taverns-red/toast-stats/issues/141) ([f340ed6](https://github.com/taverns-red/toast-stats/commit/f340ed637e54c986d5c23be7717630c3d2c28d9b))
- add lesson 36 for CSV footer rows as district IDs ([#145](https://github.com/taverns-red/toast-stats/issues/145)) ([57d6be8](https://github.com/taverns-red/toast-stats/commit/57d6be86156b66234b235f8bcdacf54eabfc3fe5))
- add lesson 37 for month-end closing-period raw-csv source of truth ([#140](https://github.com/taverns-red/toast-stats/issues/140)) ([a15a4a5](https://github.com/taverns-red/toast-stats/commit/a15a4a54f5622e0e0d7142bd5b52a325cb0d9b71))
- add lesson 38 — cdn-only backend deletion ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([324119a](https://github.com/taverns-red/toast-stats/commit/324119aa916c92abbaba92864ab7a3bd3d852f57))
- add lesson for [#183](https://github.com/taverns-red/toast-stats/issues/183) — CDN data without frontend hooks ([#183](https://github.com/taverns-red/toast-stats/issues/183)) ([0b791ba](https://github.com/taverns-red/toast-stats/commit/0b791ba7ebb7d5bd4db7a8d3b7fa0b5c60db37ed))
- add lesson for [#184](https://github.com/taverns-red/toast-stats/issues/184) — CDN data key unwrapping ([#184](https://github.com/taverns-red/toast-stats/issues/184)) ([d9fc377](https://github.com/taverns-red/toast-stats/commit/d9fc37783f51f3c4264690e202e647dda18afd66))
- add lesson for export.aspx 4-segment URL format ([#204](https://github.com/taverns-red/toast-stats/issues/204)) ([d3af8c4](https://github.com/taverns-red/toast-stats/commit/d3af8c42846ef8310525142c41801d974abbd1f4))
- add lesson on date-based chart positioning ([#79](https://github.com/taverns-red/toast-stats/issues/79)) ([7a3679b](https://github.com/taverns-red/toast-stats/commit/7a3679bc6ad878909fb6b4688ebac8b5b1a0e8bc))
- add lesson on validation gaps in façade layers ([#75](https://github.com/taverns-red/toast-stats/issues/75)) ([54ca897](https://github.com/taverns-red/toast-stats/commit/54ca897796502f9555bb8a5539d7fd4fac474fdc))
- add lessons — payments≠members, time-series gap, force-analytics flag ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([ee70f8c](https://github.com/taverns-red/toast-stats/commit/ee70f8cbbb5e5d7432c2cd21def67bcf01b98d66))
- add lessons 14-15 — search pipeline patterns and pre-push failures ([#91](https://github.com/taverns-red/toast-stats/issues/91), [#92](https://github.com/taverns-red/toast-stats/issues/92)) ([8d0a5b6](https://github.com/taverns-red/toast-stats/commit/8d0a5b63be5172f8cc3d147380ea0066db5b61da))
- add lessons 32-33 for DistrictConfigurationService removal and property test isolation ([#139](https://github.com/taverns-red/toast-stats/issues/139)) ([211edf8](https://github.com/taverns-red/toast-stats/commit/211edf8566cfe41b3322116202ab5da20b989461))
- add lessons for corrupt CSV and penultimate retention ([#199](https://github.com/taverns-red/toast-stats/issues/199), [#203](https://github.com/taverns-red/toast-stats/issues/203)) ([7164f80](https://github.com/taverns-red/toast-stats/commit/7164f80f024023fae2aab9c868029ee9abcd406f))
- add lessons from Sprint 4 ([#170](https://github.com/taverns-red/toast-stats/issues/170), [#194](https://github.com/taverns-red/toast-stats/issues/194)) ([3b68898](https://github.com/taverns-red/toast-stats/commit/3b6889805886779ebcef13355ebdcde830395b84))
- add lessons from Sprint 5 ([#208](https://github.com/taverns-red/toast-stats/issues/208), [#187](https://github.com/taverns-red/toast-stats/issues/187)) ([832c7b3](https://github.com/taverns-red/toast-stats/commit/832c7b36d3e849950cf928bb6975641991c0ab80))
- add lessons from Sprint 6 ([#173](https://github.com/taverns-red/toast-stats/issues/173), [#192](https://github.com/taverns-red/toast-stats/issues/192)) ([0ff9045](https://github.com/taverns-red/toast-stats/commit/0ff9045a6fa3adf74270f23a5b7c4a1105b4fa0f))
- add membership dues payment schedule to rules reference ([a9aa97d](https://github.com/taverns-red/toast-stats/commit/a9aa97de4be3e4f217247a1ca41056b17009acdc))
- Add PBT justification comments to existing property-based tests. ([9af8885](https://github.com/taverns-red/toast-stats/commit/9af8885bffbdce4c98822832f55173892d5bcc5e))
- add product-spec.md — shipped features, business rules, architecture decisions ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([943e878](https://github.com/taverns-red/toast-stats/commit/943e87878c25f3a97c4bf90c4b059510dde8120f))
- add rules.md update field to lesson format; add post-lesson eval gate to /before-task ([d975918](https://github.com/taverns-red/toast-stats/commit/d9759182854ff2376944633ed5240e0e4fe3b3e7))
- add TODO for raising coverage thresholds ([195604b](https://github.com/taverns-red/toast-stats/commit/195604b984308077974747a9c84f4e24bcb51add))
- add Wave 1 lessons — dead code auditing and chart range padding ([#133](https://github.com/taverns-red/toast-stats/issues/133), [#107](https://github.com/taverns-red/toast-stats/issues/107)) ([cff6496](https://github.com/taverns-red/toast-stats/commit/cff6496b55884bbf6ea3554c0878868880082473))
- **analytics:** add precomputed analytics availability specification and design ([8435bb0](https://github.com/taverns-red/toast-stats/commit/8435bb05377387c3f79ff52820413b9ef49c8130))
- **api:** establish API documentation steering standards and update specs ([bd3e08b](https://github.com/taverns-red/toast-stats/commit/bd3e08bbd789e6aec2cc5fcb0e7852ec03994dfc))
- Archive the specification for removing backend backfill. ([de1dd89](https://github.com/taverns-red/toast-stats/commit/de1dd894149a36723633e8e5bc915eb8bc4798a3))
- **backend:** update service architecture and analytics pipeline documentation ([805792c](https://github.com/taverns-red/toast-stats/commit/805792ca709155096c9042412a6fe437ec7062bc))
- **backfill:** add force-cancel stuck jobs specification and design ([5fe4ecc](https://github.com/taverns-red/toast-stats/commit/5fe4ecc31d83931247f803b1c8d3955d648dac27))
- **backfill:** add unified backfill service specification and design ([89d2449](https://github.com/taverns-red/toast-stats/commit/89d2449e6d35585428ed447d63ba40f342d13756))
- correct lesson 15 — never bypass failing tests with --no-verify ([2e2bcc3](https://github.com/taverns-red/toast-stats/commit/2e2bcc3812fad26a1ef21cb73be917dab66b75c1))
- **firestore:** add write timeout fix specification and design ([eea8381](https://github.com/taverns-red/toast-stats/commit/eea8381aa85d1412d608b75ed90e1cc2b44762ae))
- fix lesson [#11](https://github.com/taverns-red/toast-stats/issues/11) formatting to match established template ([#89](https://github.com/taverns-red/toast-stats/issues/89)) ([7ed8005](https://github.com/taverns-red/toast-stats/commit/7ed800580c146670de2ad28c17168339fda9417a))
- fix lesson ordering, numbering, and template compliance ([#121](https://github.com/taverns-red/toast-stats/issues/121), [#122](https://github.com/taverns-red/toast-stats/issues/122)) ([28c3b80](https://github.com/taverns-red/toast-stats/commit/28c3b807312d4247a211750e9a313faafd3aa8e5))
- lesson on Tailwind opacity-variant classes bypassing CSS variable overrides ([#121](https://github.com/taverns-red/toast-stats/issues/121), [#122](https://github.com/taverns-red/toast-stats/issues/122)) ([ecaaa44](https://github.com/taverns-red/toast-stats/commit/ecaaa4414254d73b85a2bcb808e78d7660a2e5aa))
- Move `v8-heap-configuration` specification from active to archived. ([6a258eb](https://github.com/taverns-red/toast-stats/commit/6a258eb233cdf3408170a86f6f13adcc79bb0737))
- **openapi:** add admin backfill endpoints for pre-computed analytics ([6319a75](https://github.com/taverns-red/toast-stats/commit/6319a7503632daa3669e4d3a2a24bf4a030ae497))
- **openapi:** add analytics summary and snapshot deletion endpoints ([e0b1c20](https://github.com/taverns-red/toast-stats/commit/e0b1c20791bd421553b7bd49875dedb552d87bb5))
- **openapi:** add system health metrics endpoint documentation ([5b563df](https://github.com/taverns-red/toast-stats/commit/5b563df3ed38c5748bd4c98fdb78bba8deceb1df))
- **rankings:** add district validation fix specification and design ([ca62f6a](https://github.com/taverns-red/toast-stats/commit/ca62f6a74da1469af614f0d88f045739498d69b9))
- reformat lessons 35-37 to match established convention ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([6cbe9f2](https://github.com/taverns-red/toast-stats/commit/6cbe9f210aeb2f92f2aa4fc6b2e8109df7063b70))
- reformat lessons.md — standardize all entries to 5-section template ([#89](https://github.com/taverns-red/toast-stats/issues/89)) ([43b331c](https://github.com/taverns-red/toast-stats/commit/43b331cad8567b81751b8c4a0b2902957aaf7ae5))
- reverse lessons.md to newest-first; add lesson 35 for ClubTrendsStore pattern ([#144](https://github.com/taverns-red/toast-stats/issues/144)) ([6885a5a](https://github.com/taverns-red/toast-stats/commit/6885a5af1784d9f3b4d9ba6a28610ed6d5ad7279))
- sort lessons.md oldest-first to match natural cat-append order; update header guidance ([eacdd67](https://github.com/taverns-red/toast-stats/commit/eacdd670526ed90490f0359ef28aa54aa0860dec))
- **specs:** add backend-computation-removal specification ([29cc1c7](https://github.com/taverns-red/toast-stats/commit/29cc1c7bb0e354b6dc0b354b52e4179f524955b5))
- **specs:** add club status value mismatch specification ([e283b04](https://github.com/taverns-red/toast-stats/commit/e283b0439ac1d56a01ced2949d408fe41176838b))
- **specs:** add distinguished-clubs-type-fix specification ([25c1547](https://github.com/taverns-red/toast-stats/commit/25c1547865de8e1b498673d235ad09766112d5c3))
- **specs:** add district analytics performance specification ([d4271ed](https://github.com/taverns-red/toast-stats/commit/d4271edce1f7fa340bff8293870fb086e69fb1b7))
- **specs:** add district overview data consistency specification ([8033322](https://github.com/taverns-red/toast-stats/commit/80333221f71466a2b8353aee3fc9cb8df7160ff6))
- **specs:** add per-metric rankings specification ([beee14d](https://github.com/taverns-red/toast-stats/commit/beee14dac040343c9d0f2c28d3f0bf352eed14ef))
- **specs:** add precomputed analytics alignment specification ([9a091a4](https://github.com/taverns-red/toast-stats/commit/9a091a43e44e7c9b277c2fc7043c3d9fff9f20bf))
- **specs:** add projected year-end simplification specification ([35840a7](https://github.com/taverns-red/toast-stats/commit/35840a7b94ded9644b66dfdaa216436fc5329013))
- **specs:** add refresh-service-computation-removal specification ([5fae00d](https://github.com/taverns-red/toast-stats/commit/5fae00d22f2e441418966ba7552e5a3de44a6cf1))
- **specs:** add shared data contracts specification ([e1d5103](https://github.com/taverns-red/toast-stats/commit/e1d510371d8a94e470c712c7dabe9f12a50f390d))
- **specs:** archive admin-panel-bug-fixes and add test-consolidation specification ([345fafd](https://github.com/taverns-red/toast-stats/commit/345fafd27bfa38b64460c4e48bbc92da80b75923))
- **steering:** add comprehensive platform engineering and performance standards ([b8a3cb9](https://github.com/taverns-red/toast-stats/commit/b8a3cb975a7a360848a3a113fcf5f69fa13a9306))
- **steering:** add data computation separation architectural guidelines ([ad33531](https://github.com/taverns-red/toast-stats/commit/ad335317603ae340009678fae36a8e293c97286e))
- **steering:** consolidate property-based testing guidance into testing standards ([c8b6ef6](https://github.com/taverns-red/toast-stats/commit/c8b6ef64deeaff0da600071bf9e2ba4e67ae31df))
- update README and deployment checklist to reflect current architecture ([#98](https://github.com/taverns-red/toast-stats/issues/98)) ([6381e6e](https://github.com/taverns-red/toast-stats/commit/6381e6eed947736d93e7ea4535477a18dd067e55))

### Tests

- add CDN module mock to useAggregatedAnalytics tests ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([3978abc](https://github.com/taverns-red/toast-stats/commit/3978abc9696a0f12ac63475e0cc8748618a24fd2))
- add diagnostic context to flaky snapshot detail test ([426b94e](https://github.com/taverns-red/toast-stats/commit/426b94e1e77823aacca5660f90551cbac388c66e))
- add failing tests for ComparisonPanel and LandingPage comparison mode ([#93](https://github.com/taverns-red/toast-stats/issues/93)) ([da57250](https://github.com/taverns-red/toast-stats/commit/da572508ead791aed070180f96ec6f3b2cad44dd))
- add failing tests for topGrowthClubs and dcpGoalAnalysis ([#84](https://github.com/taverns-red/toast-stats/issues/84)) ([82e1bda](https://github.com/taverns-red/toast-stats/commit/82e1bda4a89ec6764bd634ade03e8d580f6a5970))
- add fields query parameter tests for statistics endpoint ([e5e549a](https://github.com/taverns-red/toast-stats/commit/e5e549a381af709e7d276fdfe48fab0494940079))
- add post-deployment integration tests for live site audit ([7aa699f](https://github.com/taverns-red/toast-stats/commit/7aa699ffc518f3fe09c4712aa978523dbc75ec1f))
- **districts:** optimize Firestore error handling test timeouts for CI ([a4cb98f](https://github.com/taverns-red/toast-stats/commit/a4cb98f027f7abeb70cb65c93ccb55e3f30ba316))
- **firestore-indexes:** remove single-field index test and update requirements ([3d05085](https://github.com/taverns-red/toast-stats/commit/3d0508587eba871cf3f119d1db2db07b7f06f6e3))
- fix monthEndDates.test.ts vitest import ([#152](https://github.com/taverns-red/toast-stats/issues/152)) ([926ed88](https://github.com/taverns-red/toast-stats/commit/926ed884be704e887be35805edde16f983c75992))
- fix useGlobalRankings tests for batch rank-history endpoint ([5435db7](https://github.com/taverns-red/toast-stats/commit/5435db7c8bd1d7c4efa873caaf0ecbd02220d0df))
- mock useDistricts in LandingPage tests to fix mock sequence ([f8a02fc](https://github.com/taverns-red/toast-stats/commit/f8a02fcdbb5312d15054f334f677268b122b268f))
- **scraper-cli:** add comprehensive rankings calculation tests ([1d7e54b](https://github.com/taverns-red/toast-stats/commit/1d7e54bcc3e06cab7da1ef25a2dd49e8f448c97b))
- **scraper-cli:** update metadata and manifest schema to backend-compatible format ([1b0b72b](https://github.com/taverns-red/toast-stats/commit/1b0b72bdfeef249707a554334758dfbe374a754f))
- update AvailableProgramYearsService tests to use ISnapshotStorage mocks ([cd96bb4](https://github.com/taverns-red/toast-stats/commit/cd96bb4f9e210b622b8aa5879e6fb233b6424715))
- update rank-history tests for RankHistoryIndex ([#115](https://github.com/taverns-red/toast-stats/issues/115)) ([f52ba7c](https://github.com/taverns-red/toast-stats/commit/f52ba7c1b6c0bcb46d13f29d271b603720ee608e))

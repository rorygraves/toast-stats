# Changelog

## [3.6.0](https://github.com/taverns-red/toast-stats/compare/frontend-v3.5.1...frontend-v3.6.0) (2026-05-30)


### Features

* **charts:** apply sparkline-then-expand to District Trends, Club detail, Rankings ([#875](https://github.com/taverns-red/toast-stats/issues/875)) ([#927](https://github.com/taverns-red/toast-stats/issues/927)) ([286f5b7](https://github.com/taverns-red/toast-stats/commit/286f5b787e884072c1e002888fce860949f303f8))
* **charts:** sparkline-then-expand wrapper for mobile ([#874](https://github.com/taverns-red/toast-stats/issues/874)) ([#926](https://github.com/taverns-red/toast-stats/issues/926)) ([a5c978a](https://github.com/taverns-red/toast-stats/commit/a5c978a6fe12f978ffa699e36015a78f265b730c))
* **chrome:** collapse page header sub-line into title on mobile ([#890](https://github.com/taverns-red/toast-stats/issues/890)) ([#946](https://github.com/taverns-red/toast-stats/issues/946)) ([71673bf](https://github.com/taverns-red/toast-stats/commit/71673bf4986c29a15614e8da5ed15a2bcce2fbf8))
* **chrome:** drop full footer on mobile; version+license behind 'About ▾' in hamburger ([#889](https://github.com/taverns-red/toast-stats/issues/889)) ([#945](https://github.com/taverns-red/toast-stats/issues/945)) ([61d621a](https://github.com/taverns-red/toast-stats/commit/61d621a8c1805219627312c554cf2b313bed0fe7))
* **ci:** harden Lighthouse/CLS gate against CDN flakes ([#915](https://github.com/taverns-red/toast-stats/issues/915)) ([#921](https://github.com/taverns-red/toast-stats/issues/921)) ([035290c](https://github.com/taverns-red/toast-stats/commit/035290c9bb98d6c7fab42de91a0394f1b9b897d8))
* **district:** 2×2 KPI grid on mobile ([#866](https://github.com/taverns-red/toast-stats/issues/866)) ([#899](https://github.com/taverns-red/toast-stats/issues/899)) ([6322716](https://github.com/taverns-red/toast-stats/commit/6322716073777346072fe833043466ea21861e31))
* **district:** cap upcoming renewals to Next 3 on mobile with 'Show all →' ([#869](https://github.com/taverns-red/toast-stats/issues/869)) ([#907](https://github.com/taverns-red/toast-stats/issues/907)) ([97c2950](https://github.com/taverns-red/toast-stats/commit/97c2950e9d43d5b4db364495476b36ea4ce6ad06))
* **district:** fold Milestones + Longest-Serving Clubs on mobile ([#867](https://github.com/taverns-red/toast-stats/issues/867)) ([#905](https://github.com/taverns-red/toast-stats/issues/905)) ([c18c7f8](https://github.com/taverns-red/toast-stats/commit/c18c7f83a9040ef6c29c0c4595f524f27d215ba1))
* **district:** replace payment composition donut with inline sparkbar at 375px ([#868](https://github.com/taverns-red/toast-stats/issues/868)) ([#906](https://github.com/taverns-red/toast-stats/issues/906)) ([842de71](https://github.com/taverns-red/toast-stats/commit/842de711944feeb5af94345fd17739f2aac76d80))
* **flake:** flake-detection harness, quarantine mechanism & baseline metric ([#913](https://github.com/taverns-red/toast-stats/issues/913)) ([#919](https://github.com/taverns-red/toast-stats/issues/919)) ([b105ac7](https://github.com/taverns-red/toast-stats/commit/b105ac7e013067ef19b123036cc24568a8661a23))
* **landing:** cap districts list to top-20 on mobile with 'Show all' disclosure ([#863](https://github.com/taverns-red/toast-stats/issues/863)) ([#896](https://github.com/taverns-red/toast-stats/issues/896)) ([3674cbf](https://github.com/taverns-red/toast-stats/commit/3674cbfe7f0a859a19e8c48729497709468a1185))
* **landing:** defer Awards Race behind a 'See Awards →' link on mobile ([#862](https://github.com/taverns-red/toast-stats/issues/862)) ([#895](https://github.com/taverns-red/toast-stats/issues/895)) ([5829c47](https://github.com/taverns-red/toast-stats/commit/5829c47c6808d66fdcb49e50dc26df6b376665d1))
* **landing:** hoist 'Find your district' picker above the fold; demote KPI strip to a single tile on mobile ([#861](https://github.com/taverns-red/toast-stats/issues/861)) ([#894](https://github.com/taverns-red/toast-stats/issues/894)) ([9c0b968](https://github.com/taverns-red/toast-stats/commit/9c0b968570d581246ecc1c01daa06431c3b190d3))
* **long-text:** 'what does this page answer?' lede on /methodology + /history ([#879](https://github.com/taverns-red/toast-stats/issues/879)) ([#936](https://github.com/taverns-red/toast-stats/issues/936)) ([7d40f44](https://github.com/taverns-red/toast-stats/commit/7d40f4406ba578ec288fb748887521768df55aba))
* **long-text:** mobile-collapsed H2 sections + TOC anchor expand on /methodology ([#877](https://github.com/taverns-red/toast-stats/issues/877)) ([#934](https://github.com/taverns-red/toast-stats/issues/934)) ([ab668bd](https://github.com/taverns-red/toast-stats/commit/ab668bd86009f3bc15838885d705b6d97e8ab196))
* **long-text:** sticky 'Jump to ▾' chip under the page header ([#878](https://github.com/taverns-red/toast-stats/issues/878)) ([#935](https://github.com/taverns-red/toast-stats/issues/935)) ([41a4b7e](https://github.com/taverns-red/toast-stats/commit/41a4b7e820284b2a2efdb06a85eee7fb73cb0f9a))
* **region:** card-based empty/error states for /region/:n ([#883](https://github.com/taverns-red/toast-stats/issues/883)) ([#941](https://github.com/taverns-red/toast-stats/issues/941)) ([5866875](https://github.com/taverns-red/toast-stats/commit/5866875d5024a01fe08434888ff31ab5059ba8f4))
* **regions:** delete leaderboard table, keep card grid (CC-9, [#881](https://github.com/taverns-red/toast-stats/issues/881)) ([#937](https://github.com/taverns-red/toast-stats/issues/937)) ([f19ef32](https://github.com/taverns-red/toast-stats/commit/f19ef321a891f6c3919410f4964310054c469f2d))
* **regions:** sort region cards by a documented metric — region number asc ([#882](https://github.com/taverns-red/toast-stats/issues/882)) ([#938](https://github.com/taverns-red/toast-stats/issues/938)) ([4b963f7](https://github.com/taverns-red/toast-stats/commit/4b963f7e986ad978445a4c355a238cdee51e06a9))
* **tables:** click-any-column-to-sort + URL-synced sort across all data tables ([#851](https://github.com/taverns-red/toast-stats/issues/851)) ([#857](https://github.com/taverns-red/toast-stats/issues/857)) ([e7681a5](https://github.com/taverns-red/toast-stats/commit/e7681a5034a8845a3b54fb9d7644283a37f11783))
* **tables:** Status column renders as a chip at &lt;768px (CC-4) ([#871](https://github.com/taverns-red/toast-stats/issues/871)) ([#908](https://github.com/taverns-red/toast-stats/issues/908)) ([ed7ccaa](https://github.com/taverns-red/toast-stats/commit/ed7ccaa5d2eb7c2e4819111366c6340e2847e592))
* **ux:** real &lt;Link&gt; navigation for club & division cards (CC-7) ([#872](https://github.com/taverns-red/toast-stats/issues/872)) ([#911](https://github.com/taverns-red/toast-stats/issues/911)) ([b1614f5](https://github.com/taverns-red/toast-stats/commit/b1614f5693293dff219b97b59da776abc2f20192))


### Bug Fixes

* **a11y:** lift chip touch targets to the 44px floor — families A/B/C ([#886](https://github.com/taverns-red/toast-stats/issues/886)) ([#943](https://github.com/taverns-red/toast-stats/issues/943)) ([e02bc69](https://github.com/taverns-red/toast-stats/commit/e02bc6980f3e033dacef7ad45173fb4c3b446ace))


### Tests

* **a11y:** dual-engine 44px touch-target tripwire — Epic G Sprint 3 ([#887](https://github.com/taverns-red/toast-stats/issues/887)) ([#944](https://github.com/taverns-red/toast-stats/issues/944)) ([879fcaf](https://github.com/taverns-red/toast-stats/commit/879fcaf74be34d87ebdb802896e51d6e3e03d118))
* **flake:** eradicate contention & isolation root causes ([#914](https://github.com/taverns-red/toast-stats/issues/914)) ([#920](https://github.com/taverns-red/toast-stats/issues/920)) ([8cb1319](https://github.com/taverns-red/toast-stats/commit/8cb13190a432ca3485a5b43d1fc63914ca7c0a78))
* **landing:** mobile scroll-length regression guard ([#864](https://github.com/taverns-red/toast-stats/issues/864)) ([#898](https://github.com/taverns-red/toast-stats/issues/898)) ([186a04c](https://github.com/taverns-red/toast-stats/commit/186a04c46f78f9109c2a7bc894e04fb639a4043c))

## [3.5.1](https://github.com/taverns-red/toast-stats/compare/frontend-v3.5.0...frontend-v3.5.1) (2026-05-28)


### Bug Fixes

* **districts-page:** wrap isError branches in stable geometry ([#826](https://github.com/taverns-red/toast-stats/issues/826)) ([#846](https://github.com/taverns-red/toast-stats/issues/846)) ([084ba39](https://github.com/taverns-red/toast-stats/commit/084ba39d724dcdca79e27ba6cc6ecb4ed5aafc13))
* **district:** use canonical countdown for Distinguished tiles ([#840](https://github.com/taverns-red/toast-stats/issues/840)) ([#844](https://github.com/taverns-red/toast-stats/issues/844)) ([90872cf](https://github.com/taverns-red/toast-stats/commit/90872cfe7ed7e470a2e3de38cba4d46511a04b1d))
* **region:** RegionPage gets the wide --page-max-wide cap ([#848](https://github.com/taverns-red/toast-stats/issues/848)) ([#850](https://github.com/taverns-red/toast-stats/issues/850)) ([e08bcd2](https://github.com/taverns-red/toast-stats/commit/e08bcd2202b52d9000f3a6964ff25aad632d537e))

## [3.5.0](https://github.com/taverns-red/toast-stats/compare/frontend-v3.4.0...frontend-v3.5.0) (2026-05-28)


### Features

* **changes:** Phase 2 — arbitrary date-pair picker (from/to, URL-synced) ([#794](https://github.com/taverns-red/toast-stats/issues/794)) ([#807](https://github.com/taverns-red/toast-stats/issues/807)) ([97f5894](https://github.com/taverns-red/toast-stats/commit/97f589486767576ea066060f9ad24790cca42e92))
* **clubs:** active-filters bar + zero-results state + URL-sync all filters ([#817](https://github.com/taverns-red/toast-stats/issues/817)) ([#831](https://github.com/taverns-red/toast-stats/issues/831)) ([e81fe16](https://github.com/taverns-red/toast-stats/commit/e81fe165090a2cdf40abaa40eb7535df315e7166))
* **clubs:** adopt TanStack Table for the club table ([#835](https://github.com/taverns-red/toast-stats/issues/835)) ([#836](https://github.com/taverns-red/toast-stats/issues/836)) ([c6c7063](https://github.com/taverns-red/toast-stats/commit/c6c706363cfa56245af7ad3aa4bd1b298f5e0619))
* **clubs:** column-group show/hide on TanStack columnVisibility ([#819](https://github.com/taverns-red/toast-stats/issues/819)) ([#837](https://github.com/taverns-red/toast-stats/issues/837)) ([9e925b1](https://github.com/taverns-red/toast-stats/commit/9e925b18c7f739bfc5af192df1a4867ec9ca5cb5))
* **clubs:** dedicated Filters drawer with instant-apply ([#816](https://github.com/taverns-red/toast-stats/issues/816)) ([#830](https://github.com/taverns-red/toast-stats/issues/830)) ([e837673](https://github.com/taverns-red/toast-stats/commit/e8376730d023bc6a5d982498b4b4df69e9cf7676))
* **clubs:** merge the two quick-filter sets into one preset row; kill hidden auto-sort ([#815](https://github.com/taverns-red/toast-stats/issues/815)) ([#829](https://github.com/taverns-red/toast-stats/issues/829)) ([806f338](https://github.com/taverns-red/toast-stats/commit/806f3388b33b57185afd3772fcf27b828a4c7ba9))
* **clubs:** opt-in 'Changes' column group + diff CSV export ([#795](https://github.com/taverns-red/toast-stats/issues/795)) ([#838](https://github.com/taverns-red/toast-stats/issues/838)) ([b32773b](https://github.com/taverns-red/toast-stats/commit/b32773be71367c361775a801938e200ac75c37cc))
* **clubs:** visible search box for the club table ([#814](https://github.com/taverns-red/toast-stats/issues/814)) ([#828](https://github.com/taverns-red/toast-stats/issues/828)) ([2e5e19c](https://github.com/taverns-red/toast-stats/commit/2e5e19c3aa2cb9c24b136da84dcf98c6f004d187))
* **tables:** club table — priority-column responsive model + tablet tier ([#812](https://github.com/taverns-red/toast-stats/issues/812)) ([#827](https://github.com/taverns-red/toast-stats/issues/827)) ([58203b3](https://github.com/taverns-red/toast-stats/commit/58203b323f94aacbec8a4abc2f1ed767be3a432b))
* **tables:** full-width (~1600) container policy for data-table pages ([#810](https://github.com/taverns-red/toast-stats/issues/810)) ([#824](https://github.com/taverns-red/toast-stats/issues/824)) ([c4869c1](https://github.com/taverns-red/toast-stats/commit/c4869c1c9be2b4add720746848fad6117fd87cb5))
* **tables:** landing rankings table — priority-column responsive model + sticky fix ([#811](https://github.com/taverns-red/toast-stats/issues/811)) ([#825](https://github.com/taverns-red/toast-stats/issues/825)) ([1892f7b](https://github.com/taverns-red/toast-stats/commit/1892f7b6a6c31731483fbe8d641110562f95683e))


### Bug Fixes

* **area:** gate area recognition on club-visit requirement — deadline-aware provisional state ([#832](https://github.com/taverns-red/toast-stats/issues/832)) ([#839](https://github.com/taverns-red/toast-stats/issues/839)) ([3005ae0](https://github.com/taverns-red/toast-stats/commit/3005ae094094b7fa59b5f6c3b6acc9001ce0bfe2))

## [3.4.0](https://github.com/taverns-red/toast-stats/compare/frontend-v3.3.0...frontend-v3.4.0) (2026-05-27)


### Features

* **changes:** Phase 1 — snapshot diff engine + default district digest ([#793](https://github.com/taverns-red/toast-stats/issues/793)) ([#801](https://github.com/taverns-red/toast-stats/issues/801)) ([86d4ccb](https://github.com/taverns-red/toast-stats/commit/86d4ccb920a59160f42584b923a515eaf377ebeb))


### Bug Fixes

* **division:** recognition badge derives tier from the DDP single source ([#798](https://github.com/taverns-red/toast-stats/issues/798)) ([#805](https://github.com/taverns-red/toast-stats/issues/805)) ([07a6629](https://github.com/taverns-red/toast-stats/commit/07a662938a53947d6902ada2da313d83b6695180))
* **recognition:** consolidate division-recognition onto DDP source of truth + correct rules doc ([#799](https://github.com/taverns-red/toast-stats/issues/799)) ([#806](https://github.com/taverns-red/toast-stats/issues/806)) ([1433ed9](https://github.com/taverns-red/toast-stats/commit/1433ed9b3f6dc1f5c532f1cedc16a07572d72c2e))

## [3.3.0](https://github.com/taverns-red/toast-stats/compare/frontend-v3.2.1...frontend-v3.3.0) (2026-05-27)


### Features

* **brand:** link footer Red Taverns attribution to portal ([#779](https://github.com/taverns-red/toast-stats/issues/779)) ([#789](https://github.com/taverns-red/toast-stats/issues/789)) ([cb745ec](https://github.com/taverns-red/toast-stats/commit/cb745ece25a63db0e9c6065829e20a1a1f061c2e))
* **seo:** per-route document titles ([#780](https://github.com/taverns-red/toast-stats/issues/780)) ([#790](https://github.com/taverns-red/toast-stats/issues/790)) ([2d2225b](https://github.com/taverns-red/toast-stats/commit/2d2225b9d2f56f423f8e9a77d1be6d85efaadf6f))
* **seo:** static share + SEO metadata in index.html ([#778](https://github.com/taverns-red/toast-stats/issues/778)) ([#788](https://github.com/taverns-red/toast-stats/issues/788)) ([2a94bbc](https://github.com/taverns-red/toast-stats/commit/2a94bbcc6c1077abff2a1dab6698230795fe10eb))

## [3.2.1](https://github.com/taverns-red/toast-stats/compare/frontend-v3.2.0...frontend-v3.2.1) (2026-05-26)


### Bug Fixes

* **app-shell:** collapse primary nav into a disclosure menu &lt;768px ([#735](https://github.com/taverns-red/toast-stats/issues/735)) ([#764](https://github.com/taverns-red/toast-stats/issues/764)) ([21d185d](https://github.com/taverns-red/toast-stats/commit/21d185d6368974fe8d86b317398b93852c3513fa))
* **dark-mode:** migrate remaining components off prefers-scheme `dark:` to the theme toggle ([#715](https://github.com/taverns-red/toast-stats/issues/715)) ([#766](https://github.com/taverns-red/toast-stats/issues/766)) ([791bac0](https://github.com/taverns-red/toast-stats/commit/791bac0384c59d2dd0590fbe1bdf4b694b55ed2c))
* **landing:** reserve AwardsRaceSection slot to kill 0.198 landing-page CLS ([#750](https://github.com/taverns-red/toast-stats/issues/750)) ([#765](https://github.com/taverns-red/toast-stats/issues/765)) ([3d961f1](https://github.com/taverns-red/toast-stats/commit/3d961f1ee28f4d4f57ca19ee7e2811b78e80aa88))

## [3.2.0](https://github.com/taverns-red/toast-stats/compare/frontend-v3.1.0...frontend-v3.2.0) (2026-05-26)


### Features

* **district:** KPI strip to spec — 4th card + tier legend (epic [#674](https://github.com/taverns-red/toast-stats/issues/674) Sprint 7) ([#681](https://github.com/taverns-red/toast-stats/issues/681)) ([#747](https://github.com/taverns-red/toast-stats/issues/747)) ([03c2cb9](https://github.com/taverns-red/toast-stats/commit/03c2cb943c8b2af18ff6d7fc965ccc2d24b970ac))
* **district:** lean Overview hub + delete On-this-page rail (epic [#674](https://github.com/taverns-red/toast-stats/issues/674), Sprint 5) ([#745](https://github.com/taverns-red/toast-stats/issues/745)) ([3a058fe](https://github.com/taverns-red/toast-stats/commit/3a058fe75b904b9923bf63793dcba492c69eb63e))
* **district:** promote Trends + Analytics to own routes (epic [#674](https://github.com/taverns-red/toast-stats/issues/674) Sprint 6) ([#746](https://github.com/taverns-red/toast-stats/issues/746)) ([6074f16](https://github.com/taverns-red/toast-stats/commit/6074f16ce9684484ca93ea333ab7038d9247be7d))
* **district:** secondary route-nav primitive (epic [#674](https://github.com/taverns-red/toast-stats/issues/674), Sprint 4) ([#678](https://github.com/taverns-red/toast-stats/issues/678)) ([#744](https://github.com/taverns-red/toast-stats/issues/744)) ([0746fc5](https://github.com/taverns-red/toast-stats/commit/0746fc575cbbcbc661e012dc9431e5e94497d6a2))


### Bug Fixes

* **district:** consolidate header action cluster into an overflow menu (epic [#674](https://github.com/taverns-red/toast-stats/issues/674) Sprint 2) ([#742](https://github.com/taverns-red/toast-stats/issues/742)) ([4b6e31e](https://github.com/taverns-red/toast-stats/commit/4b6e31edba13bf885e1df659fcb08e6b45be90ba))
* **district:** un-gate trend charts from viewport + theme-aware skeleton (epic [#674](https://github.com/taverns-red/toast-stats/issues/674) Sprint 1) ([#739](https://github.com/taverns-red/toast-stats/issues/739)) ([86c390c](https://github.com/taverns-red/toast-stats/commit/86c390cf80ca5952a4f1638a320f4b3c633edae8))

## [3.1.0](https://github.com/taverns-red/toast-stats/compare/frontend-v3.0.0...frontend-v3.1.0) (2026-05-26)


### Features

* **cd:** release-gated production deploy (ADR-004) ([#707](https://github.com/taverns-red/toast-stats/issues/707)) ([#722](https://github.com/taverns-red/toast-stats/issues/722)) ([b20f426](https://github.com/taverns-red/toast-stats/commit/b20f426efd55762c0d9bdd42ea68c7db1fdd98cb))
* **clubs-table:** column model to handoff — DCP bar, cur/base, status & tier pills (epic [#665](https://github.com/taverns-red/toast-stats/issues/665), Sprint 3) ([#729](https://github.com/taverns-red/toast-stats/issues/729)) ([3e2fb7e](https://github.com/taverns-red/toast-stats/commit/3e2fb7e13c819dabb2dba09d00ffee701553fff7))
* **clubs-table:** re-skin controls row — search, segmented filter, quick chips (epic [#665](https://github.com/taverns-red/toast-stats/issues/665) Sprint 4) ([#731](https://github.com/taverns-red/toast-stats/issues/731)) ([e928449](https://github.com/taverns-red/toast-stats/commit/e928449227862b11ee7b17e9565ab8b4c1def2d8))
* **clubs-table:** re-skin table chrome to redesign tokens (epic [#665](https://github.com/taverns-red/toast-stats/issues/665), Sprint 2) ([#727](https://github.com/taverns-red/toast-stats/issues/727)) ([5ecdce3](https://github.com/taverns-red/toast-stats/commit/5ecdce3df15e6b87d9ac396829770b757d9dba48))
* **clubs-table:** remove pagination — single sticky-header table (epic [#665](https://github.com/taverns-red/toast-stats/issues/665), Sprint 1) ([#725](https://github.com/taverns-red/toast-stats/issues/725)) ([36b68a3](https://github.com/taverns-red/toast-stats/commit/36b68a3f5a5f6adb44834a750998d982c3779848))
* **clubs-table:** responsive — 640px card collapse + re-skinned cards (epic [#665](https://github.com/taverns-red/toast-stats/issues/665), Sprint 5) ([#732](https://github.com/taverns-red/toast-stats/issues/732)) ([859d7a2](https://github.com/taverns-red/toast-stats/commit/859d7a296c5feca48266e21ff07fcd7b71a072dd))


### Bug Fixes

* **chrome:** theme-toggle icon invisible in light mode ([#700](https://github.com/taverns-red/toast-stats/issues/700)) ([#717](https://github.com/taverns-red/toast-stats/issues/717)) ([120b13f](https://github.com/taverns-red/toast-stats/commit/120b13f6bef91f4bd5f3d235a4a959940b87b0be))


### Tests

* **clubs-table:** a11y + verification pass (epic [#665](https://github.com/taverns-red/toast-stats/issues/665) Sprint 6) ([#672](https://github.com/taverns-red/toast-stats/issues/672)) ([#737](https://github.com/taverns-red/toast-stats/issues/737)) ([259f734](https://github.com/taverns-red/toast-stats/commit/259f734d4ebad19c84d7edfed39ced9ef14fa2d7))

## [3.0.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.13.0...frontend-v3.0.0) (2026-05-25)


### ⚠ BREAKING CHANGES

* Backend analytics endpoints removed:
    - DELETE analytics.ts (8 endpoints, 1722 lines)
    - DELETE analyticsSummary.ts (1 endpoint, 594 lines)
    - DELETE PreComputedAnalyticsReader.ts (1163 lines)
    - DELETE 6 test files (2543 lines)

### Features

* **a11y:** tablist arrow-key navigation + tabpanel linkage ([#384](https://github.com/taverns-red/toast-stats/issues/384)) ([#476](https://github.com/taverns-red/toast-stats/issues/476)) ([dfc06f0](https://github.com/taverns-red/toast-stats/commit/dfc06f0e32f70a3a116b206477762cfabbba6e7a))
* accessibility & mobile responsiveness ([#216](https://github.com/taverns-red/toast-stats/issues/216), [#217](https://github.com/taverns-red/toast-stats/issues/217), [#218](https://github.com/taverns-red/toast-stats/issues/218)) ([9a63787](https://github.com/taverns-red/toast-stats/commit/9a63787939405240f2048d8ecc9f8c4f88502e62))
* accessibility & mobile responsiveness ([#216](https://github.com/taverns-red/toast-stats/issues/216), [#217](https://github.com/taverns-red/toast-stats/issues/217), [#218](https://github.com/taverns-red/toast-stats/issues/218)) ([7931882](https://github.com/taverns-red/toast-stats/commit/793188218581381f7d5355d51dc3b6675d9e05a6))
* add CDN-first data layer — cdn.ts client, 4 hooks updated with Express fallback ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([2af7012](https://github.com/taverns-red/toast-stats/commit/2af7012ab392168c4850398805106c121e2ab462))
* add client-side provisional Distinguished utility ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([ee83434](https://github.com/taverns-red/toast-stats/commit/ee8343444dd7292dc6822c200031c10fd31d968d))
* add club detail subpage with routing ([#208](https://github.com/taverns-red/toast-stats/issues/208)) ([4829b4b](https://github.com/taverns-red/toast-stats/commit/4829b4b8c74e63879f53ab51a3acec1547c9edb6))
* add ClubsNeedingMembersCard to Overview tab ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([951b186](https://github.com/taverns-red/toast-stats/commit/951b186cf87184dd5346e4b8e47dd57e3713090b))
* add computeMembersToDistinguished utility ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([942c551](https://github.com/taverns-red/toast-stats/commit/942c55132d7c7400a318ab6d615df05ddd62278a))
* add CSP submission status card to ClubDetailPage ([#298](https://github.com/taverns-red/toast-stats/issues/298)) ([302e080](https://github.com/taverns-red/toast-stats/commit/302e08017117839241a46808db909e9b3402c291))
* add data freshness indicators ([#213](https://github.com/taverns-red/toast-stats/issues/213), [#214](https://github.com/taverns-red/toast-stats/issues/214), [#215](https://github.com/taverns-red/toast-stats/issues/215)) ([881b4e2](https://github.com/taverns-red/toast-stats/commit/881b4e2e6d4016acf8237cde6b9cf11e85ae4b4e))
* add deriveGoalContext and findClubsNeedingMembers helpers ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([44644fe](https://github.com/taverns-red/toast-stats/commit/44644febb7fa2912b1bd9593014c8ea20dcff1fa))
* add membershipBase to ClubTrend for accurate base membership display ([#164](https://github.com/taverns-red/toast-stats/issues/164)) ([c2e9b30](https://github.com/taverns-red/toast-stats/commit/c2e9b30e8a6e0cfb043fb4860e2a60756edaf711))
* add remote error reporting to ErrorBoundary ([#254](https://github.com/taverns-red/toast-stats/issues/254)) ([39a2a0c](https://github.com/taverns-red/toast-stats/commit/39a2a0c98f405fa9d9b9188c604d74948219e442))
* add responsive X-axis tick density for mobile charts ([#237](https://github.com/taverns-red/toast-stats/issues/237)) ([821dded](https://github.com/taverns-red/toast-stats/commit/821dded09edb74c6e5324a3b04c78fbc67b80f9c))
* add tie-aware ranking for Top Growth and DCP lists ([#236](https://github.com/taverns-red/toast-stats/issues/236)) ([d5655f0](https://github.com/taverns-red/toast-stats/commit/d5655f0aa0c07f05ba8134868fd674fd40348f14))
* add useUrlState hook for URL-synced state ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([6a852f7](https://github.com/taverns-red/toast-stats/commit/6a852f702258b4d96f32d67ee11449c30e08786a))
* **analytics:** district remaining-to-min-Distinguished as absolute counts ([#686](https://github.com/taverns-red/toast-stats/issues/686)) ([#697](https://github.com/taverns-red/toast-stats/issues/697)) ([3fcc23a](https://github.com/taverns-red/toast-stats/commit/3fcc23aaea5e2b287aaff5806fd82692156b35df))
* **anniversary:** hero badge + clubs-table Years column ([#445](https://github.com/taverns-red/toast-stats/issues/445) [#448](https://github.com/taverns-red/toast-stats/issues/448) [#443](https://github.com/taverns-red/toast-stats/issues/443)) ([#506](https://github.com/taverns-red/toast-stats/issues/506)) ([0f9b45b](https://github.com/taverns-red/toast-stats/commit/0f9b45b8c2ca22d49ac0bb30ed8a999ea265486d))
* **app-shell:** move ThemeToggle from footer to header ([#565](https://github.com/taverns-red/toast-stats/issues/565)) ([#566](https://github.com/taverns-red/toast-stats/issues/566)) ([175ade1](https://github.com/taverns-red/toast-stats/commit/175ade185a8faff0d1aa0dc3ade6d80bd8080261))
* **awards-race:** add progress bars + threshold sub-line per design ([#357](https://github.com/taverns-red/toast-stats/issues/357)) ([#404](https://github.com/taverns-red/toast-stats/issues/404)) ([e9de6a3](https://github.com/taverns-red/toast-stats/commit/e9de6a371dcd001eed8f0c45b190d7e22cac31d8))
* **awards-race:** wrap 3 cards in single bordered panel + timestamp meta ([#406](https://github.com/taverns-red/toast-stats/issues/406)) ([75046f7](https://github.com/taverns-red/toast-stats/commit/75046f7eee4c9f3596a0b426173249a58b628887))
* **awards:** rebuild AwardsRaceSection as 3-card contender summary ([#357](https://github.com/taverns-red/toast-stats/issues/357)) ([#382](https://github.com/taverns-red/toast-stats/issues/382)) ([130ac87](https://github.com/taverns-red/toast-stats/commit/130ac87a7e86066f534d5faf50b53bef7977646d))
* **awards:** ship /awards page with top-10 leaderboards ([#370](https://github.com/taverns-red/toast-stats/issues/370) [#371](https://github.com/taverns-red/toast-stats/issues/371) [#372](https://github.com/taverns-red/toast-stats/issues/372) [#373](https://github.com/taverns-red/toast-stats/issues/373)) ([#392](https://github.com/taverns-red/toast-stats/issues/392)) ([0a3129d](https://github.com/taverns-red/toast-stats/commit/0a3129d70051f1a69b416542f053e573cca9b011))
* **brand:** [#339](https://github.com/taverns-red/toast-stats/issues/339) adopt Red Taverns Brand v1.0 tokens — Phase 1 (additive) ([#595](https://github.com/taverns-red/toast-stats/issues/595)) ([ab3d83a](https://github.com/taverns-red/toast-stats/commit/ab3d83ac1aab21bcc4404bd2eaa9852436b138b5))
* **close-to-distinguished:** tighten threshold to ≤4 + unify across views ([#433](https://github.com/taverns-red/toast-stats/issues/433)) ([#441](https://github.com/taverns-red/toast-stats/issues/441)) ([c8190f4](https://github.com/taverns-red/toast-stats/commit/c8190f4022a8359f8c0e9dbf0a2c93c6658f7689))
* **club:** [#618](https://github.com/taverns-red/toast-stats/issues/618) Sprint 1 — gradient hero, 8-stat grid, back-link ([#638](https://github.com/taverns-red/toast-stats/issues/638)) ([f397956](https://github.com/taverns-red/toast-stats/commit/f3979565eaaadfb9451a05b65996226d911270c6))
* **club:** [#619](https://github.com/taverns-red/toast-stats/issues/619) Sprint 2 — Membership Trend chart + DCP Status panel (2/3 + 1/3) ([#641](https://github.com/taverns-red/toast-stats/issues/641)) ([1a24bc7](https://github.com/taverns-red/toast-stats/commit/1a24bc7d10e0a9598991f635102acbe8452ef4ac))
* **club:** [#620](https://github.com/taverns-red/toast-stats/issues/620) Close-to-Distinguished callout reposition + DCP Goals Progress panel ([#642](https://github.com/taverns-red/toast-stats/issues/642)) ([2baf744](https://github.com/taverns-red/toast-stats/commit/2baf744eb626d19039b9901431014715d1addb5b))
* **club:** [#621](https://github.com/taverns-red/toast-stats/issues/621) Sprint 4 — Goal Achievement Timeline ([#643](https://github.com/taverns-red/toast-stats/issues/643)) ([62f8309](https://github.com/taverns-red/toast-stats/commit/62f830986629796c63d194f246774c9acefe9597))
* **club:** apply redesign panel chrome to ClubDetailPage ([#366](https://github.com/taverns-red/toast-stats/issues/366)) ([#389](https://github.com/taverns-red/toast-stats/issues/389)) ([071f970](https://github.com/taverns-red/toast-stats/commit/071f9709508881980b505ad16304255e13a8900a))
* **club:** redesign Close-to-Distinguished call-out + move under hero ([#366](https://github.com/taverns-red/toast-stats/issues/366)) ([#401](https://github.com/taverns-red/toast-stats/issues/401)) ([7ac4fe8](https://github.com/taverns-red/toast-stats/commit/7ac4fe86715b11ecee1a697144db8ef725ff72a5))
* **club:** redesign Club detail hero header per handoff ([#23](https://github.com/taverns-red/toast-stats/issues/23) follow-up to [#366](https://github.com/taverns-red/toast-stats/issues/366)) ([#398](https://github.com/taverns-red/toast-stats/issues/398)) ([1cdf649](https://github.com/taverns-red/toast-stats/commit/1cdf64921d8bf620f647904bb280b44ae6755f8f))
* **clubs-table:** status segmented filter with counts ([#361](https://github.com/taverns-red/toast-stats/issues/361)) ([#470](https://github.com/taverns-red/toast-stats/issues/470)) ([4bc8e39](https://github.com/taverns-red/toast-stats/commit/4bc8e3945c66d8ba2fae4b5353a8283310a87412))
* **clubs:** redesign quick-filter chips on Clubs tab ([#24](https://github.com/taverns-red/toast-stats/issues/24) follow-up to [#361](https://github.com/taverns-red/toast-stats/issues/361)) ([#399](https://github.com/taverns-red/toast-stats/issues/399)) ([649acdc](https://github.com/taverns-red/toast-stats/commit/649acdcdd78bfd2d53a188300868a621a7444fe1))
* code-split DistrictDetailPage with React.lazy + Suspense ([#169](https://github.com/taverns-red/toast-stats/issues/169)) ([8ff5fbd](https://github.com/taverns-red/toast-stats/commit/8ff5fbdd60d9e5449fbe71cbecf8c3d7d9739b46))
* **components:** RegionsLeaderboard + RegionGrid — Sprint B of /regions epic ([#494](https://github.com/taverns-red/toast-stats/issues/494) [#495](https://github.com/taverns-red/toast-stats/issues/495) [#492](https://github.com/taverns-red/toast-stats/issues/492)) ([#499](https://github.com/taverns-red/toast-stats/issues/499)) ([66d1872](https://github.com/taverns-red/toast-stats/commit/66d18720d2625fa7da4bcbdbd5955d08aae13f96))
* **comprehension:** rename Methodology→How it works, wire help icon, add KPI/Awards-Race tooltips ([#412](https://github.com/taverns-red/toast-stats/issues/412) [#410](https://github.com/taverns-red/toast-stats/issues/410) [#413](https://github.com/taverns-red/toast-stats/issues/413)) ([#457](https://github.com/taverns-red/toast-stats/issues/457)) ([6c0a189](https://github.com/taverns-red/toast-stats/commit/6c0a18959ae3c05c9ffddc2fe0081c9f1c473e24))
* convert 7 remaining hooks to CDN-only ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([c13dd07](https://github.com/taverns-red/toast-stats/commit/c13dd079645bcaf9af76ed235897c2eaba62986e))
* convert last 2 Express hooks to CDN, delete api.ts ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([fb280ea](https://github.com/taverns-red/toast-stats/commit/fb280ea9a5ec01a32029ab68a2d8538e96e886e4))
* convert rankings to CDN + add v1/rankings.json pipeline step ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([14f8138](https://github.com/taverns-red/toast-stats/commit/14f813897a2db198889b0e6014f9a999829ee88c))
* delete backend analytics routes, CDN-only frontend ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([b23183c](https://github.com/taverns-red/toast-stats/commit/b23183c29850533476595f76a25b656ba9d06dc3))
* display threshold + officer awards in trophy case ([#333](https://github.com/taverns-red/toast-stats/issues/333)) ([91bafe3](https://github.com/taverns-red/toast-stats/commit/91bafe36a7ee2a730f8dc783e4a03d74fa21df8b))
* Distinguished District tier tracking + trophy case ([#332](https://github.com/taverns-red/toast-stats/issues/332)) ([1e12e5c](https://github.com/taverns-red/toast-stats/commit/1e12e5cd696c9303dae58c5a17e61b89394e9b59))
* **district-clubs:** [#489](https://github.com/taverns-red/toast-stats/issues/489) surface FAC-only clubs (ATOs / prospective) ([#594](https://github.com/taverns-red/toast-stats/issues/594)) ([d076fba](https://github.com/taverns-red/toast-stats/commit/d076fba705466ce3dd4765eecd32c8e2cd209a51))
* **district-detail:** tighten Distinguished Status panel + collapse empty notable-dates cards ([#551](https://github.com/taverns-red/toast-stats/issues/551)) ([#553](https://github.com/taverns-red/toast-stats/issues/553)) ([9cfbbad](https://github.com/taverns-red/toast-stats/commit/9cfbbadff9f692106314acb76cb5d48f014d1ec5))
* district-free club URL + club index ([#320](https://github.com/taverns-red/toast-stats/issues/320)) ([7f12903](https://github.com/taverns-red/toast-stats/commit/7f12903c8f85a2c270cb6bb47efdf4442ee5d3ae))
* **district-ia:** back-to-district breadcrumb on every routed sub-page ([#577](https://github.com/taverns-red/toast-stats/issues/577)) ([#622](https://github.com/taverns-red/toast-stats/issues/622)) ([f6dedb3](https://github.com/taverns-red/toast-stats/commit/f6dedb30fe640bb6699a77574deb515d5404e7fb))
* **district-overview:** Distinguished Composition stack-bar ([#360](https://github.com/taverns-red/toast-stats/issues/360) slice 2) ([#466](https://github.com/taverns-red/toast-stats/issues/466)) ([94ec825](https://github.com/taverns-red/toast-stats/commit/94ec8258663c0a75199f191bda2ba3c59d660919))
* **district-overview:** Payment Composition donut ([#360](https://github.com/taverns-red/toast-stats/issues/360) slice 3) ([#467](https://github.com/taverns-red/toast-stats/issues/467)) ([ea917b8](https://github.com/taverns-red/toast-stats/commit/ea917b877767a26970e4b2f7ed0049b7bba9c6b5))
* **district-overview:** top-right rank badge on KPI cards ([#360](https://github.com/taverns-red/toast-stats/issues/360)) ([#465](https://github.com/taverns-red/toast-stats/issues/465)) ([5ddb49c](https://github.com/taverns-red/toast-stats/commit/5ddb49c34b944c97406d9479da864696e2847a0c))
* **district-overview:** wire all 5 payment types in donut ([#360](https://github.com/taverns-red/toast-stats/issues/360)) ([#469](https://github.com/taverns-red/toast-stats/issues/469)) ([16be673](https://github.com/taverns-red/toast-stats/commit/16be6734badd7b8c1894779cdb4d4fe112e259ed))
* **district-status:** concrete units + reorder + drop net in gap tiles ([#555](https://github.com/taverns-red/toast-stats/issues/555), [#556](https://github.com/taverns-red/toast-stats/issues/556)) ([#560](https://github.com/taverns-red/toast-stats/issues/560)) ([921d427](https://github.com/taverns-red/toast-stats/commit/921d4274d457b3451888ae69c2421e9e67f12de1))
* **district-tabs:** discoverability — bigger, bolder, hover preview ([#437](https://github.com/taverns-red/toast-stats/issues/437)) ([#453](https://github.com/taverns-red/toast-stats/issues/453)) ([fac3695](https://github.com/taverns-red/toast-stats/commit/fac3695373fe6189960068c8c08176604626184a))
* **district:** [#449](https://github.com/taverns-red/toast-stats/issues/449) longest-serving clubs leaderboard ([#593](https://github.com/taverns-red/toast-stats/issues/593)) ([7eb021f](https://github.com/taverns-red/toast-stats/commit/7eb021f202d6ea9709649fa7d75c6a0a3fa8a335))
* **district:** /district/:id/division/:divId + .../area/:areaId pages ([#424](https://github.com/taverns-red/toast-stats/issues/424) [#425](https://github.com/taverns-red/toast-stats/issues/425)) ([#464](https://github.com/taverns-red/toast-stats/issues/464)) ([c87f2eb](https://github.com/taverns-red/toast-stats/commit/c87f2eb91ffeb62a8fe8c283c87e7e21da126b85))
* **district:** apply 2026 redesign chrome to DistrictDetailPage header ([#358](https://github.com/taverns-red/toast-stats/issues/358)) ([#383](https://github.com/taverns-red/toast-stats/issues/383)) ([9c5df23](https://github.com/taverns-red/toast-stats/commit/9c5df2368b0353d576af5dd73caafcfe8d72f33a))
* **district:** Education Levels rollup on Analytics tab ([#426](https://github.com/taverns-red/toast-stats/issues/426)) ([#481](https://github.com/taverns-red/toast-stats/issues/481)) ([3376dc9](https://github.com/taverns-red/toast-stats/commit/3376dc9693feb654740f9f220dbcb7827760f71f))
* **district:** extract DistrictDetailTabs primitive ([#359](https://github.com/taverns-red/toast-stats/issues/359)) ([#385](https://github.com/taverns-red/toast-stats/issues/385)) ([8c51940](https://github.com/taverns-red/toast-stats/commit/8c51940d6172cf778e23aa0da1462fa7a9ca0236))
* **district:** IA Phase 1 — stack Overview/Trends/Analytics into scrollable narrative ([#569](https://github.com/taverns-red/toast-stats/issues/569)) ([#573](https://github.com/taverns-red/toast-stats/issues/573)) ([29cb3dc](https://github.com/taverns-red/toast-stats/commit/29cb3dc240e4fd9a686663526450125e0e5e1a04))
* **district:** IA Phase 2 — /district/:id/clubs route with URL-param filter state ([#570](https://github.com/taverns-red/toast-stats/issues/570)) ([#576](https://github.com/taverns-red/toast-stats/issues/576)) ([970be3e](https://github.com/taverns-red/toast-stats/commit/970be3e774283ae34fa2ea31cc3de00eeca438dc))
* **district:** IA Phase 3 — route Divisions/Rankings + retire tab strip ([#571](https://github.com/taverns-red/toast-stats/issues/571)) ([#578](https://github.com/taverns-red/toast-stats/issues/578)) ([c71354b](https://github.com/taverns-red/toast-stats/commit/c71354bbdc1bc0f1b20a4c272feb25ffe2599364))
* **district:** IA Phase 4 — sticky KPI strip + anchor TOC + smooth scroll ([#572](https://github.com/taverns-red/toast-stats/issues/572)) ([#579](https://github.com/taverns-red/toast-stats/issues/579)) ([653d7bb](https://github.com/taverns-red/toast-stats/commit/653d7bbf05a70e9633d4c7006a825fb38712fd1d))
* **districts:** add Export CSV + Share buttons to action cluster ([#357](https://github.com/taverns-red/toast-stats/issues/357)) ([#405](https://github.com/taverns-red/toast-stats/issues/405)) ([64b99e8](https://github.com/taverns-red/toast-stats/commit/64b99e863f96fd7a2bda566ee79e24b5302dde85))
* **districts:** apply 2026 redesign chrome to LandingPage in place ([#356](https://github.com/taverns-red/toast-stats/issues/356)) ([#381](https://github.com/taverns-red/toast-stats/issues/381)) ([9dc6662](https://github.com/taverns-red/toast-stats/commit/9dc6662fdb4ac5928fb295746626d04cd2c7a612))
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
* enhance club detail card with stats grid, base membership, and DCP milestone bars ([#163](https://github.com/taverns-red/toast-stats/issues/163)) ([89226af](https://github.com/taverns-red/toast-stats/commit/89226af84bfd42a714bc216164fbd004010fbccc))
* **find-a-club:** schema bump + Club hero CHARTERED + disable pre-push ([#429](https://github.com/taverns-red/toast-stats/issues/429) [#431](https://github.com/taverns-red/toast-stats/issues/431) [#432](https://github.com/taverns-red/toast-stats/issues/432)) ([#483](https://github.com/taverns-red/toast-stats/issues/483)) ([ca573cd](https://github.com/taverns-red/toast-stats/commit/ca573cd9f457a9a6f3e4954c7f932bf1a3d26531))
* **frontend:** growth velocity card and division heatmap ([#219](https://github.com/taverns-red/toast-stats/issues/219), [#220](https://github.com/taverns-red/toast-stats/issues/220)) ([d812125](https://github.com/taverns-red/toast-stats/commit/d8121259fa7eb218f5be8899d7a1efaaf75a302c))
* **frontend:** prioritize exact goal flags for members to distinguished logic ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([3b5f686](https://github.com/taverns-red/toast-stats/commit/3b5f6867d0e56001854a4bf4de5a8a5559bbb146))
* GlobalRankingsTab uses per-date rankings for accuracy ([#302](https://github.com/taverns-red/toast-stats/issues/302)) ([46c7b28](https://github.com/taverns-red/toast-stats/commit/46c7b28bb6e8f43f0ff58a9150b369c915781fdc))
* Google Analytics 4 + release notes link in footer ([#314](https://github.com/taverns-red/toast-stats/issues/314), [#312](https://github.com/taverns-red/toast-stats/issues/312)) ([fa5a2be](https://github.com/taverns-red/toast-stats/commit/fa5a2be45e8fc2bd5aa5bcc596d7bd6d6fba63f8))
* **history,methodology:** ship History year strip + full Methodology content ([#367](https://github.com/taverns-red/toast-stats/issues/367) [#368](https://github.com/taverns-red/toast-stats/issues/368)) ([#390](https://github.com/taverns-red/toast-stats/issues/390)) ([dbf6b0c](https://github.com/taverns-red/toast-stats/commit/dbf6b0c06ff7b283c094f437d69a818639b990f3))
* mark area Distinguished as provisional when visits incomplete ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([3459456](https://github.com/taverns-red/toast-stats/commit/3459456fef2df5db73749858de6cedf4e3086259))
* **membership-trend:** GREEN — methodology surfacing on chart + /methodology section ([#438](https://github.com/taverns-red/toast-stats/issues/438)) ([#454](https://github.com/taverns-red/toast-stats/issues/454)) ([8b7e64f](https://github.com/taverns-red/toast-stats/commit/8b7e64fc40cde0a92415d60112add411c8e726d8))
* multi-year trend comparison overlay on membership chart ([#238](https://github.com/taverns-red/toast-stats/issues/238)) ([29aa42f](https://github.com/taverns-red/toast-stats/commit/29aa42f333345c6040d3fdc64fe8bee86f95333e))
* **overview:** apply redesign panel chrome to Overview tab components ([#360](https://github.com/taverns-red/toast-stats/issues/360)) ([#387](https://github.com/taverns-red/toast-stats/issues/387)) ([b6de4bc](https://github.com/taverns-red/toast-stats/commit/b6de4bcf708dca5857d8160758896857e9ace3b5))
* **overview:** District Overview KPI redesign — bullet bars + lean 3-card layout ([#550](https://github.com/taverns-red/toast-stats/issues/550)) ([#552](https://github.com/taverns-red/toast-stats/issues/552)) ([03615a2](https://github.com/taverns-red/toast-stats/commit/03615a2e65dd756791c32f510b8f576d11f77fee))
* **page+shell:** /regions page + enable Regions nav — Sprint C of /regions epic ([#496](https://github.com/taverns-red/toast-stats/issues/496) [#497](https://github.com/taverns-red/toast-stats/issues/497) [#492](https://github.com/taverns-red/toast-stats/issues/492)) ([#500](https://github.com/taverns-red/toast-stats/issues/500)) ([75a9be4](https://github.com/taverns-red/toast-stats/commit/75a9be472a1ced639ec04c5404dca880b3b21d11))
* PaymentCompositionCard on District Detail Overview ([#327](https://github.com/taverns-red/toast-stats/issues/327)) ([25c0fcc](https://github.com/taverns-red/toast-stats/commit/25c0fcc28f36be41dec28bd0cbaa810f93cf8871))
* per-club DCP goal progress card on club detail page ([#242](https://github.com/taverns-red/toast-stats/issues/242)) ([591f733](https://github.com/taverns-red/toast-stats/commit/591f733b47c716c1cae5ad71ded480767d803b00))
* performance & observability — Lighthouse CI, code-split Recharts, CDN monitoring, error telemetry ([#222](https://github.com/taverns-red/toast-stats/issues/222), [#223](https://github.com/taverns-red/toast-stats/issues/223), [#224](https://github.com/taverns-red/toast-stats/issues/224), [#225](https://github.com/taverns-red/toast-stats/issues/225)) ([1edc44a](https://github.com/taverns-red/toast-stats/commit/1edc44a28cd6dde583dbcbe790c92d4793694464))
* persist tab & sort state in URL search params ([#230](https://github.com/taverns-red/toast-stats/issues/230)) ([f025c62](https://github.com/taverns-red/toast-stats/commit/f025c629bd14d95ff62adbfb177107b83cf76ba9))
* **print:** print stylesheet for clean board-meeting handouts ([#427](https://github.com/taverns-red/toast-stats/issues/427)) ([#477](https://github.com/taverns-red/toast-stats/issues/477)) ([cbb01db](https://github.com/taverns-red/toast-stats/commit/cbb01db5c4a4cd39262581a5af2d7b9c7d0f12cd))
* progressive loading — per-section skeletons for divisions, trends, analytics tabs ([#169](https://github.com/taverns-red/toast-stats/issues/169)) ([c3e20f0](https://github.com/taverns-red/toast-stats/commit/c3e20f083357f5b2139c02c739069e05b4951f42))
* **region:** /region/:n landing page ([#423](https://github.com/taverns-red/toast-stats/issues/423)) ([#463](https://github.com/taverns-red/toast-stats/issues/463)) ([6bb558b](https://github.com/taverns-red/toast-stats/commit/6bb558b664b0dadc4caaabc7d8c2f2b9961aabf6))
* **region:** Club Growth % column + CGD officer-award rename ([#534](https://github.com/taverns-red/toast-stats/issues/534)) ([#540](https://github.com/taverns-red/toast-stats/issues/540)) ([98c8abf](https://github.com/taverns-red/toast-stats/commit/98c8abfa756b1ae33b3675afc821eefa6a438fe6))
* **region:** Distinguished countdown + Tier columns — closes Epic [#513](https://github.com/taverns-red/toast-stats/issues/513) ([#516](https://github.com/taverns-red/toast-stats/issues/516) [#517](https://github.com/taverns-red/toast-stats/issues/517)) ([#535](https://github.com/taverns-red/toast-stats/issues/535)) ([2aceb41](https://github.com/taverns-red/toast-stats/commit/2aceb4188312fdbdda7b4570bda44c5beaf29ed8))
* **region:** rollup KPIs + rank column + linkified chip — Sprint A of epic [#513](https://github.com/taverns-red/toast-stats/issues/513) ([#514](https://github.com/taverns-red/toast-stats/issues/514) [#515](https://github.com/taverns-red/toast-stats/issues/515) [#518](https://github.com/taverns-red/toast-stats/issues/518)) ([#526](https://github.com/taverns-red/toast-stats/issues/526)) ([49a6214](https://github.com/taverns-red/toast-stats/commit/49a6214ef337e039b3a127d5bb90e1f01febbbd7))
* **region:** table base → current → Δ column model (epic [#683](https://github.com/taverns-red/toast-stats/issues/683), Sprint 4) ([#698](https://github.com/taverns-red/toast-stats/issues/698)) ([caa8feb](https://github.com/taverns-red/toast-stats/commit/caa8febcdff2af8b673b6038855f5efb01eeb6c0))
* **region:** three Distinguished-remaining columns, absolute not % (epic [#683](https://github.com/taverns-red/toast-stats/issues/683), Sprint 5) ([#688](https://github.com/taverns-red/toast-stats/issues/688)) ([#702](https://github.com/taverns-red/toast-stats/issues/702)) ([7691f8f](https://github.com/taverns-red/toast-stats/commit/7691f8f0f0b31245124a0dbbb30919dd0f619851))
* replace region filter disclosure with pill toggle bar ([#326](https://github.com/taverns-red/toast-stats/issues/326)) ([1a1ce01](https://github.com/taverns-red/toast-stats/commit/1a1ce0148c8914f0155ae94db4b27b8cb72e83ca))
* **routing:** wire /history + /methodology placeholder routes ([#355](https://github.com/taverns-red/toast-stats/issues/355)) ([#379](https://github.com/taverns-red/toast-stats/issues/379)) ([919f58e](https://github.com/taverns-red/toast-stats/commit/919f58e7a5ebf09a64af12f130bf50842f9086be))
* serve time-series via CDN + useTimeSeries hook ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([73b2c07](https://github.com/taverns-red/toast-stats/commit/73b2c07232c67dfbd9afaf16d54b656faa18404d))
* **shell:** build AppShell — sticky top bar + minimalist footer ([#354](https://github.com/taverns-red/toast-stats/issues/354)) ([#378](https://github.com/taverns-red/toast-stats/issues/378)) ([bacbfe2](https://github.com/taverns-red/toast-stats/commit/bacbfe25cdb2cc2b316972ecf632a5c1056687a2))
* **shell:** universal search palette opened with Cmd-K / Ctrl-K ([#422](https://github.com/taverns-red/toast-stats/issues/422)) ([#462](https://github.com/taverns-red/toast-stats/issues/462)) ([44f4877](https://github.com/taverns-red/toast-stats/commit/44f4877af850236dd30cab7370b4fe1198875199))
* show 'Provisional' subtitle with confirmed fallback level ([#297](https://github.com/taverns-red/toast-stats/issues/297)) ([36512e9](https://github.com/taverns-red/toast-stats/commit/36512e9d88d7f6930f2fb57a038423a2651e70a9))
* show average members per club on district overview ([#318](https://github.com/taverns-red/toast-stats/issues/318)) ([186a257](https://github.com/taverns-red/toast-stats/commit/186a2575cd244f1a58a8dd35e7f4d0fe28bce5cc))
* show CSP status on club detail modal ([#288](https://github.com/taverns-red/toast-stats/issues/288)) ([4478b01](https://github.com/taverns-red/toast-stats/commit/4478b01c6d35a50923faf304d9a3c33a11da82c3))
* show provisional Distinguished badge with asterisk + tooltip ([#287](https://github.com/taverns-red/toast-stats/issues/287)) ([6096a1e](https://github.com/taverns-red/toast-stats/commit/6096a1ec41b1659aa224b76ac9359f99ecc6d1ab))
* staging environment — Phase 1+2 infrastructure + pipeline ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([0be241b](https://github.com/taverns-red/toast-stats/commit/0be241b9041470037070affb96c3737173535fb0))
* surface competitive award standings on landing page ([#331](https://github.com/taverns-red/toast-stats/issues/331)) ([9451faf](https://github.com/taverns-red/toast-stats/commit/9451faf9f35b16e0d1770b1ced48bee13e77f897))
* switch API from Gateway to HTTPS LB at api.taverns.red ([#14](https://github.com/taverns-red/toast-stats/issues/14)) ([007fb81](https://github.com/taverns-red/toast-stats/commit/007fb81af27be8b9cbf4168e580e48d12d4c1f68))
* sync additional tables with URL params ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([a68c640](https://github.com/taverns-red/toast-stats/commit/a68c64070a289340ace0aca69a6a225b8f636a13))
* sync ClubsTable pagination with URL params ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([a6da02e](https://github.com/taverns-red/toast-stats/commit/a6da02e0fff08fc3c061b5dd936f65fe99e26864))
* sync column filters to URL for deep links ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([9b76f70](https://github.com/taverns-red/toast-stats/commit/9b76f702f14515b33337e44d0afc311a80f8aa21))
* sync program year and date to URL for deep links ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([8222d46](https://github.com/taverns-red/toast-stats/commit/8222d46cbf356ca0e12393ac713210eb6b24b2b2))
* **tabs:** bulk redesign panel chrome across all tab components ([#361](https://github.com/taverns-red/toast-stats/issues/361) [#362](https://github.com/taverns-red/toast-stats/issues/362) [#363](https://github.com/taverns-red/toast-stats/issues/363) [#364](https://github.com/taverns-red/toast-stats/issues/364) [#365](https://github.com/taverns-red/toast-stats/issues/365)) ([#388](https://github.com/taverns-red/toast-stats/issues/388)) ([26c4d10](https://github.com/taverns-red/toast-stats/commit/26c4d102bb36f8b6d42a7816ba02774d1027154e))
* **test-infra:** split vitest into unit + integration projects, restore pre-push gate ([#482](https://github.com/taverns-red/toast-stats/issues/482)) ([#635](https://github.com/taverns-red/toast-stats/issues/635)) ([7f49558](https://github.com/taverns-red/toast-stats/commit/7f4955846456b423b0abd11415c24ca49675afe6))
* **tokens:** add 2026 redesign token system alongside tm-* ([#353](https://github.com/taverns-red/toast-stats/issues/353)) ([#374](https://github.com/taverns-red/toast-stats/issues/374)) ([00a25d9](https://github.com/taverns-red/toast-stats/commit/00a25d9020ecdedac0fabb401d33365717497802))
* **ui:** add 'close to distinguished' card ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([d4e08aa](https://github.com/taverns-red/toast-stats/commit/d4e08aa166303ca7d5f8ead7275283fec81a68d9))
* **ui:** add members needed column and retain pagination state ([#272](https://github.com/taverns-red/toast-stats/issues/272), [#273](https://github.com/taverns-red/toast-stats/issues/273)) ([7269e4d](https://github.com/taverns-red/toast-stats/commit/7269e4dde54b53d021251fcd3dd3ea0e10fa17e6))
* **ui:** unified DataControlsBar across DistrictsPage + DistrictDetailPage ([#528](https://github.com/taverns-red/toast-stats/issues/528) [#529](https://github.com/taverns-red/toast-stats/issues/529) [#530](https://github.com/taverns-red/toast-stats/issues/530) [#531](https://github.com/taverns-red/toast-stats/issues/531)) ([#532](https://github.com/taverns-red/toast-stats/issues/532)) ([a7e5543](https://github.com/taverns-red/toast-stats/commit/a7e554313964d40644777e16706b055e359c2b48))
* unify chart loading skeletons with animated bars ([#235](https://github.com/taverns-red/toast-stats/issues/235)) ([30c99c0](https://github.com/taverns-red/toast-stats/commit/30c99c02b66aab2abd78ca4929eaa60af41ac9fe))
* use client-side provisional detection in all badge views ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([06314f7](https://github.com/taverns-red/toast-stats/commit/06314f748916df2998ea05f43a71f7b36b344b71))
* **util:** aggregateRegions — Sprint A of /regions epic ([#493](https://github.com/taverns-red/toast-stats/issues/493), [#492](https://github.com/taverns-red/toast-stats/issues/492)) ([#498](https://github.com/taverns-red/toast-stats/issues/498)) ([668df67](https://github.com/taverns-red/toast-stats/commit/668df678f1433b7245f016bb9ecf26426befa002))
* **util:** getClubAnniversary — Sprint A of anniversaries epic ([#444](https://github.com/taverns-red/toast-stats/issues/444) [#443](https://github.com/taverns-red/toast-stats/issues/443)) ([#505](https://github.com/taverns-red/toast-stats/issues/505)) ([cad79c4](https://github.com/taverns-red/toast-stats/commit/cad79c4c504e2ec894f2b54d9bf732dbd49f5863))
* wire CDN cache monitoring into fetch layer ([#255](https://github.com/taverns-red/toast-stats/issues/255)) ([c7136bf](https://github.com/taverns-red/toast-stats/commit/c7136bf3ee26580b29e63bf2d5707369d3aa7fa5))
* wire useTimeSeries into DistrictDetailPage ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([c08da58](https://github.com/taverns-red/toast-stats/commit/c08da584bf8cc1bbe86ea5725376867e00aa7593))
* wire YoY comparison from CDN time-series data ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([f9d6ba7](https://github.com/taverns-red/toast-stats/commit/f9d6ba70824e3068b142adc613acf15f9f626d16))


### Bug Fixes

* 'Close to Distinguished' button syncs sort state to URL ([5133273](https://github.com/taverns-red/toast-stats/commit/513327339ab13993ca12b3964d248bab5a53b137))
* **a11y:** [#611](https://github.com/taverns-red/toast-stats/issues/611) Methodology / History / Landing dark-mode sweep (Track D final) ([#655](https://github.com/taverns-red/toast-stats/issues/655)) ([5cc19da](https://github.com/taverns-red/toast-stats/commit/5cc19dac1c271fc6cb08fcbdc475563f1e3a5c27))
* add /api prefix to production API base URL ([75e3ad5](https://github.com/taverns-red/toast-stats/commit/75e3ad5d21357fd79f0d7037239137fa47d3c66d))
* add missing fetchCdnSnapshotIndex mock to LandingPage tests ([#233](https://github.com/taverns-red/toast-stats/issues/233)) ([c03f194](https://github.com/taverns-red/toast-stats/commit/c03f194e40e7478b03f2e5fa5d61a226532a9fb1))
* **anniversary:** every multiple of 5 is a milestone, unbounded ([#509](https://github.com/taverns-red/toast-stats/issues/509)) ([#510](https://github.com/taverns-red/toast-stats/issues/510)) ([5bdf7f5](https://github.com/taverns-red/toast-stats/commit/5bdf7f501ed7c1088a03712a3c4c979024dd2f12))
* **anniversary:** tighter, denser layout per design handoff ([#511](https://github.com/taverns-red/toast-stats/issues/511)) ([#512](https://github.com/taverns-red/toast-stats/issues/512)) ([eb4086b](https://github.com/taverns-red/toast-stats/commit/eb4086bee8d8e852cc520275dabf0e74e4de612e))
* **awards:** [#608](https://github.com/taverns-red/toast-stats/issues/608) Awards section dark-mode contrast sweep ([#646](https://github.com/taverns-red/toast-stats/issues/646)) ([7b749c4](https://github.com/taverns-red/toast-stats/commit/7b749c47ed18e6a9ddb0d5b4ebcc7b60aaa6f46e))
* **breadcrumbs:** drop redundant top-level crumb on district + club detail ([#442](https://github.com/taverns-red/toast-stats/issues/442)) ([#455](https://github.com/taverns-red/toast-stats/issues/455)) ([5184313](https://github.com/taverns-red/toast-stats/commit/5184313932ba274577af645ad2dcc89ed292bf42))
* club net change uses base vs current membership ([#194](https://github.com/taverns-red/toast-stats/issues/194)) ([21e07bc](https://github.com/taverns-red/toast-stats/commit/21e07bcc140d2db4689496546f77a7dcd3734160))
* club.membershipBase ?? membershipTrend[0].count ?? currentMembers ([d7109df](https://github.com/taverns-red/toast-stats/commit/d7109df4ec34912d779ec45854a9b14d9b75d7c0))
* **club:** [#610](https://github.com/taverns-red/toast-stats/issues/610) ClubDetailPage dark-mode contrast sweep ([#654](https://github.com/taverns-red/toast-stats/issues/654)) ([f1b8090](https://github.com/taverns-red/toast-stats/commit/f1b8090c78455b3daa8a44d3d7a339baa57464ad))
* **club:** [#618](https://github.com/taverns-red/toast-stats/issues/618) pin hero pill text to AA-safe literals on the white pill ([#639](https://github.com/taverns-red/toast-stats/issues/639)) ([1dac46c](https://github.com/taverns-red/toast-stats/commit/1dac46c174ec26d17cb1083aff9faf7635d82546))
* ClubDCPGoalsCard not visible — data path and column names ([#242](https://github.com/taverns-red/toast-stats/issues/242)) ([e23e92d](https://github.com/taverns-red/toast-stats/commit/e23e92db62d8003f7f8cfe15c5eb49dbed2dbbd6))
* compute payment YoY from time-series data ([#269](https://github.com/taverns-red/toast-stats/issues/269)) ([3e3975b](https://github.com/taverns-red/toast-stats/commit/3e3975b4b2d98c72c935f4e9fb4cade5cea68eec))
* convert manualChunks to function for Rolldown compatibility ([#175](https://github.com/taverns-red/toast-stats/issues/175)) ([fb533a3](https://github.com/taverns-red/toast-stats/commit/fb533a3d89cbd9ca98422460f60a279a0db038c6))
* **css:** tailwind preflight was overriding every brand class — split layers ([#403](https://github.com/taverns-red/toast-stats/issues/403)) ([00ae821](https://github.com/taverns-red/toast-stats/commit/00ae821bbef9597f433b3388f3771b9e4ca3e414))
* date count inconsistency between landing and district pages ([#233](https://github.com/taverns-red/toast-stats/issues/233)) ([e8b968d](https://github.com/taverns-red/toast-stats/commit/e8b968dae5ec235d2d5200f4a0f0f59807c02d9f))
* date selector typo and region spacing ([#195](https://github.com/taverns-red/toast-stats/issues/195), [#196](https://github.com/taverns-red/toast-stats/issues/196)) ([8fb93a8](https://github.com/taverns-red/toast-stats/commit/8fb93a85e1624cefef43fb91a1eb227675b515cb))
* **deploy:** footer version was rendering as bare "v" — fix yaml/shell quoting ([#397](https://github.com/taverns-red/toast-stats/issues/397)) ([103d2b2](https://github.com/taverns-red/toast-stats/commit/103d2b290f05a7ef0070bc3e1497a8f1e23b132f))
* district detail page — rankings, date selector, cleanup ([#183](https://github.com/taverns-red/toast-stats/issues/183)) ([271224b](https://github.com/taverns-red/toast-stats/commit/271224b114feff3dc3983f9b19a022f918a32d68))
* **district-overview:** payment donut denominator is payments, not members ([#360](https://github.com/taverns-red/toast-stats/issues/360)) ([#468](https://github.com/taverns-red/toast-stats/issues/468)) ([f4aaa69](https://github.com/taverns-red/toast-stats/commit/f4aaa69afb89ce1dc2c087334df2b8fe8001b7e8))
* **district:** rename "District Recognition" → "Distinguished District Status" ([#358](https://github.com/taverns-red/toast-stats/issues/358)) ([#408](https://github.com/taverns-red/toast-stats/issues/408)) ([2ee1ef3](https://github.com/taverns-red/toast-stats/commit/2ee1ef3e2354cea57e0a1730820bf158b9b89754))
* **districts:** drop Analytics chip + redundant district number, no-op [#521](https://github.com/taverns-red/toast-stats/issues/521) ([#519](https://github.com/taverns-red/toast-stats/issues/519) [#520](https://github.com/taverns-red/toast-stats/issues/520) [#521](https://github.com/taverns-red/toast-stats/issues/521)) ([#523](https://github.com/taverns-red/toast-stats/issues/523)) ([4ae84a3](https://github.com/taverns-red/toast-stats/commit/4ae84a317352bd90f4f1f5d43fcc519f9611373c))
* Division & Area tab empty — unwrap CDN snapshot data key ([#184](https://github.com/taverns-red/toast-stats/issues/184)) ([5b99953](https://github.com/taverns-red/toast-stats/commit/5b9995375a82c819c5b07e2ddb7ebcc26ce57ca1))
* exclude new charters from District Club Retention Award ([#336](https://github.com/taverns-red/toast-stats/issues/336)) ([#337](https://github.com/taverns-red/toast-stats/issues/337)) ([239a31a](https://github.com/taverns-red/toast-stats/commit/239a31acbb424483ea546c76c85f129d6e6b5707))
* **fac:** propagate FAC enrichment through ClubTrend so CHARTERED actually renders ([#503](https://github.com/taverns-red/toast-stats/issues/503)) ([#504](https://github.com/taverns-red/toast-stats/issues/504)) ([3c4a96c](https://github.com/taverns-red/toast-stats/commit/3c4a96c56795cdd97b5b293d559225669bd478cc))
* gap-to-tier now accounts for net growth alternative ([#239](https://github.com/taverns-red/toast-stats/issues/239)) ([af6b7a0](https://github.com/taverns-red/toast-stats/commit/af6b7a0f8510e877df2f88c48fd7009d960c018e))
* gap-to-tier uses membershipBase instead of trend[0] ([#241](https://github.com/taverns-red/toast-stats/issues/241)) ([d7109df](https://github.com/taverns-red/toast-stats/commit/d7109df4ec34912d779ec45854a9b14d9b75d7c0))
* HistoricalRankChart uses selected program year for label ([#232](https://github.com/taverns-red/toast-stats/issues/232)) ([9c8eb41](https://github.com/taverns-red/toast-stats/commit/9c8eb41268bcea4fe7731488b47b64ed9165abea))
* **hooks:** 5 setState-in-effect violations → render-phase sync ([#340](https://github.com/taverns-red/toast-stats/issues/340)) ([#475](https://github.com/taverns-red/toast-stats/issues/475)) ([70eabce](https://github.com/taverns-red/toast-stats/commit/70eabcea5fe92b596c99296e18e807070734d7ce))
* landing page rankings table now loads per-date data ([#301](https://github.com/taverns-red/toast-stats/issues/301)) ([f1d58dc](https://github.com/taverns-red/toast-stats/commit/f1d58dc9eb87dee2123892117ee518d4404424d4))
* landing page table uses overallRank from data instead of array index ([#303](https://github.com/taverns-red/toast-stats/issues/303)) ([3b01f62](https://github.com/taverns-red/toast-stats/commit/3b01f628e3089a30c95cbc6a48baa2ec78179102))
* member change badge uses payment base and pipeline uses --force-analytics ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([2af26d5](https://github.com/taverns-red/toast-stats/commit/2af26d5fe326b242e6d2dd74621b985ee9a4b603))
* **methodology:** correct DCP tier definitions + club health classifications ([#439](https://github.com/taverns-red/toast-stats/issues/439), [#440](https://github.com/taverns-red/toast-stats/issues/440)) ([#456](https://github.com/taverns-red/toast-stats/issues/456)) ([a46fb00](https://github.com/taverns-red/toast-stats/commit/a46fb00ffd069e501a5e988658cde3d0453507a9))
* mirror level-aware provisional thresholds in client-side fallback ([#296](https://github.com/taverns-red/toast-stats/issues/296)) ([8959305](https://github.com/taverns-red/toast-stats/commit/8959305bb099a07d92e4c7c0eda6b0b08e61468d))
* multi-year chart uses merged dataset for proper X-axis alignment ([#243](https://github.com/taverns-red/toast-stats/issues/243)) ([ed8fad3](https://github.com/taverns-red/toast-stats/commit/ed8fad32bce5680886447d3bf4722c7093448c09))
* multi-year payments chart uses timeSeries CDN data ([#243](https://github.com/taverns-red/toast-stats/issues/243)) ([c5909d9](https://github.com/taverns-red/toast-stats/commit/c5909d9da4938e220c2adf6ca45fb51be1ce4eca))
* neutralize Borda count for tied categories and fix copy/date selector ([#197](https://github.com/taverns-red/toast-stats/issues/197), [#198](https://github.com/taverns-red/toast-stats/issues/198), [#180](https://github.com/taverns-red/toast-stats/issues/180)) ([b26e514](https://github.com/taverns-red/toast-stats/commit/b26e514515080ec0b9ffc8b0917247b13a57240f))
* **overview:** bullet-bar zoom scale + region rank inline restyle ([#557](https://github.com/taverns-red/toast-stats/issues/557), [#558](https://github.com/taverns-red/toast-stats/issues/558)) ([#559](https://github.com/taverns-red/toast-stats/issues/559)) ([7d3176f](https://github.com/taverns-red/toast-stats/commit/7d3176fcbb82d8a319a6e28a0253e743d0e9689b))
* **overview:** tier-tick positioning — hotfix [#559](https://github.com/taverns-red/toast-stats/issues/559) visual regression ([#562](https://github.com/taverns-red/toast-stats/issues/562)) ([3a95f32](https://github.com/taverns-red/toast-stats/commit/3a95f32f699eb3e1bf9f8520fc0ce52e417ab6fd))
* paymentBase field name mismatch and empty topGrowthClubs ([#190](https://github.com/taverns-red/toast-stats/issues/190), [#185](https://github.com/taverns-red/toast-stats/issues/185)) ([652e865](https://github.com/taverns-red/toast-stats/commit/652e865b71bd57f82bbbc77fe02aa89319be0cb5))
* payments trend chart shows 0 — wire performanceTargets from CDN ([#183](https://github.com/taverns-red/toast-stats/issues/183)) ([a08f086](https://github.com/taverns-red/toast-stats/commit/a08f0864899cf3cb3eca1fbbf9c143e854bba0d7))
* **perf:** [#488](https://github.com/taverns-red/toast-stats/issues/488) short-circuit LazyComparisonPanel — drops CLS 0.217 → 0.01 ([#590](https://github.com/taverns-red/toast-stats/issues/590)) ([f2aa04c](https://github.com/taverns-red/toast-stats/commit/f2aa04c42e5da34fabc807a1f6ba1a28b1929cc9))
* prefix numeric district names with 'District' ([#188](https://github.com/taverns-red/toast-stats/issues/188)) ([a1deb0d](https://github.com/taverns-red/toast-stats/commit/a1deb0da0412e8afedaf7ff5adf1d7e6be2fdeba))
* provisional badge in area performance table row ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([9f60720](https://github.com/taverns-red/toast-stats/commit/9f60720a405bc414343c8142e95a75b1e8ee5dc6))
* **region:** /regions leaderboard invisible when OS=dark + app=light (epic [#683](https://github.com/taverns-red/toast-stats/issues/683), Sprint 8) ([#716](https://github.com/taverns-red/toast-stats/issues/716)) ([9a5a5b3](https://github.com/taverns-red/toast-stats/commit/9a5a5b36428873f86327e9fe5c1658896d61a168))
* **region:** district chip dark-mode contrast (epic [#683](https://github.com/taverns-red/toast-stats/issues/683), Sprint 7) ([#699](https://github.com/taverns-red/toast-stats/issues/699)) ([#714](https://github.com/taverns-red/toast-stats/issues/714)) ([231b879](https://github.com/taverns-red/toast-stats/commit/231b879cbacea83664d376c65b7f344cd6f8b91a))
* **region:** Net Club Growth shows signed net change, not distinguished-gap ([#684](https://github.com/taverns-red/toast-stats/issues/684)) ([#695](https://github.com/taverns-red/toast-stats/issues/695)) ([0f5e859](https://github.com/taverns-red/toast-stats/commit/0f5e859d688f83119d4c00906185684c65ba7fd1))
* **regions:** [#609](https://github.com/taverns-red/toast-stats/issues/609) Region pages dark-mode contrast sweep ([#652](https://github.com/taverns-red/toast-stats/issues/652)) ([37a96ee](https://github.com/taverns-red/toast-stats/commit/37a96ee2de31e349ced94549fb9b26895222a507))
* **regions:** Borda-count region scoring + /methodology section ([#501](https://github.com/taverns-red/toast-stats/issues/501)) ([#502](https://github.com/taverns-red/toast-stats/issues/502)) ([06434c8](https://github.com/taverns-red/toast-stats/commit/06434c846f6a14774ad1847400d6decb492560a4))
* **regions:** index findability — jump-to-region finder + dark focus/hover contrast (epic [#683](https://github.com/taverns-red/toast-stats/issues/683)) ([#696](https://github.com/taverns-red/toast-stats/issues/696)) ([2fab238](https://github.com/taverns-red/toast-stats/commit/2fab238338b93430f99d2d95cd82d721b5aeee7d))
* remove /api prefix from API URLs — Cloud Run routes at root ([#14](https://github.com/taverns-red/toast-stats/issues/14)) ([48bb7fc](https://github.com/taverns-red/toast-stats/commit/48bb7fcdf7262e680a6d314e4a5cdb18c0227847))
* remove stale woff2 font preload URLs ([b818ee8](https://github.com/taverns-red/toast-stats/commit/b818ee8b220cc734e87c724d48ba13debcc4aa46))
* replace membership projections with health-based distinguished outlook ([#231](https://github.com/taverns-red/toast-stats/issues/231)) ([8409fbd](https://github.com/taverns-red/toast-stats/commit/8409fbd75409113a895fb221578f8f429ee08015))
* replace misleading 'Top X%' with ordinal percentile ([#305](https://github.com/taverns-red/toast-stats/issues/305)) ([4595547](https://github.com/taverns-red/toast-stats/commit/459554726768c004da06a21eabd361376c117f8b))
* revert DCP progress panel to list-based timeline ([#166](https://github.com/taverns-red/toast-stats/issues/166)) ([eff6256](https://github.com/taverns-red/toast-stats/commit/eff62560a2f56cc15edd1fe7b4db3fca139e54e4))
* **shell:** drop double-v prefix on footer version ([#354](https://github.com/taverns-red/toast-stats/issues/354)) ([#380](https://github.com/taverns-red/toast-stats/issues/380)) ([50ae0cd](https://github.com/taverns-red/toast-stats/commit/50ae0cd2a7c0efd8d4bc0dc758d3b43114284b4d))
* snapshot-index always writes nested format, frontend normalizes on read ([#182](https://github.com/taverns-red/toast-stats/issues/182)) ([b2a7b93](https://github.com/taverns-red/toast-stats/commit/b2a7b93642beff045a726c2a0bdd332083760556))
* stabilize club detail smoke test selector ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([6534f48](https://github.com/taverns-red/toast-stats/commit/6534f48df657e591067d1af52c4781d401c77092))
* staging CDN URL detection survives Vite build optimization ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([4c628f7](https://github.com/taverns-red/toast-stats/commit/4c628f74969456c7559544fb2c81dc2f009a582a))
* **theme:** [#564](https://github.com/taverns-red/toast-stats/issues/564) Phase 2 — opacity-variant dark-mode sweep + inert bg-amber-50/N fix ([#581](https://github.com/taverns-red/toast-stats/issues/581)) ([38720bd](https://github.com/taverns-red/toast-stats/commit/38720bd49dafdfb53c9ed38b270dc96c4c655c92))
* **theme:** [#564](https://github.com/taverns-red/toast-stats/issues/564) Phase 3 — light-mode small-text tightening ([#582](https://github.com/taverns-red/toast-stats/issues/582)) ([fe74ddb](https://github.com/taverns-red/toast-stats/commit/fe74ddbe9f15ae394a7d4ca38ef7e56c51d2c993))
* **theme:** [#564](https://github.com/taverns-red/toast-stats/issues/564) Phase 4 — axe-core regression coverage + unmitigated-utilities guard ([#584](https://github.com/taverns-red/toast-stats/issues/584)) ([a8ff059](https://github.com/taverns-red/toast-stats/commit/a8ff059465e76a42fc88e362ad87465477814b24))
* **theme:** dark-mode overrides for District Detail surface ([#564](https://github.com/taverns-red/toast-stats/issues/564) Phase 1) ([#567](https://github.com/taverns-red/toast-stats/issues/567)) ([aa18542](https://github.com/taverns-red/toast-stats/commit/aa1854269c1aa6ef9921c6ac6bf1c9f0f3ebb9ac))
* Trends tab uses consistent data sources across all sections ([#319](https://github.com/taverns-red/toast-stats/issues/319)) ([3cd3689](https://github.com/taverns-red/toast-stats/commit/3cd36898f3f9301f715ff8b3195351c0c10fdfce))
* **ui:** add membersNeeded to applyFilter switch statement ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([5c37ef4](https://github.com/taverns-red/toast-stats/commit/5c37ef4b0c1b949c93630e102565d42cd44c83da))
* update test mocks for CDN-only analytics ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([a53463d](https://github.com/taverns-red/toast-stats/commit/a53463d53a93f902752c2335228e31c53e299a95))
* use build-time VITE_CDN_BASE_URL for staging CDN ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([ae8fea2](https://github.com/taverns-red/toast-stats/commit/ae8fea25b9c392bf80f885a4b3165d07377ebe94))
* use correct CDN field name 'May Visit award' for second-round visits ([#268](https://github.com/taverns-red/toast-stats/issues/268)) ([c6b9113](https://github.com/taverns-red/toast-stats/commit/c6b911383d3b205aca41502482dc64ef4a7a73f8))
* **visual:** post-audit visual regressions — Awards data, top bar, History chips, Districts toolbar/table ([#394](https://github.com/taverns-red/toast-stats/issues/394)) ([28c7e34](https://github.com/taverns-red/toast-stats/commit/28c7e346b4e0fbb3e2c773cd06dfc73f1bd5a3a0))


### Refactors

* convert dates queries to CDN fetchCdnDates ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([7a1c433](https://github.com/taverns-red/toast-stats/commit/7a1c43302bd7918b8f75ee41292bf1c51adcfe6f))
* convert useAggregatedAnalytics and useVulnerableClubs to CDN-only ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([b54e40d](https://github.com/taverns-red/toast-stats/commit/b54e40dd28bbb7fa4e293888ee684ad51bfff6e1))
* extract &lt;DistrictChipAndName&gt; ([#522](https://github.com/taverns-red/toast-stats/issues/522)) ([#586](https://github.com/taverns-red/toast-stats/issues/586)) ([b632278](https://github.com/taverns-red/toast-stats/commit/b6322781d15ea8880979680bbccb1aef201dafb2))
* migrate frontend types to shared-contracts — DistrictRanking, ProgramYearWithData, AvailableRankingYearsResponse ([#130](https://github.com/taverns-red/toast-stats/issues/130)) ([8572f0f](https://github.com/taverns-red/toast-stats/commit/8572f0f1ca76ff3a5ef172c509f3075e83a695bd))
* **rankings:** chrome refresh on Global Rankings chart + multi-year table ([#365](https://github.com/taverns-red/toast-stats/issues/365)) ([#400](https://github.com/taverns-red/toast-stats/issues/400)) ([8e7f350](https://github.com/taverns-red/toast-stats/commit/8e7f350dda9c33a4b0a927eadbdd78de48ddc28f))
* remove DCPProjectionsTable from Analytics tab ([#187](https://github.com/taverns-red/toast-stats/issues/187)) ([61ed46a](https://github.com/taverns-red/toast-stats/commit/61ed46a3c89b35d1c5d9e419c80f2931eec5c180))
* remove stale Express API references ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([071fa67](https://github.com/taverns-red/toast-stats/commit/071fa676d2d7898834bde63677a18d1df222b166))
* retire legacy district overview panels + fix flaky pre-push ([#472](https://github.com/taverns-red/toast-stats/issues/472) [#473](https://github.com/taverns-red/toast-stats/issues/473)) ([#474](https://github.com/taverns-red/toast-stats/issues/474)) ([ae7485e](https://github.com/taverns-red/toast-stats/commit/ae7485e06c8d1907b354e23d142b56a60ab5a413))
* split designTokens.ts into domain-specific modules ([#134](https://github.com/taverns-red/toast-stats/issues/134)) ([d56746e](https://github.com/taverns-red/toast-stats/commit/d56746e47c022d1216fe8712e616fd64aed56c09))
* split LazyCharts into individual files to fix fast refresh warning ([#251](https://github.com/taverns-red/toast-stats/issues/251)) ([9a8139d](https://github.com/taverns-red/toast-stats/commit/9a8139d7a4e3ef40f135cad9456cfba9ce145530))


### Documentation

* **methodology:** reciprocal /awards links from Borda/DCP/Caveats ([#373](https://github.com/taverns-red/toast-stats/issues/373)) ([#478](https://github.com/taverns-red/toast-stats/issues/478)) ([a8d212e](https://github.com/taverns-red/toast-stats/commit/a8d212e92e58cff067a8eb2e1b695414a7ef2569))


### Tests

* add aprilRenewals to integration test mocks ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([bf23a00](https://github.com/taverns-red/toast-stats/commit/bf23a0064d99d27aab6d22760f5c7e77d5b0e875))
* add CDN module mock to useAggregatedAnalytics tests ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([3978abc](https://github.com/taverns-red/toast-stats/commit/3978abc9696a0f12ac63475e0cc8748618a24fd2))
* add comprehensive CSV export test coverage ([#282](https://github.com/taverns-red/toast-stats/issues/282)) ([f086c95](https://github.com/taverns-red/toast-stats/commit/f086c95f4eaeab2949de5cb42d029f585d7f28ce))
* add integration test suite for critical user journeys ([#261](https://github.com/taverns-red/toast-stats/issues/261)) ([f5909df](https://github.com/taverns-red/toast-stats/commit/f5909dff46c7fad65680ead0836df4985a1fee47))
* add unit coverage for Sprint 15 UX utilities ([a5de16e](https://github.com/taverns-red/toast-stats/commit/a5de16e8925382f7288aed1327f8e9ecf09ebd08))
* align ClubsTable integration tests with Members Needed column layout ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([f0c44b8](https://github.com/taverns-red/toast-stats/commit/f0c44b86ac7f255bead974bca53e231e29faab43))
* fix useResponsiveChartTicks logic and add a11y DOM tests ([#18](https://github.com/taverns-red/toast-stats/issues/18)) ([ba9a668](https://github.com/taverns-red/toast-stats/commit/ba9a6688ac1157496fb849a1add777178548534a))
* migrate provisional Distinguished tests to ClubDetailPage ([#299](https://github.com/taverns-red/toast-stats/issues/299)) ([4a39390](https://github.com/taverns-red/toast-stats/commit/4a393908e1cbf349dcd8e68b2606d4bdd77ea2ee))
* red phase — getLatestPayments helper for time-series consistency ([#319](https://github.com/taverns-red/toast-stats/issues/319)) ([569b5a0](https://github.com/taverns-red/toast-stats/commit/569b5a0d1c9d8b743e50ac1e7423bd8b7d7a4923))
* red phase — Multi-Year table should use per-date rankings ([#302](https://github.com/taverns-red/toast-stats/issues/302)) ([d44c6c7](https://github.com/taverns-red/toast-stats/commit/d44c6c7e3b4674af92012eb71a7057592fc62d40))
* red phase — per-date rankings override in GlobalRankingsTab ([#302](https://github.com/taverns-red/toast-stats/issues/302)) ([413ed83](https://github.com/taverns-red/toast-stats/commit/413ed83bf36bf84807dc5bc6fa89c29868b021ac))
* red phase — provisional Distinguished badge tests ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([0056f67](https://github.com/taverns-red/toast-stats/commit/0056f6731bae8a7b1f3ed9b1ec34f734e53cf764))
* red phase — replace 'Top X%' with ordinal percentile ([#305](https://github.com/taverns-red/toast-stats/issues/305)) ([8d4e077](https://github.com/taverns-red/toast-stats/commit/8d4e0774de0f8fcb17f0dcc08759d0329f5219f1))
* update DCP section test for renamed component ([#231](https://github.com/taverns-red/toast-stats/issues/231)) ([3cd715b](https://github.com/taverns-red/toast-stats/commit/3cd715baf362fe99f9c2c06b5ac61139e3032b38))
* update test spies from console.* to logger ([#283](https://github.com/taverns-red/toast-stats/issues/283)) ([9201c50](https://github.com/taverns-red/toast-stats/commit/9201c500365cc72627188f49cbc685dfb5a47e24))

## [2.13.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.12.0...frontend-v2.13.0) (2026-05-23)


### Features

* **a11y:** tablist arrow-key navigation + tabpanel linkage ([#384](https://github.com/taverns-red/toast-stats/issues/384)) ([#476](https://github.com/taverns-red/toast-stats/issues/476)) ([dfc06f0](https://github.com/taverns-red/toast-stats/commit/dfc06f0e32f70a3a116b206477762cfabbba6e7a))
* **anniversary:** hero badge + clubs-table Years column ([#445](https://github.com/taverns-red/toast-stats/issues/445) [#448](https://github.com/taverns-red/toast-stats/issues/448) [#443](https://github.com/taverns-red/toast-stats/issues/443)) ([#506](https://github.com/taverns-red/toast-stats/issues/506)) ([0f9b45b](https://github.com/taverns-red/toast-stats/commit/0f9b45b8c2ca22d49ac0bb30ed8a999ea265486d))
* **app-shell:** move ThemeToggle from footer to header ([#565](https://github.com/taverns-red/toast-stats/issues/565)) ([#566](https://github.com/taverns-red/toast-stats/issues/566)) ([175ade1](https://github.com/taverns-red/toast-stats/commit/175ade185a8faff0d1aa0dc3ade6d80bd8080261))
* **awards-race:** add progress bars + threshold sub-line per design ([#357](https://github.com/taverns-red/toast-stats/issues/357)) ([#404](https://github.com/taverns-red/toast-stats/issues/404)) ([e9de6a3](https://github.com/taverns-red/toast-stats/commit/e9de6a371dcd001eed8f0c45b190d7e22cac31d8))
* **awards-race:** wrap 3 cards in single bordered panel + timestamp meta ([#406](https://github.com/taverns-red/toast-stats/issues/406)) ([75046f7](https://github.com/taverns-red/toast-stats/commit/75046f7eee4c9f3596a0b426173249a58b628887))
* **brand:** [#339](https://github.com/taverns-red/toast-stats/issues/339) adopt Red Taverns Brand v1.0 tokens — Phase 1 (additive) ([#595](https://github.com/taverns-red/toast-stats/issues/595)) ([ab3d83a](https://github.com/taverns-red/toast-stats/commit/ab3d83ac1aab21bcc4404bd2eaa9852436b138b5))
* **close-to-distinguished:** tighten threshold to ≤4 + unify across views ([#433](https://github.com/taverns-red/toast-stats/issues/433)) ([#441](https://github.com/taverns-red/toast-stats/issues/441)) ([c8190f4](https://github.com/taverns-red/toast-stats/commit/c8190f4022a8359f8c0e9dbf0a2c93c6658f7689))
* **clubs-table:** status segmented filter with counts ([#361](https://github.com/taverns-red/toast-stats/issues/361)) ([#470](https://github.com/taverns-red/toast-stats/issues/470)) ([4bc8e39](https://github.com/taverns-red/toast-stats/commit/4bc8e3945c66d8ba2fae4b5353a8283310a87412))
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

* **anniversary:** every multiple of 5 is a milestone, unbounded ([#509](https://github.com/taverns-red/toast-stats/issues/509)) ([#510](https://github.com/taverns-red/toast-stats/issues/510)) ([5bdf7f5](https://github.com/taverns-red/toast-stats/commit/5bdf7f501ed7c1088a03712a3c4c979024dd2f12))
* **anniversary:** tighter, denser layout per design handoff ([#511](https://github.com/taverns-red/toast-stats/issues/511)) ([#512](https://github.com/taverns-red/toast-stats/issues/512)) ([eb4086b](https://github.com/taverns-red/toast-stats/commit/eb4086bee8d8e852cc520275dabf0e74e4de612e))
* **breadcrumbs:** drop redundant top-level crumb on district + club detail ([#442](https://github.com/taverns-red/toast-stats/issues/442)) ([#455](https://github.com/taverns-red/toast-stats/issues/455)) ([5184313](https://github.com/taverns-red/toast-stats/commit/5184313932ba274577af645ad2dcc89ed292bf42))
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

* extract &lt;DistrictChipAndName&gt; ([#522](https://github.com/taverns-red/toast-stats/issues/522)) ([#586](https://github.com/taverns-red/toast-stats/issues/586)) ([b632278](https://github.com/taverns-red/toast-stats/commit/b6322781d15ea8880979680bbccb1aef201dafb2))
* retire legacy district overview panels + fix flaky pre-push ([#472](https://github.com/taverns-red/toast-stats/issues/472) [#473](https://github.com/taverns-red/toast-stats/issues/473)) ([#474](https://github.com/taverns-red/toast-stats/issues/474)) ([ae7485e](https://github.com/taverns-red/toast-stats/commit/ae7485e06c8d1907b354e23d142b56a60ab5a413))


### Documentation

* **methodology:** reciprocal /awards links from Borda/DCP/Caveats ([#373](https://github.com/taverns-red/toast-stats/issues/373)) ([#478](https://github.com/taverns-red/toast-stats/issues/478)) ([a8d212e](https://github.com/taverns-red/toast-stats/commit/a8d212e92e58cff067a8eb2e1b695414a7ef2569))

## [2.12.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.11.0...frontend-v2.12.0) (2026-05-10)


### Features

* **club:** redesign Close-to-Distinguished call-out + move under hero ([#366](https://github.com/taverns-red/toast-stats/issues/366)) ([#401](https://github.com/taverns-red/toast-stats/issues/401)) ([7ac4fe8](https://github.com/taverns-red/toast-stats/commit/7ac4fe86715b11ecee1a697144db8ef725ff72a5))
* **club:** redesign Club detail hero header per handoff ([#23](https://github.com/taverns-red/toast-stats/issues/23) follow-up to [#366](https://github.com/taverns-red/toast-stats/issues/366)) ([#398](https://github.com/taverns-red/toast-stats/issues/398)) ([1cdf649](https://github.com/taverns-red/toast-stats/commit/1cdf64921d8bf620f647904bb280b44ae6755f8f))
* **clubs:** redesign quick-filter chips on Clubs tab ([#24](https://github.com/taverns-red/toast-stats/issues/24) follow-up to [#361](https://github.com/taverns-red/toast-stats/issues/361)) ([#399](https://github.com/taverns-red/toast-stats/issues/399)) ([649acdc](https://github.com/taverns-red/toast-stats/commit/649acdcdd78bfd2d53a188300868a621a7444fe1))


### Bug Fixes

* **deploy:** footer version was rendering as bare "v" — fix yaml/shell quoting ([#397](https://github.com/taverns-red/toast-stats/issues/397)) ([103d2b2](https://github.com/taverns-red/toast-stats/commit/103d2b290f05a7ef0070bc3e1497a8f1e23b132f))
* **visual:** post-audit visual regressions — Awards data, top bar, History chips, Districts toolbar/table ([#394](https://github.com/taverns-red/toast-stats/issues/394)) ([28c7e34](https://github.com/taverns-red/toast-stats/commit/28c7e346b4e0fbb3e2c773cd06dfc73f1bd5a3a0))


### Refactors

* **rankings:** chrome refresh on Global Rankings chart + multi-year table ([#365](https://github.com/taverns-red/toast-stats/issues/365)) ([#400](https://github.com/taverns-red/toast-stats/issues/400)) ([8e7f350](https://github.com/taverns-red/toast-stats/commit/8e7f350dda9c33a4b0a927eadbdd78de48ddc28f))

## [2.11.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.10.0...frontend-v2.11.0) (2026-05-10)


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

* **shell:** drop double-v prefix on footer version ([#354](https://github.com/taverns-red/toast-stats/issues/354)) ([#380](https://github.com/taverns-red/toast-stats/issues/380)) ([50ae0cd](https://github.com/taverns-red/toast-stats/commit/50ae0cd2a7c0efd8d4bc0dc758d3b43114284b4d))

## [2.10.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.9.0...frontend-v2.10.0) (2026-04-22)


### Features

* display threshold + officer awards in trophy case ([#333](https://github.com/taverns-red/toast-stats/issues/333)) ([91bafe3](https://github.com/taverns-red/toast-stats/commit/91bafe36a7ee2a730f8dc783e4a03d74fa21df8b))
* Distinguished District tier tracking + trophy case ([#332](https://github.com/taverns-red/toast-stats/issues/332)) ([1e12e5c](https://github.com/taverns-red/toast-stats/commit/1e12e5cd696c9303dae58c5a17e61b89394e9b59))
* district-free club URL + club index ([#320](https://github.com/taverns-red/toast-stats/issues/320)) ([7f12903](https://github.com/taverns-red/toast-stats/commit/7f12903c8f85a2c270cb6bb47efdf4442ee5d3ae))
* mark area Distinguished as provisional when visits incomplete ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([3459456](https://github.com/taverns-red/toast-stats/commit/3459456fef2df5db73749858de6cedf4e3086259))
* PaymentCompositionCard on District Detail Overview ([#327](https://github.com/taverns-red/toast-stats/issues/327)) ([25c0fcc](https://github.com/taverns-red/toast-stats/commit/25c0fcc28f36be41dec28bd0cbaa810f93cf8871))
* replace region filter disclosure with pill toggle bar ([#326](https://github.com/taverns-red/toast-stats/issues/326)) ([1a1ce01](https://github.com/taverns-red/toast-stats/commit/1a1ce0148c8914f0155ae94db4b27b8cb72e83ca))
* show average members per club on district overview ([#318](https://github.com/taverns-red/toast-stats/issues/318)) ([186a257](https://github.com/taverns-red/toast-stats/commit/186a2575cd244f1a58a8dd35e7f4d0fe28bce5cc))
* staging environment — Phase 1+2 infrastructure + pipeline ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([0be241b](https://github.com/taverns-red/toast-stats/commit/0be241b9041470037070affb96c3737173535fb0))
* surface competitive award standings on landing page ([#331](https://github.com/taverns-red/toast-stats/issues/331)) ([9451faf](https://github.com/taverns-red/toast-stats/commit/9451faf9f35b16e0d1770b1ced48bee13e77f897))


### Bug Fixes

* 'Close to Distinguished' button syncs sort state to URL ([5133273](https://github.com/taverns-red/toast-stats/commit/513327339ab13993ca12b3964d248bab5a53b137))
* exclude new charters from District Club Retention Award ([#336](https://github.com/taverns-red/toast-stats/issues/336)) ([#337](https://github.com/taverns-red/toast-stats/issues/337)) ([239a31a](https://github.com/taverns-red/toast-stats/commit/239a31acbb424483ea546c76c85f129d6e6b5707))
* provisional badge in area performance table row ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([9f60720](https://github.com/taverns-red/toast-stats/commit/9f60720a405bc414343c8142e95a75b1e8ee5dc6))
* stabilize club detail smoke test selector ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([6534f48](https://github.com/taverns-red/toast-stats/commit/6534f48df657e591067d1af52c4781d401c77092))
* staging CDN URL detection survives Vite build optimization ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([4c628f7](https://github.com/taverns-red/toast-stats/commit/4c628f74969456c7559544fb2c81dc2f009a582a))
* Trends tab uses consistent data sources across all sections ([#319](https://github.com/taverns-red/toast-stats/issues/319)) ([3cd3689](https://github.com/taverns-red/toast-stats/commit/3cd36898f3f9301f715ff8b3195351c0c10fdfce))
* use build-time VITE_CDN_BASE_URL for staging CDN ([#316](https://github.com/taverns-red/toast-stats/issues/316)) ([ae8fea2](https://github.com/taverns-red/toast-stats/commit/ae8fea25b9c392bf80f885a4b3165d07377ebe94))


### Tests

* red phase — getLatestPayments helper for time-series consistency ([#319](https://github.com/taverns-red/toast-stats/issues/319)) ([569b5a0](https://github.com/taverns-red/toast-stats/commit/569b5a0d1c9d8b743e50ac1e7423bd8b7d7a4923))

## [2.9.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.8.0...frontend-v2.9.0) (2026-04-07)


### Features

* Google Analytics 4 + release notes link in footer ([#314](https://github.com/taverns-red/toast-stats/issues/314), [#312](https://github.com/taverns-red/toast-stats/issues/312)) ([fa5a2be](https://github.com/taverns-red/toast-stats/commit/fa5a2be45e8fc2bd5aa5bcc596d7bd6d6fba63f8))

## [2.8.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.7.0...frontend-v2.8.0) (2026-04-06)


### Features

* add client-side provisional Distinguished utility ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([ee83434](https://github.com/taverns-red/toast-stats/commit/ee8343444dd7292dc6822c200031c10fd31d968d))
* add CSP submission status card to ClubDetailPage ([#298](https://github.com/taverns-red/toast-stats/issues/298)) ([302e080](https://github.com/taverns-red/toast-stats/commit/302e08017117839241a46808db909e9b3402c291))
* GlobalRankingsTab uses per-date rankings for accuracy ([#302](https://github.com/taverns-red/toast-stats/issues/302)) ([46c7b28](https://github.com/taverns-red/toast-stats/commit/46c7b28bb6e8f43f0ff58a9150b369c915781fdc))
* show 'Provisional' subtitle with confirmed fallback level ([#297](https://github.com/taverns-red/toast-stats/issues/297)) ([36512e9](https://github.com/taverns-red/toast-stats/commit/36512e9d88d7f6930f2fb57a038423a2651e70a9))
* show CSP status on club detail modal ([#288](https://github.com/taverns-red/toast-stats/issues/288)) ([4478b01](https://github.com/taverns-red/toast-stats/commit/4478b01c6d35a50923faf304d9a3c33a11da82c3))
* show provisional Distinguished badge with asterisk + tooltip ([#287](https://github.com/taverns-red/toast-stats/issues/287)) ([6096a1e](https://github.com/taverns-red/toast-stats/commit/6096a1ec41b1659aa224b76ac9359f99ecc6d1ab))
* use client-side provisional detection in all badge views ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([06314f7](https://github.com/taverns-red/toast-stats/commit/06314f748916df2998ea05f43a71f7b36b344b71))


### Bug Fixes

* landing page rankings table now loads per-date data ([#301](https://github.com/taverns-red/toast-stats/issues/301)) ([f1d58dc](https://github.com/taverns-red/toast-stats/commit/f1d58dc9eb87dee2123892117ee518d4404424d4))
* landing page table uses overallRank from data instead of array index ([#303](https://github.com/taverns-red/toast-stats/issues/303)) ([3b01f62](https://github.com/taverns-red/toast-stats/commit/3b01f628e3089a30c95cbc6a48baa2ec78179102))
* mirror level-aware provisional thresholds in client-side fallback ([#296](https://github.com/taverns-red/toast-stats/issues/296)) ([8959305](https://github.com/taverns-red/toast-stats/commit/8959305bb099a07d92e4c7c0eda6b0b08e61468d))
* replace misleading 'Top X%' with ordinal percentile ([#305](https://github.com/taverns-red/toast-stats/issues/305)) ([4595547](https://github.com/taverns-red/toast-stats/commit/459554726768c004da06a21eabd361376c117f8b))


### Tests

* add aprilRenewals to integration test mocks ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([bf23a00](https://github.com/taverns-red/toast-stats/commit/bf23a0064d99d27aab6d22760f5c7e77d5b0e875))
* migrate provisional Distinguished tests to ClubDetailPage ([#299](https://github.com/taverns-red/toast-stats/issues/299)) ([4a39390](https://github.com/taverns-red/toast-stats/commit/4a393908e1cbf349dcd8e68b2606d4bdd77ea2ee))
* red phase — Multi-Year table should use per-date rankings ([#302](https://github.com/taverns-red/toast-stats/issues/302)) ([d44c6c7](https://github.com/taverns-red/toast-stats/commit/d44c6c7e3b4674af92012eb71a7057592fc62d40))
* red phase — per-date rankings override in GlobalRankingsTab ([#302](https://github.com/taverns-red/toast-stats/issues/302)) ([413ed83](https://github.com/taverns-red/toast-stats/commit/413ed83bf36bf84807dc5bc6fa89c29868b021ac))
* red phase — provisional Distinguished badge tests ([#291](https://github.com/taverns-red/toast-stats/issues/291)) ([0056f67](https://github.com/taverns-red/toast-stats/commit/0056f6731bae8a7b1f3ed9b1ec34f734e53cf764))
* red phase — replace 'Top X%' with ordinal percentile ([#305](https://github.com/taverns-red/toast-stats/issues/305)) ([8d4e077](https://github.com/taverns-red/toast-stats/commit/8d4e0774de0f8fcb17f0dcc08759d0329f5219f1))

## [2.7.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.6.0...frontend-v2.7.0) (2026-04-04)


### Features

* sync column filters to URL for deep links ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([9b76f70](https://github.com/taverns-red/toast-stats/commit/9b76f702f14515b33337e44d0afc311a80f8aa21))
* sync program year and date to URL for deep links ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([8222d46](https://github.com/taverns-red/toast-stats/commit/8222d46cbf356ca0e12393ac713210eb6b24b2b2))
* wire CDN cache monitoring into fetch layer ([#255](https://github.com/taverns-red/toast-stats/issues/255)) ([c7136bf](https://github.com/taverns-red/toast-stats/commit/c7136bf3ee26580b29e63bf2d5707369d3aa7fa5))


### Tests

* add comprehensive CSV export test coverage ([#282](https://github.com/taverns-red/toast-stats/issues/282)) ([f086c95](https://github.com/taverns-red/toast-stats/commit/f086c95f4eaeab2949de5cb42d029f585d7f28ce))
* update test spies from console.* to logger ([#283](https://github.com/taverns-red/toast-stats/issues/283)) ([9201c50](https://github.com/taverns-red/toast-stats/commit/9201c500365cc72627188f49cbc685dfb5a47e24))

## [2.6.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.5.0...frontend-v2.6.0) (2026-04-03)


### Features

* add ClubsNeedingMembersCard to Overview tab ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([951b186](https://github.com/taverns-red/toast-stats/commit/951b186cf87184dd5346e4b8e47dd57e3713090b))
* add computeMembersToDistinguished utility ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([942c551](https://github.com/taverns-red/toast-stats/commit/942c55132d7c7400a318ab6d615df05ddd62278a))
* add deriveGoalContext and findClubsNeedingMembers helpers ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([44644fe](https://github.com/taverns-red/toast-stats/commit/44644febb7fa2912b1bd9593014c8ea20dcff1fa))
* add remote error reporting to ErrorBoundary ([#254](https://github.com/taverns-red/toast-stats/issues/254)) ([39a2a0c](https://github.com/taverns-red/toast-stats/commit/39a2a0c98f405fa9d9b9188c604d74948219e442))
* add useUrlState hook for URL-synced state ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([6a852f7](https://github.com/taverns-red/toast-stats/commit/6a852f702258b4d96f32d67ee11449c30e08786a))
* **frontend:** prioritize exact goal flags for members to distinguished logic ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([3b5f686](https://github.com/taverns-red/toast-stats/commit/3b5f6867d0e56001854a4bf4de5a8a5559bbb146))
* sync additional tables with URL params ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([a68c640](https://github.com/taverns-red/toast-stats/commit/a68c64070a289340ace0aca69a6a225b8f636a13))
* sync ClubsTable pagination with URL params ([#272](https://github.com/taverns-red/toast-stats/issues/272)) ([a6da02e](https://github.com/taverns-red/toast-stats/commit/a6da02e0fff08fc3c061b5dd936f65fe99e26864))
* **ui:** add 'close to distinguished' card ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([d4e08aa](https://github.com/taverns-red/toast-stats/commit/d4e08aa166303ca7d5f8ead7275283fec81a68d9))
* **ui:** add members needed column and retain pagination state ([#272](https://github.com/taverns-red/toast-stats/issues/272), [#273](https://github.com/taverns-red/toast-stats/issues/273)) ([7269e4d](https://github.com/taverns-red/toast-stats/commit/7269e4dde54b53d021251fcd3dd3ea0e10fa17e6))


### Bug Fixes

* compute payment YoY from time-series data ([#269](https://github.com/taverns-red/toast-stats/issues/269)) ([3e3975b](https://github.com/taverns-red/toast-stats/commit/3e3975b4b2d98c72c935f4e9fb4cade5cea68eec))
* **ui:** add membersNeeded to applyFilter switch statement ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([5c37ef4](https://github.com/taverns-red/toast-stats/commit/5c37ef4b0c1b949c93630e102565d42cd44c83da))
* use correct CDN field name 'May Visit award' for second-round visits ([#268](https://github.com/taverns-red/toast-stats/issues/268)) ([c6b9113](https://github.com/taverns-red/toast-stats/commit/c6b911383d3b205aca41502482dc64ef4a7a73f8))


### Refactors

* split LazyCharts into individual files to fix fast refresh warning ([#251](https://github.com/taverns-red/toast-stats/issues/251)) ([9a8139d](https://github.com/taverns-red/toast-stats/commit/9a8139d7a4e3ef40f135cad9456cfba9ce145530))


### Tests

* add integration test suite for critical user journeys ([#261](https://github.com/taverns-red/toast-stats/issues/261)) ([f5909df](https://github.com/taverns-red/toast-stats/commit/f5909dff46c7fad65680ead0836df4985a1fee47))
* align ClubsTable integration tests with Members Needed column layout ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([f0c44b8](https://github.com/taverns-red/toast-stats/commit/f0c44b86ac7f255bead974bca53e231e29faab43))

## [2.5.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.4.0...frontend-v2.5.0) (2026-03-29)


### Features

* add responsive X-axis tick density for mobile charts ([#237](https://github.com/taverns-red/toast-stats/issues/237)) ([821dded](https://github.com/taverns-red/toast-stats/commit/821dded09edb74c6e5324a3b04c78fbc67b80f9c))
* add tie-aware ranking for Top Growth and DCP lists ([#236](https://github.com/taverns-red/toast-stats/issues/236)) ([d5655f0](https://github.com/taverns-red/toast-stats/commit/d5655f0aa0c07f05ba8134868fd674fd40348f14))
* unify chart loading skeletons with animated bars ([#235](https://github.com/taverns-red/toast-stats/issues/235)) ([30c99c0](https://github.com/taverns-red/toast-stats/commit/30c99c02b66aab2abd78ca4929eaa60af41ac9fe))


### Bug Fixes

* add missing fetchCdnSnapshotIndex mock to LandingPage tests ([#233](https://github.com/taverns-red/toast-stats/issues/233)) ([c03f194](https://github.com/taverns-red/toast-stats/commit/c03f194e40e7478b03f2e5fa5d61a226532a9fb1))
* date count inconsistency between landing and district pages ([#233](https://github.com/taverns-red/toast-stats/issues/233)) ([e8b968d](https://github.com/taverns-red/toast-stats/commit/e8b968dae5ec235d2d5200f4a0f0f59807c02d9f))


### Tests

* add unit coverage for Sprint 15 UX utilities ([a5de16e](https://github.com/taverns-red/toast-stats/commit/a5de16e8925382f7288aed1327f8e9ecf09ebd08))
* fix useResponsiveChartTicks logic and add a11y DOM tests ([#18](https://github.com/taverns-red/toast-stats/issues/18)) ([ba9a668](https://github.com/taverns-red/toast-stats/commit/ba9a6688ac1157496fb849a1add777178548534a))

## [2.4.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.3.0...frontend-v2.4.0) (2026-03-28)


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


### Tests

* update DCP section test for renamed component ([#231](https://github.com/taverns-red/toast-stats/issues/231)) ([3cd715b](https://github.com/taverns-red/toast-stats/commit/3cd715baf362fe99f9c2c06b5ac61139e3032b38))

## [2.3.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.2.0...frontend-v2.3.0) (2026-03-27)


### Features

* performance & observability — Lighthouse CI, code-split Recharts, CDN monitoring, error telemetry ([#222](https://github.com/taverns-red/toast-stats/issues/222), [#223](https://github.com/taverns-red/toast-stats/issues/223), [#224](https://github.com/taverns-red/toast-stats/issues/224), [#225](https://github.com/taverns-red/toast-stats/issues/225)) ([1edc44a](https://github.com/taverns-red/toast-stats/commit/1edc44a28cd6dde583dbcbe790c92d4793694464))

## [2.2.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.1.0...frontend-v2.2.0) (2026-03-27)


### Features

* **frontend:** growth velocity card and division heatmap ([#219](https://github.com/taverns-red/toast-stats/issues/219), [#220](https://github.com/taverns-red/toast-stats/issues/220)) ([d812125](https://github.com/taverns-red/toast-stats/commit/d8121259fa7eb218f5be8899d7a1efaaf75a302c))

## [2.1.0](https://github.com/taverns-red/toast-stats/compare/frontend-v2.0.0...frontend-v2.1.0) (2026-03-26)


### Features

* accessibility & mobile responsiveness ([#216](https://github.com/taverns-red/toast-stats/issues/216), [#217](https://github.com/taverns-red/toast-stats/issues/217), [#218](https://github.com/taverns-red/toast-stats/issues/218)) ([9a63787](https://github.com/taverns-red/toast-stats/commit/9a63787939405240f2048d8ecc9f8c4f88502e62))
* accessibility & mobile responsiveness ([#216](https://github.com/taverns-red/toast-stats/issues/216), [#217](https://github.com/taverns-red/toast-stats/issues/217), [#218](https://github.com/taverns-red/toast-stats/issues/218)) ([7931882](https://github.com/taverns-red/toast-stats/commit/793188218581381f7d5355d51dc3b6675d9e05a6))
* add data freshness indicators ([#213](https://github.com/taverns-red/toast-stats/issues/213), [#214](https://github.com/taverns-red/toast-stats/issues/214), [#215](https://github.com/taverns-red/toast-stats/issues/215)) ([881b4e2](https://github.com/taverns-red/toast-stats/commit/881b4e2e6d4016acf8237cde6b9cf11e85ae4b4e))

## [2.0.0](https://github.com/taverns-red/toast-stats/compare/frontend-v1.0.0...frontend-v2.0.0) (2026-03-26)

### ⚠ BREAKING CHANGES

- Backend analytics endpoints removed:
  - DELETE analytics.ts (8 endpoints, 1722 lines)
  - DELETE analyticsSummary.ts (1 endpoint, 594 lines)
  - DELETE PreComputedAnalyticsReader.ts (1163 lines)
  - DELETE 6 test files (2543 lines)

### Features

- add CDN-first data layer — cdn.ts client, 4 hooks updated with Express fallback ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([2af7012](https://github.com/taverns-red/toast-stats/commit/2af7012ab392168c4850398805106c121e2ab462))
- add club detail subpage with routing ([#208](https://github.com/taverns-red/toast-stats/issues/208)) ([4829b4b](https://github.com/taverns-red/toast-stats/commit/4829b4b8c74e63879f53ab51a3acec1547c9edb6))
- add dark mode based on taverns-red colour scheme ([#120](https://github.com/taverns-red/toast-stats/issues/120)) ([1aa1a2c](https://github.com/taverns-red/toast-stats/commit/1aa1a2c8b5b0a8e9f5bfc45f29475109bb3c7bbc))
- add DCP Projections table to Analytics tab ([#6](https://github.com/taverns-red/toast-stats/issues/6)) ([79d2cb3](https://github.com/taverns-red/toast-stats/commit/79d2cb3cf23129f7d89f6459405965fd30db35ea))
- add DCP projections utility module ([#6](https://github.com/taverns-red/toast-stats/issues/6)) ([f23daa1](https://github.com/taverns-red/toast-stats/commit/f23daa18ff16862d397184911282bede7944db32))
- add district comparison mode with radar chart and pin/unpin ([#93](https://github.com/taverns-red/toast-stats/issues/93)) ([7bd039d](https://github.com/taverns-red/toast-stats/commit/7bd039d0b89e84bcfafffe9ace64b51a8defdae3))
- add district search bar to Global Rankings table ([#91](https://github.com/taverns-red/toast-stats/issues/91)) ([217f007](https://github.com/taverns-red/toast-stats/commit/217f0072938ea47494bc1728ade1bd540beecaae))
- add fields parameter to useDistrictStatistics and pass divisions for lazy loading ([f9577a0](https://github.com/taverns-red/toast-stats/commit/f9577a0356b276cd52b812ff096688271874e3c3))
- add membershipBase to ClubTrend for accurate base membership display ([#164](https://github.com/taverns-red/toast-stats/issues/164)) ([c2e9b30](https://github.com/taverns-red/toast-stats/commit/c2e9b30e8a6e0cfb043fb4860e2a60756edaf711))
- add redtaverns favicon ([6c82504](https://github.com/taverns-red/toast-stats/commit/6c825048200f63691f00e1e9909925b6f9ad4854))
- add site footer with attribution, source link, and disclaimer ([#88](https://github.com/taverns-red/toast-stats/issues/88)) ([a6699ed](https://github.com/taverns-red/toast-stats/commit/a6699edaf08d00f9961dca8d6a198883dc02e41c))
- add tooltip info icons to table column headers ([#92](https://github.com/taverns-red/toast-stats/issues/92)) ([9a31280](https://github.com/taverns-red/toast-stats/commit/9a31280fd15922cc72850af1b0d36d8ff4722bb8))
- add tracked-district analytics badge to rankings table ([1e13b98](https://github.com/taverns-red/toast-stats/commit/1e13b98a42c5e0719bf92d6bb275dde3e01038b3))
- **admin:** implement force-cancel stuck jobs with modal dialog ([344fbf2](https://github.com/taverns-red/toast-stats/commit/344fbf2c971b985542765f73d62da14e45e2d977))
- **admin:** implement singleton backfill service and snapshot inspection ([cec0114](https://github.com/taverns-red/toast-stats/commit/cec0114151a95a1c9db2b2923e9929b3826c1b3e))
- **analytics-core:** implement per-metric rankings calculation and integration ([f857447](https://github.com/taverns-red/toast-stats/commit/f857447b81b59cf6067274f75a807b9a2023fffa))
- **analytics:** add memberCountChange field to distinguish member count from payment metrics ([94ce7f5](https://github.com/taverns-red/toast-stats/commit/94ce7f5d0cf4da2f041e5a1ac9df3d425df071c1))
- **analytics:** add paymentsTrend data to district analytics response ([14105a2](https://github.com/taverns-red/toast-stats/commit/14105a2ee10850d4b3f2d843c3dfbee3ead9b7a2))
- **analytics:** fix payments trend data source and year-over-year comparison ([219178e](https://github.com/taverns-red/toast-stats/commit/219178eaf584472ebdb35009efd709dd7a7adfc6))
- **analytics:** fix trends tab data display across three system layers ([33bc5ff](https://github.com/taverns-red/toast-stats/commit/33bc5ffd6facf994bc69e03c2511af2b273046a9))
- **analytics:** implement analytics availability checker and integrate with snapshot operations ([9a22d3c](https://github.com/taverns-red/toast-stats/commit/9a22d3c4acbdbbd7ac53c2db9a8c5a65e5109bf1))
- **analytics:** implement district analytics performance infrastructure ([897fb38](https://github.com/taverns-red/toast-stats/commit/897fb38fc0cf219fe7092dd818d0f97c038f3b0c))
- **analytics:** implement district analytics performance optimization ([5e76117](https://github.com/taverns-red/toast-stats/commit/5e76117b0154ae976d71c3d3e4287c547c4a83ba))
- automatic semantic versioning with footer display ([#136](https://github.com/taverns-red/toast-stats/issues/136)) ([0fe9f50](https://github.com/taverns-red/toast-stats/commit/0fe9f50f9c2b7f759d7a89265d03de32eaf2ca04))
- **backend,frontend:** remove backfill system and consolidate to scraper-cli ([5b1ac34](https://github.com/taverns-red/toast-stats/commit/5b1ac34ea83076481f5baadc45f905cd72cc32ff))
- **backfill:** implement unified backfill service with job management ([2abd669](https://github.com/taverns-red/toast-stats/commit/2abd6694cee2bb37d4d949de26d03985f2c887cc))
- code-split DistrictDetailPage with React.lazy + Suspense ([#169](https://github.com/taverns-red/toast-stats/issues/169)) ([8ff5fbd](https://github.com/taverns-red/toast-stats/commit/8ff5fbdd60d9e5449fbe71cbecf8c3d7d9739b46))
- color-code Health, Growth, and DCP sub-scores in Leadership table ([#90](https://github.com/taverns-red/toast-stats/issues/90)) ([9757f84](https://github.com/taverns-red/toast-stats/commit/9757f84af2648d4d992b42223303f8533fa949c8))
- Configure Vitest coverage thresholds, add a pre-push test hook, and refine SnapshotStore cache invalidation. ([25fe8c5](https://github.com/taverns-red/toast-stats/commit/25fe8c5e120f892514de53acd06029d4349cfa47))
- convert 7 remaining hooks to CDN-only ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([c13dd07](https://github.com/taverns-red/toast-stats/commit/c13dd079645bcaf9af76ed235897c2eaba62986e))
- convert last 2 Express hooks to CDN, delete api.ts ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([fb280ea](https://github.com/taverns-red/toast-stats/commit/fb280ea9a5ec01a32029ab68a2d8538e96e886e4))
- convert rankings to CDN + add v1/rankings.json pipeline step ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([14f8138](https://github.com/taverns-red/toast-stats/commit/14f813897a2db198889b0e6014f9a999829ee88c))
- delete backend analytics routes, CDN-only frontend ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([b23183c](https://github.com/taverns-red/toast-stats/commit/b23183c29850533476595f76a25b656ba9d06dc3))
- enhance club detail card with stats grid, base membership, and DCP milestone bars ([#163](https://github.com/taverns-red/toast-stats/issues/163)) ([89226af](https://github.com/taverns-red/toast-stats/commit/89226af84bfd42a714bc216164fbd004010fbccc))
- enhance club detail graph with program year context ([#79](https://github.com/taverns-red/toast-stats/issues/79)) ([7d209a1](https://github.com/taverns-red/toast-stats/commit/7d209a16e278f58ca297d3e950cf5d26a8b0e4a4))
- **frontend:** add date range validation to prevent invalid analytics queries ([3a40bc0](https://github.com/taverns-red/toast-stats/commit/3a40bc0ba1284423af376afc21be9819606b3873))
- **frontend:** add shared contracts dependency and improve type safety ([9aa3dc9](https://github.com/taverns-red/toast-stats/commit/9aa3dc901832fef34c550595a7e90ee8883a14da))
- **frontend:** auto-select valid program year when current selection unavailable ([f32647b](https://github.com/taverns-red/toast-stats/commit/f32647be4c816e07d7fb53640756f50814365d47))
- **frontend:** enable multi-year payments trend display by removing data override ([10d423c](https://github.com/taverns-red/toast-stats/commit/10d423ce868b0ba8af1b17c525b1a656e216e5c0))
- **frontend:** handle distinguishedProjection object format in analytics fallback ([662e1e1](https://github.com/taverns-red/toast-stats/commit/662e1e1aae5608e4e843601b4e1d2f0a713d879b))
- **frontend:** hide analytics tab pending DCP goal analysis data availability ([7be8e4c](https://github.com/taverns-red/toast-stats/commit/7be8e4c87bcb63422f2aff40268284a30ba3bc92))
- **frontend:** remove division rankings and area performance chart components ([880b635](https://github.com/taverns-red/toast-stats/commit/880b635929044112c9d366c217bc030f2d142c5e))
- **frontend:** rewire trends tab to use aggregated analytics for historical data ([35d4f4c](https://github.com/taverns-red/toast-stats/commit/35d4f4c3b68c8ff1642401632213401da4d249be))
- improve Global Rankings UX with progressive loading ([5a78b06](https://github.com/taverns-red/toast-stats/commit/5a78b06d563d911f5d78db08633d4352091c2ad6))
- invert ranking chart Y-axis — Overall shows rank instead of Borda count ([#89](https://github.com/taverns-red/toast-stats/issues/89)) ([4105185](https://github.com/taverns-red/toast-stats/commit/4105185a6aec171610d29be8c9da1c6b8a14fa7b))
- make region selectors collapsible on mobile ([799e936](https://github.com/taverns-red/toast-stats/commit/799e936e8bd544b0cc54451bd9fd0124d32113c0))
- progressive loading — per-section skeletons for divisions, trends, analytics tabs ([#169](https://github.com/taverns-red/toast-stats/issues/169)) ([c3e20f0](https://github.com/taverns-red/toast-stats/commit/c3e20f083357f5b2139c02c739069e05b4951f42))
- re-enable Analytics tab on district detail page ([#78](https://github.com/taverns-red/toast-stats/issues/78)) ([e21582c](https://github.com/taverns-red/toast-stats/commit/e21582c51374328bb17a9a284622b15cf2343147))
- reorder Global Rankings tab — table above the fold ([#83](https://github.com/taverns-red/toast-stats/issues/83)) ([062b85d](https://github.com/taverns-red/toast-stats/commit/062b85d2d917f163c2cb99d76b847c4fa8baf8df)), closes [#82](https://github.com/taverns-red/toast-stats/issues/82)
- reorganize landing page — rankings table above the fold ([#83](https://github.com/taverns-red/toast-stats/issues/83)) ([f830bba](https://github.com/taverns-red/toast-stats/commit/f830bbaf41ba0feb8a5e109b52f0851c67b21cb7))
- serve time-series via CDN + useTimeSeries hook ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([73b2c07](https://github.com/taverns-red/toast-stats/commit/73b2c07232c67dfbd9afaf16d54b656faa18404d))
- **shared-contracts:** establish canonical ClubHealthStatus type and resolve value mismatch ([916be21](https://github.com/taverns-red/toast-stats/commit/916be217390afdad12825f427aab2d1f42b201a2))
- show Global Rankings tab for untracked districts instead of empty state ([d3b45aa](https://github.com/taverns-red/toast-stats/commit/d3b45aa7ab92279d4aff2965440ec2985d2ae868))
- switch API from Gateway to HTTPS LB at api.taverns.red ([#14](https://github.com/taverns-red/toast-stats/issues/14)) ([007fb81](https://github.com/taverns-red/toast-stats/commit/007fb81af27be8b9cbf4168e580e48d12d4c1f68))
- wire ClubDetailModal to use dense club trends from club-trends-index ([#79](https://github.com/taverns-red/toast-stats/issues/79)) ([9dee66b](https://github.com/taverns-red/toast-stats/commit/9dee66bb618ddf05a81a60ec5e1cc8111de062e0))
- wire useTimeSeries into DistrictDetailPage ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([c08da58](https://github.com/taverns-red/toast-stats/commit/c08da584bf8cc1bbe86ea5725376867e00aa7593))
- wire YoY comparison from CDN time-series data ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([f9d6ba7](https://github.com/taverns-red/toast-stats/commit/f9d6ba70824e3068b142adc613acf15f9f626d16))

### Bug Fixes

- add /api prefix to production API base URL ([75e3ad5](https://github.com/taverns-red/toast-stats/commit/75e3ad5d21357fd79f0d7037239137fa47d3c66d))
- add dark mode overrides for colored utility classes, form controls, and blockquotes ([#121](https://github.com/taverns-red/toast-stats/issues/121), [#122](https://github.com/taverns-red/toast-stats/issues/122)) ([e3c80c2](https://github.com/taverns-red/toast-stats/commit/e3c80c20d0246fb0991acb15a43da343b6b4f74a))
- add spacing between Program Year Progress label and percentage ([bd9bf54](https://github.com/taverns-red/toast-stats/commit/bd9bf5413c22b6cb24cf9cae1a926ad7086700d7))
- **admin:** handle missing snapshot IDs with fallback display ([66a2bd6](https://github.com/taverns-red/toast-stats/commit/66a2bd63d7d23518de4f28cbe36564a211af1519))
- club detail modal y-axis inversion when all values are equal ([#107](https://github.com/taverns-red/toast-stats/issues/107)) ([506aa9d](https://github.com/taverns-red/toast-stats/commit/506aa9d8fab3ef57fa91bc107c1d213f3d1b5335))
- club net change uses base vs current membership ([#194](https://github.com/taverns-red/toast-stats/issues/194)) ([21e07bc](https://github.com/taverns-red/toast-stats/commit/21e07bcc140d2db4689496546f77a7dcd3734160))
- convert manualChunks to function for Rolldown compatibility ([#175](https://github.com/taverns-red/toast-stats/issues/175)) ([fb533a3](https://github.com/taverns-red/toast-stats/commit/fb533a3d89cbd9ca98422460f60a279a0db038c6))
- correct membership badge value and scope DCP timeline ([#76](https://github.com/taverns-red/toast-stats/issues/76), [#79](https://github.com/taverns-red/toast-stats/issues/79)) ([8f2a7c7](https://github.com/taverns-red/toast-stats/commit/8f2a7c76cfd2b69eee66d44c901572e843207304))
- dark mode overrides for brand color tokens and gradient cards ([#121](https://github.com/taverns-red/toast-stats/issues/121), [#122](https://github.com/taverns-red/toast-stats/issues/122)) ([73174fd](https://github.com/taverns-red/toast-stats/commit/73174fd57e4fb139006c338f8dd7aa2b65c66715))
- dark mode overrides for brand opacity classes, amber, and insights ([#121](https://github.com/taverns-red/toast-stats/issues/121), [#122](https://github.com/taverns-red/toast-stats/issues/122)) ([1752348](https://github.com/taverns-red/toast-stats/commit/1752348083e6de72c52ce02f7c5e0f1830678056))
- date selector typo and region spacing ([#195](https://github.com/taverns-red/toast-stats/issues/195), [#196](https://github.com/taverns-red/toast-stats/issues/196)) ([8fb93a8](https://github.com/taverns-red/toast-stats/commit/8fb93a85e1624cefef43fb91a1eb227675b515cb))
- derive member count change from trend data instead of broken field ([#76](https://github.com/taverns-red/toast-stats/issues/76)) ([cfbaebd](https://github.com/taverns-red/toast-stats/commit/cfbaebde208971700dac402eb2a572afd76fc43b))
- district detail page — rankings, date selector, cleanup ([#183](https://github.com/taverns-red/toast-stats/issues/183)) ([271224b](https://github.com/taverns-red/toast-stats/commit/271224b114feff3dc3983f9b19a022f918a32d68))
- Division & Area tab empty — unwrap CDN snapshot data key ([#184](https://github.com/taverns-red/toast-stats/issues/184)) ([5b99953](https://github.com/taverns-red/toast-stats/commit/5b9995375a82c819c5b07e2ddb7ebcc26ce57ca1))
- filter club modal trend data by selected program year ([#119](https://github.com/taverns-red/toast-stats/issues/119)) ([42b6c7e](https://github.com/taverns-red/toast-stats/commit/42b6c7e3b068f83e1b374a14fc0ee3b6feab3a46))
- footer alignment — equal-width columns and right-align disclaimer ([#101](https://github.com/taverns-red/toast-stats/issues/101)) ([00aca13](https://github.com/taverns-red/toast-stats/commit/00aca130033b48e594df923c497e0339e5ecb73c))
- footer vertical alignment — inline-flex on links and consistent line-height ([#101](https://github.com/taverns-red/toast-stats/issues/101)) ([b2cdaf3](https://github.com/taverns-red/toast-stats/commit/b2cdaf3a10849a87b6aa7a2d2b5ad3bf9753e4a4))
- **frontend:** add defensive null checks for leadership insights data ([247e074](https://github.com/taverns-red/toast-stats/commit/247e0747c24dcfe15e7f9ff7288967de2d3c4a35))
- **frontend:** add fallback colors to chart components ([a23c024](https://github.com/taverns-red/toast-stats/commit/a23c024b87ad1f6e3c01ea9b2020707d7ad1d0bb))
- make spinner visible by combining all query loading states ([03dee2f](https://github.com/taverns-red/toast-stats/commit/03dee2fb9955550ace56518377f0f1255b264f03))
- make theme toggle icon visible on dark footer background ([#120](https://github.com/taverns-red/toast-stats/issues/120)) ([7e07e3c](https://github.com/taverns-red/toast-stats/commit/7e07e3ccf338fafa71a6b8dc25264892875a259f))
- member change badge uses payment base and pipeline uses --force-analytics ([#170](https://github.com/taverns-red/toast-stats/issues/170)) ([2af26d5](https://github.com/taverns-red/toast-stats/commit/2af26d5fe326b242e6d2dd74621b985ee9a4b603))
- mobile UX improvements for tab bar, table columns, and export button ([#85](https://github.com/taverns-red/toast-stats/issues/85), [#86](https://github.com/taverns-red/toast-stats/issues/86), [#87](https://github.com/taverns-red/toast-stats/issues/87)) ([0157450](https://github.com/taverns-red/toast-stats/commit/0157450cefb1c16a719d6d54e1b15b827c03ca2e))
- neutralize Borda count for tied categories and fix copy/date selector ([#197](https://github.com/taverns-red/toast-stats/issues/197), [#198](https://github.com/taverns-red/toast-stats/issues/198), [#180](https://github.com/taverns-red/toast-stats/issues/180)) ([b26e514](https://github.com/taverns-red/toast-stats/commit/b26e514515080ec0b9ffc8b0917247b13a57240f))
- paymentBase field name mismatch and empty topGrowthClubs ([#190](https://github.com/taverns-red/toast-stats/issues/190), [#185](https://github.com/taverns-red/toast-stats/issues/185)) ([652e865](https://github.com/taverns-red/toast-stats/commit/652e865b71bd57f82bbbc77fe02aa89319be0cb5))
- payments trend chart shows 0 — wire performanceTargets from CDN ([#183](https://github.com/taverns-red/toast-stats/issues/183)) ([a08f086](https://github.com/taverns-red/toast-stats/commit/a08f0864899cf3cb3eca1fbbf9c143e854bba0d7))
- prefix numeric district names with 'District' ([#188](https://github.com/taverns-red/toast-stats/issues/188)) ([a1deb0d](https://github.com/taverns-red/toast-stats/commit/a1deb0da0412e8afedaf7ff5adf1d7e6be2fdeba))
- remove [@theme](https://github.com/theme) spacing overrides that broke Tailwind v4 max-w-\* utilities ([c847858](https://github.com/taverns-red/toast-stats/commit/c8478583525f24715830c93388f18c1b06a9ca02))
- remove /api prefix from API URLs — Cloud Run routes at root ([#14](https://github.com/taverns-red/toast-stats/issues/14)) ([48bb7fc](https://github.com/taverns-red/toast-stats/commit/48bb7fcdf7262e680a6d314e4a5cdb18c0227847))
- remove redundant district name and date range from Overview ([#81](https://github.com/taverns-red/toast-stats/issues/81)) ([4ea755f](https://github.com/taverns-red/toast-stats/commit/4ea755f341ece30f2106800dabb2c277d6890917))
- remove stale Source Sans 3 [@font-face](https://github.com/font-face) URLs causing 404s ([29f2920](https://github.com/taverns-red/toast-stats/commit/29f29202b01c9905c9ed5bd6c54064f71dc375da))
- remove stale woff2 font preload URLs ([b818ee8](https://github.com/taverns-red/toast-stats/commit/b818ee8b220cc734e87c724d48ba13debcc4aa46))
- resolve eslint v10 lint errors in collector-cli ([#105](https://github.com/taverns-red/toast-stats/issues/105)) ([d170bef](https://github.com/taverns-red/toast-stats/commit/d170bef0b817d3433787b16b1ac353f6be0922f1))
- resolve word-per-line text wrapping in untracked district empty state ([8be8a56](https://github.com/taverns-red/toast-stats/commit/8be8a56172ac6d60578434ace2169ab781577b2e))
- restore API Gateway architecture with correct gateway name ([844d0c8](https://github.com/taverns-red/toast-stats/commit/844d0c803452cdb913723c2e1a7458419627417f))
- retain original rank when search filtering the rankings table ([#102](https://github.com/taverns-red/toast-stats/issues/102)) ([afceb93](https://github.com/taverns-red/toast-stats/commit/afceb933b3461aaea9932b2148f83c4879f21cb3))
- revert DCP progress panel to list-based timeline ([#166](https://github.com/taverns-red/toast-stats/issues/166)) ([eff6256](https://github.com/taverns-red/toast-stats/commit/eff62560a2f56cc15edd1fe7b4db3fca139e54e4))
- route API through Firebase Hosting rewrite instead of API Gateway ([86909d7](https://github.com/taverns-red/toast-stats/commit/86909d70d0eee88828403fa7b094ec4b1a090ce3))
- show correct overall rank in comparison panel ([#109](https://github.com/taverns-red/toast-stats/issues/109), [#110](https://github.com/taverns-red/toast-stats/issues/110)) ([d7178ff](https://github.com/taverns-red/toast-stats/commit/d7178ff6189bd61bc1a92451bf4987899a88cac1))
- show empty state immediately for districts without ranking data ([22f3ae8](https://github.com/taverns-red/toast-stats/commit/22f3ae80f0e706dd4d99bfa541e847a0be354404))
- show graceful error state for untracked districts ([d04d6df](https://github.com/taverns-red/toast-stats/commit/d04d6dfe08bb09690810c428f550a94f58fe9105))
- snapshot-index always writes nested format, frontend normalizes on read ([#182](https://github.com/taverns-red/toast-stats/issues/182)) ([b2a7b93](https://github.com/taverns-red/toast-stats/commit/b2a7b93642beff045a726c2a0bdd332083760556))
- update integration and accessibility tests for removed ProgramYearSelector ([89d44df](https://github.com/taverns-red/toast-stats/commit/89d44df7b06cec76d6dbfd0f5653206c588480b6))
- update test mocks for CDN-only analytics ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([a53463d](https://github.com/taverns-red/toast-stats/commit/a53463d53a93f902752c2335228e31c53e299a95))
- use correct API (toast-stats) and gateway (toast-stats-gw) ([8f18cd8](https://github.com/taverns-red/toast-stats/commit/8f18cd848537de4ea7fb1b783ee87ed0ca1d9219))
- use standard Tailwind classes for analytics badge visibility ([7910599](https://github.com/taverns-red/toast-stats/commit/79105991a90a59a369d0dc8d744e5037f167398a))
- **validation:** remove inappropriate data freshness checks for historical snapshots ([de2317e](https://github.com/taverns-red/toast-stats/commit/de2317e300aab18d40556259b476bee0ff29af59))
- wrap ClubDetailModal tests with QueryClientProvider ([#79](https://github.com/taverns-red/toast-stats/issues/79)) ([74fd60b](https://github.com/taverns-red/toast-stats/commit/74fd60b5907fa9f4c765c2302c4b60ef0f27342b))

### Refactors

- **admin:** remove authentication and improve dialog responsiveness ([2766fb5](https://github.com/taverns-red/toast-stats/commit/2766fb5175c4202e534e88521f88287f95a7d66b))
- convert dates queries to CDN fetchCdnDates ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([7a1c433](https://github.com/taverns-red/toast-stats/commit/7a1c43302bd7918b8f75ee41292bf1c51adcfe6f))
- convert useAggregatedAnalytics and useVulnerableClubs to CDN-only ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([b54e40d](https://github.com/taverns-red/toast-stats/commit/b54e40dd28bbb7fa4e293888ee684ad51bfff6e1))
- extract types and helpers from oversized frontend hooks ([329b5e6](https://github.com/taverns-red/toast-stats/commit/329b5e667ac39d84a78555883d4596af36ed7395))
- **frontend:** remove fallback data warning from district detail page ([c64e78d](https://github.com/taverns-red/toast-stats/commit/c64e78d5ae57dc4b0e1310419aa4122ced07231a))
- merge duplicate club detail modals into shared component ([#80](https://github.com/taverns-red/toast-stats/issues/80)) ([cbdf25e](https://github.com/taverns-red/toast-stats/commit/cbdf25e5e7ea3ab8638b069af5f66fc5b76edfff))
- migrate frontend types to shared-contracts — DistrictRanking, ProgramYearWithData, AvailableRankingYearsResponse ([#130](https://github.com/taverns-red/toast-stats/issues/130)) ([8572f0f](https://github.com/taverns-red/toast-stats/commit/8572f0f1ca76ff3a5ef172c509f3075e83a695bd))
- migrate property-based tests to standard unit tests across … ([f6b46fb](https://github.com/taverns-red/toast-stats/commit/f6b46fb318e10744921cb6c2a8862c84d66d61d9))
- migrate property-based tests to standard unit tests across various modules. ([48642ef](https://github.com/taverns-red/toast-stats/commit/48642ef44658a93e3b1723ac4e2e7d6f7324e6b3))
- remove DCPProjectionsTable from Analytics tab ([#187](https://github.com/taverns-red/toast-stats/issues/187)) ([61ed46a](https://github.com/taverns-red/toast-stats/commit/61ed46a3c89b35d1c5d9e419c80f2931eec5c180))
- remove dead-weight admin system ([4dca7bb](https://github.com/taverns-red/toast-stats/commit/4dca7bbf02d05ac6840993da161738ea066c294d))
- Remove meta-level property tests for test utilities and upd… ([51fe303](https://github.com/taverns-red/toast-stats/commit/51fe303e15a6a8fc6e129de42c0304693a651ed6))
- Remove meta-level property tests for test utilities and update various existing property tests. ([36a44c1](https://github.com/taverns-red/toast-stats/commit/36a44c13ebc57e7f9629f396393c533cf1534358))
- remove stale Express API references ([#173](https://github.com/taverns-red/toast-stats/issues/173)) ([071fa67](https://github.com/taverns-red/toast-stats/commit/071fa676d2d7898834bde63677a18d1df222b166))
- rename scraper-cli to collector-cli across the codebase ([#99](https://github.com/taverns-red/toast-stats/issues/99)) ([eac9a3b](https://github.com/taverns-red/toast-stats/commit/eac9a3ba3d1b857e0c53efeef953584b73edae66))
- Restructure analytics types into domain-specific files and extract frontend hook logic into reusable utilities. ([2ae8d96](https://github.com/taverns-red/toast-stats/commit/2ae8d961708e4bb81d93bbf41e70c432f2ea9448))
- split designTokens.ts into domain-specific modules ([#134](https://github.com/taverns-red/toast-stats/issues/134)) ([d56746e](https://github.com/taverns-red/toast-stats/commit/d56746e47c022d1216fe8712e616fd64aed56c09))

### Performance

- optimize global rankings tab load time ([#115](https://github.com/taverns-red/toast-stats/issues/115)) ([5f2edf9](https://github.com/taverns-red/toast-stats/commit/5f2edf987a8b159e924210fe2600604b12996976))
- replace listSnapshots with listSnapshotIds + add batch rank-history endpoint ([2411b1d](https://github.com/taverns-red/toast-stats/commit/2411b1d8feb32746fec47d6aaf2f9d3359d43fbf))

### Documentation

- **api:** establish API documentation steering standards and update specs ([bd3e08b](https://github.com/taverns-red/toast-stats/commit/bd3e08bbd789e6aec2cc5fcb0e7852ec03994dfc))
- **specs:** add projected year-end simplification specification ([35840a7](https://github.com/taverns-red/toast-stats/commit/35840a7b94ded9644b66dfdaa216436fc5329013))

### Tests

- add CDN module mock to useAggregatedAnalytics tests ([#168](https://github.com/taverns-red/toast-stats/issues/168)) ([3978abc](https://github.com/taverns-red/toast-stats/commit/3978abc9696a0f12ac63475e0cc8748618a24fd2))
- add failing tests for ComparisonPanel and LandingPage comparison mode ([#93](https://github.com/taverns-red/toast-stats/issues/93)) ([da57250](https://github.com/taverns-red/toast-stats/commit/da572508ead791aed070180f96ec6f3b2cad44dd))
- fix useGlobalRankings tests for batch rank-history endpoint ([5435db7](https://github.com/taverns-red/toast-stats/commit/5435db7c8bd1d7c4efa873caaf0ecbd02220d0df))
- mock useDistricts in LandingPage tests to fix mock sequence ([f8a02fc](https://github.com/taverns-red/toast-stats/commit/f8a02fcdbb5312d15054f334f677268b122b268f))

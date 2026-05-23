# Changelog

## [1.6.0](https://github.com/taverns-red/toast-stats/compare/analytics-core-v1.5.1...analytics-core-v1.6.0) (2026-05-23)


### Features

* **district-clubs:** [#489](https://github.com/taverns-red/toast-stats/issues/489) surface FAC-only clubs (ATOs / prospective) ([#594](https://github.com/taverns-red/toast-stats/issues/594)) ([d076fba](https://github.com/taverns-red/toast-stats/commit/d076fba705466ce3dd4765eecd32c8e2cd209a51))
* **district-status:** concrete units + reorder + drop net in gap tiles ([#555](https://github.com/taverns-red/toast-stats/issues/555), [#556](https://github.com/taverns-red/toast-stats/issues/556)) ([#560](https://github.com/taverns-red/toast-stats/issues/560)) ([921d427](https://github.com/taverns-red/toast-stats/commit/921d4274d457b3451888ae69c2421e9e67f12de1))


### Bug Fixes

* **analytics:** % Distinguished uses Paid Club Base per TI DDP rule ([#537](https://github.com/taverns-red/toast-stats/issues/537)) ([#538](https://github.com/taverns-red/toast-stats/issues/538)) ([b7fa477](https://github.com/taverns-red/toast-stats/commit/b7fa47773b8155965199350d787d56b21bd32e45))
* **fac:** propagate FAC enrichment through ClubTrend so CHARTERED actually renders ([#503](https://github.com/taverns-red/toast-stats/issues/503)) ([#504](https://github.com/taverns-red/toast-stats/issues/504)) ([3c4a96c](https://github.com/taverns-red/toast-stats/commit/3c4a96c56795cdd97b5b293d559225669bd478cc))


### Refactors

* dedupe calculateDistinguishedPercent — shared helper in analytics-core ([#547](https://github.com/taverns-red/toast-stats/issues/547)) ([#585](https://github.com/taverns-red/toast-stats/issues/585)) ([2bf0415](https://github.com/taverns-red/toast-stats/commit/2bf0415ddd0fb08efcca21186e0236a9f28e54b6))

## [1.5.1](https://github.com/taverns-red/toast-stats/compare/analytics-core-v1.5.0...analytics-core-v1.5.1) (2026-05-10)


### Bug Fixes

* actually count new charters from district-performance.csv ([#336](https://github.com/taverns-red/toast-stats/issues/336)) ([#343](https://github.com/taverns-red/toast-stats/issues/343)) ([c6fc153](https://github.com/taverns-red/toast-stats/commit/c6fc153c08e6d5804b17d9c49e5090f3fd3ae4dd))

## [1.5.0](https://github.com/taverns-red/toast-stats/compare/analytics-core-v1.4.1...analytics-core-v1.5.0) (2026-04-22)


### Features

* Distinguished District tier tracking + trophy case ([#332](https://github.com/taverns-red/toast-stats/issues/332)) ([1e12e5c](https://github.com/taverns-red/toast-stats/commit/1e12e5cd696c9303dae58c5a17e61b89394e9b59))
* division eligibility derived from area visit status ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([a7d2688](https://github.com/taverns-red/toast-stats/commit/a7d26888b2a5a383ec8921d58f2c61a940e53b93))
* gate area Distinguished status on club visit completion ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([f191c97](https://github.com/taverns-red/toast-stats/commit/f191c9786868da5e2feb8f9c12561010d5f8b406))
* implement ClubStrength, LeadershipExcellence, OfficerAwards calculators ([#333](https://github.com/taverns-red/toast-stats/issues/333)) ([10da8b9](https://github.com/taverns-red/toast-stats/commit/10da8b9b8cc8d7284fb7bc5343a7308c51176b6d))
* implement CompetitiveAwardsCalculator + pipeline integration ([#330](https://github.com/taverns-red/toast-stats/issues/330)) ([b81a1eb](https://github.com/taverns-red/toast-stats/commit/b81a1ebb7f4efaa49f8f7e2ae526640af45349c6))
* parse payment breakdown columns from All Districts CSV ([#327](https://github.com/taverns-red/toast-stats/issues/327)) ([df695cf](https://github.com/taverns-red/toast-stats/commit/df695cfdf489026629dd5292ccfe8bb7c8f7f5c3))
* parse prerequisite + Smedley columns from All Districts CSV ([#329](https://github.com/taverns-red/toast-stats/issues/329)) ([13589d2](https://github.com/taverns-red/toast-stats/commit/13589d226ae5668da9ace1b3a55cf058f7680faa))


### Bug Fixes

* division eligibility is NOT gated on area visits ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([1b0fe8a](https://github.com/taverns-red/toast-stats/commit/1b0fe8a3d8e97b6a9790ab2dc7a67349a2177b2c))
* exclude new charters from District Club Retention Award ([#336](https://github.com/taverns-red/toast-stats/issues/336)) ([#337](https://github.com/taverns-red/toast-stats/issues/337)) ([239a31a](https://github.com/taverns-red/toast-stats/commit/239a31acbb424483ea546c76c85f129d6e6b5707))


### Tests

* add failing tests for CompetitiveAwardsCalculator ([#330](https://github.com/taverns-red/toast-stats/issues/330)) ([33e5ae7](https://github.com/taverns-red/toast-stats/commit/33e5ae743458169a6177429698af20748afd1ab2))
* add failing tests for DistinguishedDistrictCalculator ([#332](https://github.com/taverns-red/toast-stats/issues/332)) ([a04f296](https://github.com/taverns-red/toast-stats/commit/a04f296564dfbfe398fedfb530b761f80f2c1e9d))
* add failing tests for threshold + officer award calculators ([#333](https://github.com/taverns-red/toast-stats/issues/333)) ([5630a95](https://github.com/taverns-red/toast-stats/commit/5630a951f5b2163c1175a117febc9c34d1928158))
* red phase — visit-gated area eligibility for DAP ([#325](https://github.com/taverns-red/toast-stats/issues/325)) ([36ac76c](https://github.com/taverns-red/toast-stats/commit/36ac76c4282063031d4b6a909cbd2ecfed7d54aa))

## [1.4.1](https://github.com/taverns-red/toast-stats/compare/analytics-core-v1.4.0...analytics-core-v1.4.1) (2026-04-07)


### Bug Fixes

* AreaDivisionRecognition requires CSP for distinguished count ([#311](https://github.com/taverns-red/toast-stats/issues/311)) ([f14f95c](https://github.com/taverns-red/toast-stats/commit/f14f95c55ab23e956747e9d564fa7f9a3bceabd9))


### Tests

* red phase — AreaDivisionRecognition should require CSP for distinguished ([#311](https://github.com/taverns-red/toast-stats/issues/311)) ([af02a40](https://github.com/taverns-red/toast-stats/commit/af02a40c684d2bfde7664d9387c423d530016339))

## [1.4.0](https://github.com/taverns-red/toast-stats/compare/analytics-core-v1.3.0...analytics-core-v1.4.0) (2026-04-06)


### Features

* add isDistinguishedProvisional to ClubEligibilityUtils ([#287](https://github.com/taverns-red/toast-stats/issues/287)) ([851571a](https://github.com/taverns-red/toast-stats/commit/851571a7857baed14824a571a49b7393ec038ec3))
* compute confirmed Distinguished count from club data pre-April ([#304](https://github.com/taverns-red/toast-stats/issues/304)) ([861382b](https://github.com/taverns-red/toast-stats/commit/861382b6532245b42c3ef439a861977261cc1fa0))
* level-aware provisional thresholds + getConfirmedDistinguishedLevel ([#296](https://github.com/taverns-red/toast-stats/issues/296)) ([94c668f](https://github.com/taverns-red/toast-stats/commit/94c668f90dc57d56d8f09911cdce78049db7e937))
* show CSP status on club detail modal ([#288](https://github.com/taverns-red/toast-stats/issues/288)) ([4478b01](https://github.com/taverns-red/toast-stats/commit/4478b01c6d35a50923faf304d9a3c33a11da82c3))
* standard competition ranking for overallRank ties ([#303](https://github.com/taverns-red/toast-stats/issues/303)) ([49f3457](https://github.com/taverns-red/toast-stats/commit/49f3457185450e2c5823f17075c4926b5b57e139))
* transform derives closing period from CSV footer when metadata missing ([#292](https://github.com/taverns-red/toast-stats/issues/292), [#293](https://github.com/taverns-red/toast-stats/issues/293)) ([04e8161](https://github.com/taverns-red/toast-stats/commit/04e8161af4daaff03d40224791a4c4b590c5b08c))
* wire isProvisionallyDistinguished into analytics pipeline ([#287](https://github.com/taverns-red/toast-stats/issues/287)) ([30dde5b](https://github.com/taverns-red/toast-stats/commit/30dde5b6d6698061d0843ee24eb1c3c8e6806c13))


### Bug Fixes

* normalize cspSubmitted via getCSPStatus to prevent undefined ([#290](https://github.com/taverns-red/toast-stats/issues/290)) ([1d2ea00](https://github.com/taverns-red/toast-stats/commit/1d2ea0080b9ac60861c97afe860a5b48dd416298))


### Tests

* red phase — compute confirmed Distinguished from club data pre-April ([#304](https://github.com/taverns-red/toast-stats/issues/304)) ([1e13097](https://github.com/taverns-red/toast-stats/commit/1e1309770384e6eec472bb4b4b6d9cbb06726820))
* red phase — level-specific provisional thresholds and confirmed level ([#296](https://github.com/taverns-red/toast-stats/issues/296)) ([bf273cc](https://github.com/taverns-red/toast-stats/commit/bf273cc46e2186321c692a0d3e3d06a58d5ed0c8))
* red phase — overallRank should handle ties with standard competition ranking ([#303](https://github.com/taverns-red/toast-stats/issues/303)) ([9e03dfe](https://github.com/taverns-red/toast-stats/commit/9e03dfed90e80d421b739aebee11173938890e65))

## [1.3.0](https://github.com/taverns-red/toast-stats/compare/analytics-core-v1.2.1...analytics-core-v1.3.0) (2026-04-03)


### Features

* **core:** incorporate granular DCP goals into data pipeline ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([dde0439](https://github.com/taverns-red/toast-stats/commit/dde04394bb22bf0c0d660e31110ce59ea711215c))


### Refactors

* split LazyCharts into individual files to fix fast refresh warning ([#251](https://github.com/taverns-red/toast-stats/issues/251)) ([9a8139d](https://github.com/taverns-red/toast-stats/commit/9a8139d7a4e3ef40f135cad9456cfba9ce145530))

## [1.2.1](https://github.com/taverns-red/toast-stats/compare/analytics-core-v1.2.0...analytics-core-v1.2.1) (2026-03-29)


### Bug Fixes

* add ignoreDeprecations for TS7 moduleResolution=node10 deprecation ([aab7f32](https://github.com/taverns-red/toast-stats/commit/aab7f322febb51ba4f33396aad2ea7ef1b58e4ee))

## [1.2.0](https://github.com/taverns-red/toast-stats/compare/analytics-core-v1.1.0...analytics-core-v1.2.0) (2026-03-27)


### Features

* **analytics-core:** growth velocity, division heatmap, seasonal risk scoring ([#219](https://github.com/taverns-red/toast-stats/issues/219), [#220](https://github.com/taverns-red/toast-stats/issues/220), [#221](https://github.com/taverns-red/toast-stats/issues/221)) ([7eda0ee](https://github.com/taverns-red/toast-stats/commit/7eda0eef0aa563f609608fee53725edc86c3d6fe))
* **frontend:** growth velocity card and division heatmap ([#219](https://github.com/taverns-red/toast-stats/issues/219), [#220](https://github.com/taverns-red/toast-stats/issues/220)) ([d812125](https://github.com/taverns-red/toast-stats/commit/d8121259fa7eb218f5be8899d7a1efaaf75a302c))

## [1.1.0](https://github.com/taverns-red/toast-stats/compare/analytics-core-v1.0.0...analytics-core-v1.1.0) (2026-03-26)

### Features

- add membershipBase to ClubTrend for accurate base membership display ([#164](https://github.com/taverns-red/toast-stats/issues/164)) ([c2e9b30](https://github.com/taverns-red/toast-stats/commit/c2e9b30e8a6e0cfb043fb4860e2a60756edaf711))
- add topGrowthClubs and dcpGoalAnalysis to pre-computed analytics ([#84](https://github.com/taverns-red/toast-stats/issues/84)) ([acc2886](https://github.com/taverns-red/toast-stats/commit/acc2886f28b03dc15eb8a1dc0bc12f3711dc7163))
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
- **analytics:** fix payments trend data source and year-over-year comparison ([219178e](https://github.com/taverns-red/toast-stats/commit/219178eaf584472ebdb35009efd709dd7a7adfc6))
- **analytics:** implement distinguished clubs type fix with property-based testing ([24ad6a8](https://github.com/taverns-red/toast-stats/commit/24ad6a8b76221af336c38508f64d472b8c8756ca))
- **analytics:** move backend analytics modules to analytics-core ([7e75263](https://github.com/taverns-red/toast-stats/commit/7e75263c6b4bc3ec7804a844b4558fa16618930f))
- **backend:** complete backend computation removal and analytics-core integration ([b462b4c](https://github.com/taverns-red/toast-stats/commit/b462b4ce278ff27b788a0cb15451fc1a739a755b))
- **backend:** complete refresh-service computation removal and analytics migration ([17dbf27](https://github.com/taverns-red/toast-stats/commit/17dbf273e48bf5c52c61821d158ce9159af4a02b))
- establish TDD and test coverage policies by updating pre-commit/pre-push hooks, CI, Vitest configurations, and adding engineering principles documentation. ([a8e6766](https://github.com/taverns-red/toast-stats/commit/a8e676603f71ab75711e8343a9c21503e6c91e69))
- incremental ClubTrendsStore replaces all-snapshot loading for dense club trends ([#144](https://github.com/taverns-red/toast-stats/issues/144)) ([6933ffa](https://github.com/taverns-red/toast-stats/commit/6933ffae26aae8940e8a616ab4dc80894da6f07a))
- **shared-contracts:** establish canonical ClubHealthStatus type and resolve value mismatch ([916be21](https://github.com/taverns-red/toast-stats/commit/916be217390afdad12825f427aab2d1f42b201a2))

### Bug Fixes

- lower best practice divisions threshold from 75 to 60 ([#117](https://github.com/taverns-red/toast-stats/issues/117)) ([355402c](https://github.com/taverns-red/toast-stats/commit/355402cc7d17206ccb6bd475a02ffe2233df72f4))
- neutralize Borda count for tied categories and fix copy/date selector ([#197](https://github.com/taverns-red/toast-stats/issues/197), [#198](https://github.com/taverns-red/toast-stats/issues/198), [#180](https://github.com/taverns-red/toast-stats/issues/180)) ([b26e514](https://github.com/taverns-red/toast-stats/commit/b26e514515080ec0b9ffc8b0917247b13a57240f))
- paymentBase field name mismatch and empty topGrowthClubs ([#190](https://github.com/taverns-red/toast-stats/issues/190), [#185](https://github.com/taverns-red/toast-stats/issues/185)) ([652e865](https://github.com/taverns-red/toast-stats/commit/652e865b71bd57f82bbbc77fe02aa89319be0cb5))
- remove stray expression and add lesson 29 ([#135](https://github.com/taverns-red/toast-stats/issues/135)) ([12d02a1](https://github.com/taverns-red/toast-stats/commit/12d02a1a48810ac832f1759baaa0d948a1cc7a74))
- use console.error instead of console.log in analytics-core fallback loggers ([#100](https://github.com/taverns-red/toast-stats/issues/100)) ([bbd3396](https://github.com/taverns-red/toast-stats/commit/bbd33968a44a75245c0770a56b9d88f66a0c4fcc))
- use membershipBase fallback for single-snapshot growth score ([#111](https://github.com/taverns-red/toast-stats/issues/111)) ([1cadca0](https://github.com/taverns-red/toast-stats/commit/1cadca09fedba6fdd3347bb84cd69889470e1b2f))

### Refactors

- decompose SnapshotStore into dedicated reader, writer, disc… ([f51ea74](https://github.com/taverns-red/toast-stats/commit/f51ea743d8a1dc5a384d60f659d373e8b0b1d6f9))
- deduplicate ILogger — import from canonical serviceInterfaces.ts ([90953ee](https://github.com/taverns-red/toast-stats/commit/90953ee2b565662110a8100feb7a19a1ac11ae27))
- extract club eligibility calculations to a shared utility t… ([b30df92](https://github.com/taverns-red/toast-stats/commit/b30df9246a89d9eb326b76722d9ecda213c6e14e))
- extract club eligibility calculations to a shared utility to eliminate duplication and fix distinguished level naming inconsistencies. ([155ff98](https://github.com/taverns-red/toast-stats/commit/155ff988a7e3c5c5ded0f5eadcd048181c128946))
- migrate property-based tests to standard unit tests across … ([f6b46fb](https://github.com/taverns-red/toast-stats/commit/f6b46fb318e10744921cb6c2a8862c84d66d61d9))
- migrate property-based tests to standard unit tests across various modules. ([48642ef](https://github.com/taverns-red/toast-stats/commit/48642ef44658a93e3b1723ac4e2e7d6f7324e6b3))
- Remove legacy JavaScript analytics modules and update related TypeScript interfaces and utilities. ([bf72eac](https://github.com/taverns-red/toast-stats/commit/bf72eac13deab09e88db5169964ffd1fad9d0533))
- Remove meta-level property tests for test utilities and upd… ([51fe303](https://github.com/taverns-red/toast-stats/commit/51fe303e15a6a8fc6e129de42c0304693a651ed6))
- Remove meta-level property tests for test utilities and update various existing property tests. ([36a44c1](https://github.com/taverns-red/toast-stats/commit/36a44c13ebc57e7f9629f396393c533cf1534358))
- rename scraper-cli to collector-cli across the codebase ([#99](https://github.com/taverns-red/toast-stats/issues/99)) ([eac9a3b](https://github.com/taverns-red/toast-stats/commit/eac9a3ba3d1b857e0c53efeef953584b73edae66))
- Restructure analytics types into domain-specific files and extract frontend hook logic into reusable utilities. ([2ae8d96](https://github.com/taverns-red/toast-stats/commit/2ae8d961708e4bb81d93bbf41e70c432f2ea9448))
- split types.ts (1218 lines) into 8 domain files with re-export barrel ([b704cc8](https://github.com/taverns-red/toast-stats/commit/b704cc8215bede4736c61c747d58a925a475a4df))

### Documentation

- **backend:** update service architecture and analytics pipeline documentation ([805792c](https://github.com/taverns-red/toast-stats/commit/805792ca709155096c9042412a6fe437ec7062bc))
- **specs:** add projected year-end simplification specification ([35840a7](https://github.com/taverns-red/toast-stats/commit/35840a7b94ded9644b66dfdaa216436fc5329013))

### Tests

- add failing tests for topGrowthClubs and dcpGoalAnalysis ([#84](https://github.com/taverns-red/toast-stats/issues/84)) ([82e1bda](https://github.com/taverns-red/toast-stats/commit/82e1bda4a89ec6764bd634ade03e8d580f6a5970))

# Changelog

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

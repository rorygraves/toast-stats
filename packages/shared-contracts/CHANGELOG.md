# Changelog

## [1.6.0](https://github.com/taverns-red/toast-stats/compare/shared-contracts-v1.5.0...shared-contracts-v1.6.0) (2026-05-31)


### Features

* **changes:** area & division status-transition events in the What-Changed feed ([#1014](https://github.com/taverns-red/toast-stats/issues/1014)) ([#1025](https://github.com/taverns-red/toast-stats/issues/1025)) ([94df6f4](https://github.com/taverns-red/toast-stats/commit/94df6f4ecd0d8a18bfe1ab30bf7ef60ee5b6d389))

## [1.5.0](https://github.com/taverns-red/toast-stats/compare/shared-contracts-v1.4.0...shared-contracts-v1.5.0) (2026-05-27)


### Features

* **changes:** Phase 1 — snapshot diff engine + default district digest ([#793](https://github.com/taverns-red/toast-stats/issues/793)) ([#801](https://github.com/taverns-red/toast-stats/issues/801)) ([86d4ccb](https://github.com/taverns-red/toast-stats/commit/86d4ccb920a59160f42584b923a515eaf377ebeb))

## [1.4.0](https://github.com/taverns-red/toast-stats/compare/shared-contracts-v1.3.0...shared-contracts-v1.4.0) (2026-05-23)


### Features

* **district-clubs:** [#489](https://github.com/taverns-red/toast-stats/issues/489) surface FAC-only clubs (ATOs / prospective) ([#594](https://github.com/taverns-red/toast-stats/issues/594)) ([d076fba](https://github.com/taverns-red/toast-stats/commit/d076fba705466ce3dd4765eecd32c8e2cd209a51))
* **find-a-club:** schema bump + Club hero CHARTERED + disable pre-push ([#429](https://github.com/taverns-red/toast-stats/issues/429) [#431](https://github.com/taverns-red/toast-stats/issues/431) [#432](https://github.com/taverns-red/toast-stats/issues/432)) ([#483](https://github.com/taverns-red/toast-stats/issues/483)) ([ca573cd](https://github.com/taverns-red/toast-stats/commit/ca573cd9f457a9a6f3e4954c7f932bf1a3d26531))

## [1.3.0](https://github.com/taverns-red/toast-stats/compare/shared-contracts-v1.2.1...shared-contracts-v1.3.0) (2026-04-22)


### Features

* implement CompetitiveAwardsCalculator + pipeline integration ([#330](https://github.com/taverns-red/toast-stats/issues/330)) ([b81a1eb](https://github.com/taverns-red/toast-stats/commit/b81a1ebb7f4efaa49f8f7e2ae526640af45349c6))
* parse payment breakdown columns from All Districts CSV ([#327](https://github.com/taverns-red/toast-stats/issues/327)) ([df695cf](https://github.com/taverns-red/toast-stats/commit/df695cfdf489026629dd5292ccfe8bb7c8f7f5c3))
* parse prerequisite + Smedley columns from All Districts CSV ([#329](https://github.com/taverns-red/toast-stats/issues/329)) ([13589d2](https://github.com/taverns-red/toast-stats/commit/13589d226ae5668da9ace1b3a55cf058f7680faa))


### Bug Fixes

* exclude new charters from District Club Retention Award ([#336](https://github.com/taverns-red/toast-stats/issues/336)) ([#337](https://github.com/taverns-red/toast-stats/issues/337)) ([239a31a](https://github.com/taverns-red/toast-stats/commit/239a31acbb424483ea546c76c85f129d6e6b5707))

## [1.2.1](https://github.com/taverns-red/toast-stats/compare/shared-contracts-v1.2.0...shared-contracts-v1.2.1) (2026-04-06)


### Bug Fixes

* add cspSubmitted to Zod schema so snapshots preserve it ([#300](https://github.com/taverns-red/toast-stats/issues/300)) ([d1406a9](https://github.com/taverns-red/toast-stats/commit/d1406a9026d8cfa497a28836f5f558c17fc90485))

## [1.2.0](https://github.com/taverns-red/toast-stats/compare/shared-contracts-v1.1.1...shared-contracts-v1.2.0) (2026-04-03)


### Features

* **core:** incorporate granular DCP goals into data pipeline ([#273](https://github.com/taverns-red/toast-stats/issues/273)) ([dde0439](https://github.com/taverns-red/toast-stats/commit/dde04394bb22bf0c0d660e31110ce59ea711215c))


### Refactors

* split LazyCharts into individual files to fix fast refresh warning ([#251](https://github.com/taverns-red/toast-stats/issues/251)) ([9a8139d](https://github.com/taverns-red/toast-stats/commit/9a8139d7a4e3ef40f135cad9456cfba9ce145530))

## [1.1.1](https://github.com/taverns-red/toast-stats/compare/shared-contracts-v1.1.0...shared-contracts-v1.1.1) (2026-03-29)


### Bug Fixes

* add ignoreDeprecations for TS7 moduleResolution=node10 deprecation ([aab7f32](https://github.com/taverns-red/toast-stats/commit/aab7f322febb51ba4f33396aad2ea7ef1b58e4ee))

## [1.1.0](https://github.com/taverns-red/toast-stats/compare/shared-contracts-v1.0.0...shared-contracts-v1.1.0) (2026-03-26)

### Features

- Add repository URL to package.json and `cspSubmitted` field to the district statistics club interface. ([617b97b](https://github.com/taverns-red/toast-stats/commit/617b97b1526e9336838acccedc3165261cfe3933))
- **analytics-core:** implement division and area data wiring with raw CSV preservation ([1750308](https://github.com/taverns-red/toast-stats/commit/175030829f19ebb3caa499d1a2dea6a3b6f008eb))
- **analytics-core:** implement per-metric rankings calculation and integration ([f857447](https://github.com/taverns-red/toast-stats/commit/f857447b81b59cf6067274f75a807b9a2023fffa))
- **backend:** complete refresh-service computation removal and analytics migration ([17dbf27](https://github.com/taverns-red/toast-stats/commit/17dbf273e48bf5c52c61821d158ce9159af4a02b))
- **shared-contracts:** establish canonical ClubHealthStatus type and resolve value mismatch ([916be21](https://github.com/taverns-red/toast-stats/commit/916be217390afdad12825f427aab2d1f42b201a2))
- **shared-contracts:** implement shared data contracts package ([3d8ce42](https://github.com/taverns-red/toast-stats/commit/3d8ce42b5f8e1a15a9e61b78f3fb4b91bbe8345c))
- **snapshot-storage:** implement GCS-backed snapshot storage provider ([f2817a6](https://github.com/taverns-red/toast-stats/commit/f2817a68e9d6628f05ffe7d784ba36f1bcb75d13))
- **snapshot-store:** implement latest snapshot pointer for O(1) cold-start resolution ([d5370ce](https://github.com/taverns-red/toast-stats/commit/d5370cef3f3d58b55c7a15feb7f7c78128110190))

### Refactors

- migrate frontend types to shared-contracts — DistrictRanking, ProgramYearWithData, AvailableRankingYearsResponse ([#130](https://github.com/taverns-red/toast-stats/issues/130)) ([8572f0f](https://github.com/taverns-red/toast-stats/commit/8572f0f1ca76ff3a5ef172c509f3075e83a695bd))
- Remove meta-level property tests for test utilities and upd… ([51fe303](https://github.com/taverns-red/toast-stats/commit/51fe303e15a6a8fc6e129de42c0304693a651ed6))
- Remove meta-level property tests for test utilities and update various existing property tests. ([36a44c1](https://github.com/taverns-red/toast-stats/commit/36a44c13ebc57e7f9629f396393c533cf1534358))
- rename scraper-cli to collector-cli across the codebase ([#99](https://github.com/taverns-red/toast-stats/issues/99)) ([eac9a3b](https://github.com/taverns-red/toast-stats/commit/eac9a3ba3d1b857e0c53efeef953584b73edae66))

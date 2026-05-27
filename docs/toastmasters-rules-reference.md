# Toastmasters International Rules Reference

**Status:** Authoritative  
**Applies to:** All Toastmasters reporting and analytics calculations  
**Audience:** Developers, Analytics Engine, Reporting Systems  
**Owner:** Development Team  
**Last Updated:** January 2026

---

## 1. Purpose

This document defines the **canonical Toastmasters International rules** for the Toast-Stats application.

Its goals are to:

- Establish authoritative rules for Distinguished Club Program (DCP) qualification
- Define membership and payment requirements
- Document Club Success Plan (CSP) requirements
- Specify Area and Division recognition criteria
- Provide a mapping between legacy assumptions and current official rules

This document is **normative** and supersedes any conflicting assumptions from legacy reports or PDFs.

Kiro MUST treat this document as the **primary source of truth** for all Toastmasters rule-related decisions.

---

## 2. Program Year Structure

### 2.1 Program Year Definition

- **Duration**: July 1 through June 30
- **Example**: Program Year 2025-2026 runs July 1, 2025 to June 30, 2026
- **Recognition Period**: Distinguished status is evaluated at program year end

### 2.2 Program Year Calculation

```typescript
function getProgramYear(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-12

  if (month >= 7) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}
```

---

## 3. Distinguished Club Program (DCP)

### 3.1 DCP Goals Overview

The DCP consists of **10 goals** that clubs work toward during the program year:

| Goal | Description                            | Requirement                         |
| ---- | -------------------------------------- | ----------------------------------- |
| 1    | Level 1 Awards                         | 4 or more                           |
| 2    | Level 2 Awards                         | 2 or more                           |
| 3    | Additional Level 2 Awards              | 2 additional (4 total)              |
| 4    | Level 3 Awards                         | 2 or more                           |
| 5    | Level 4/Path Completion/DTM Awards     | 1 or more                           |
| 6    | Additional Level 4/Path Completion/DTM | 1 additional (2 total)              |
| 7    | New Members                            | 4 or more                           |
| 8    | Additional New Members                 | 4 additional (8 total)              |
| 9    | Officer Training                       | 4+ officers trained in each round   |
| 10   | Administrative Excellence              | Officer list on time + dues on time |

### 3.2 Distinguished Club Levels

| Level                     | DCP Goals Required | Membership Requirement | Alternative       |
| ------------------------- | ------------------ | ---------------------- | ----------------- |
| Distinguished             | 5 goals            | 20 members             | OR net growth ≥ 3 |
| Select Distinguished      | 7 goals            | 20 members             | OR net growth ≥ 5 |
| President's Distinguished | 9 goals            | 20 members             | —                 |
| Smedley Distinguished     | 10 goals           | 25 members             | —                 |

### 3.3 CSP Requirement (2025-2026 and later)

**Starting in program year 2025-2026**, clubs MUST have a submitted Club Success Plan (CSP) to qualify for any Distinguished level.

- **CSP Submitted**: Club is eligible for Distinguished recognition
- **CSP Not Submitted**: Club cannot achieve Distinguished status regardless of goals/membership
- **Historical Data**: For program years prior to 2025-2026, CSP field did not exist; assume submitted

### 3.4 Recognition Timing

- Distinguished status is **only valid from April 1 onwards** in the program year
- Before April 1, clubs may meet requirements but are not officially recognized
- Final recognition is determined at program year end (June 30)

---

## 4. Membership Requirements

### 4.1 Membership Dues Payment Schedule

Members pay dues **twice per year**, aligned with the two renewal periods:

- **October Renewal** (Oct–Mar period): Dues for the first half of the program year
- **April Renewal** (Apr–Sep period): Dues for the second half of the program year

This means a club's `paymentsCount` (total dues payments) can be **up to 2× its membership count**, depending on when members joined and which renewal periods have passed. For example, a club with 10 members that has been through both renewal periods could have up to 20 payments.

The `paymentBase` at the district level represents the baseline payment count at the start of the program year. Payment growth (`totalPayments - paymentBase`) reflects both new member joins and renewal completions.

### 4.2 Paid Club Definition

A club is considered "paid" (in good standing) when:

- Club status is "Active"
- Membership dues are current

A club is NOT considered paid when status is:

- "Suspended"
- "Ineligible"
- "Low"

### 4.3 Membership Thresholds

| Threshold              | Count                         | Purpose                             |
| ---------------------- | ----------------------------- | ----------------------------------- |
| Minimum for Charter    | 20 members                    | New club formation                  |
| Distinguished Minimum  | 20 members                    | Base distinguished qualification    |
| Smedley Minimum        | 25 members                    | Smedley distinguished qualification |
| Low Membership Warning | < 12 members                  | Club health concern                 |
| Intervention Required  | < 12 members + net growth < 3 | Critical club health                |

### 4.4 Net Growth Calculation

```typescript
netGrowth = currentActiveMembers - membershipBase
```

- **Membership Base**: Starting membership count at beginning of program year
- **Net Growth Alternative**: Allows clubs with fewer than 20 members to qualify for Distinguished/Select if they achieve sufficient growth

---

## 5. Club Health Classification

### 5.1 Classification Rules

Clubs are classified into exactly one of three categories:

| Status                    | Criteria                                                            |
| ------------------------- | ------------------------------------------------------------------- |
| **Intervention Required** | Membership < 12 AND net growth < 3                                  |
| **Thriving**              | Membership requirement met AND DCP checkpoint met AND CSP submitted |
| **Vulnerable**            | Any requirement not met (but not intervention required)             |

### 5.2 Membership Requirement for Thriving

A club meets the membership requirement if:

- Membership ≥ 20, OR
- Net growth ≥ 3

### 5.3 DCP Checkpoint by Month

| Month     | Minimum DCP Goals  |
| --------- | ------------------ |
| July      | 0 (administrative) |
| August    | 0                  |
| September | 1                  |
| October   | 1                  |
| November  | 2                  |
| December  | 2                  |
| January   | 3                  |
| February  | 4                  |
| March     | 4                  |
| April     | 5                  |
| May       | 5                  |
| June      | 5                  |

---

## 6. Distinguished Area Program (DAP)

### 6.1 Eligibility Gate

An Area is eligible for recognition **only if** the Area Director has completed and submitted Club Visit Reports meeting the following thresholds:

- **Round 1 (by November 30):** ≥ 75% of the Area's club base must have a submitted first-round visit report ("Nov Visit award" = 1 in CSV)
- **Round 2 (by May 31):** ≥ 75% of the Area's club base must have a submitted second-round visit report ("May Visit award" = 1 in CSV)

As a general rule, Area Directors are required to make **at least two club visits per club per year** (one per round), although they are highly encouraged to visit each club once per quarter.

**Data source:** The club-performance CSV columns "Nov Visit award" and "May Visit award" indicate per-club visit completion for each round. The threshold is 75% of the Area's club base, not 100%.

**Eligibility states:**

- **Eligible**: Both rounds meet the 75% threshold
- **Partial**: Only one round meets the threshold (or both below)
- **Pre-deadline**: Before Nov 30 (Round 1) or May 31 (Round 2), the round is pending

### 6.2 Club Base Requirement (No Net Loss)

- **No net club loss**: paid clubs ≥ the Area's club base (club base = paid clubs as of July 1).
- Distinguished-club counts are measured against the **club base**, not against paid clubs.

### 6.3 Recognition Levels

Distinguished clubs are counted as a percentage of the Area's **club base**, rounded up
(`Math.ceil(base × pct)` — "at least X%"). All levels also require the §6.1 club-visit gate
(75% per round).

| Level                          | Distinguished Clubs (of club base) | Paid Clubs                  |
| ------------------------------ | ---------------------------------- | --------------------------- |
| Distinguished Area             | ≥ 50%                              | ≥ base (no net loss)        |
| Select Distinguished Area      | ≥ 50% + 1                          | ≥ base                      |
| President's Distinguished Area | ≥ 50% + 1                          | ≥ base + 1 (net growth ≥ 1) |

**Source:** District Recognition Program manual (item 1490), Distinguished Area Program (DAP).
Implemented by `frontend/src/utils/divisionStatus.ts::calculateAreaStatus` +
`areaGapAnalysis.ts`. The earlier "% of _paid_ clubs, 50/75/100" model was a legacy
misreading corrected in #799.

---

## 7. Distinguished Division Program (DDP)

### 7.1 Eligibility Gate

A Division qualifies for the DDP when it has **no net club loss** (paid clubs ≥ club base)
and **≥ 4 areas**. Division recognition is based on the division's distinguished **clubs**
and its paid-club growth — **NOT** on distinguished areas. Area club visits are NOT a DDP
qualifying requirement: visits gate Area Distinguished status (§6.1), but visit completion is
not an independent DDP gate.

### 7.2 Paid Clubs Requirement (No Net Loss + Growth)

The paid-club requirement rises by level (relative to club base = paid clubs as of July 1):

- **Distinguished**: no net club loss (paid clubs ≥ club base)
- **Select**: paid clubs ≥ club base + 1 (net growth of one)
- **President's**: paid clubs ≥ club base + 2 (net growth of two)

### 7.3 Recognition Levels

Distinguished clubs are counted as a percentage of the Division's **club base**, rounded up
(`Math.ceil(base × pct)`).

| Level                              | Distinguished Clubs (of club base) | Paid Clubs (net growth) |
| ---------------------------------- | ---------------------------------- | ----------------------- |
| Distinguished Division             | ≥ 45%                              | ≥ base                  |
| Select Distinguished Division      | ≥ 50%                              | ≥ base + 1              |
| President's Distinguished Division | ≥ 55%                              | ≥ base + 2              |

**Source:** District Recognition Program manual (item 1490), Distinguished Division Program
(DDP). This is the model implemented by `frontend/src/utils/divisionGapAnalysis.ts` (the
verified recognition source of truth) and it reproduces the official TI dashboard. The earlier
"≥ 85% paid _areas_, % of distinguished _areas_ 50/75/100" model was a legacy interpretation
removed in #799 — see `docs/investigations/798-division-recognition-thresholds.md`.

---

## 8. Coach Eligibility Rules

### 8.1 Club Coach Assignment

- Clubs may be assigned a Club Coach when experiencing difficulties
- Coach eligibility requires completion of Club Coach training
- Coaches work with clubs to improve membership and goal achievement

### 8.2 Coach Impact on Recognition

- Coach assignment does not directly affect Distinguished status
- Coach effectiveness is measured by club improvement metrics

---

## 9. Legacy PDF to Current Rules Mapping

This section documents differences between legacy report assumptions and current official rules.

| Legacy PDF Assumption                 | Current Official Rule                                                                                                              | Application Rule                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| No CSP requirement                    | CSP required for Distinguished (2025-2026+)                                                                                        | Check CSP field; default true for historical data                                      |
| Distinguished valid year-round        | Distinguished valid from April 1                                                                                                   | Apply April 1 cutoff for recognition                                                   |
| Fixed membership thresholds           | Net growth alternative allowed                                                                                                     | Check both membership AND net growth                                                   |
| No club visit requirement for DAP     | Club visits required for DAP eligibility                                                                                           | Mark eligibility "Unknown" when data unavailable                                       |
| Simple percentage calculations        | District **% Distinguished** ranking uses paid club base as denominator                                                            | Applies to the district ranking metric only (see Lesson 60)                            |
| Division recognition by area %        | DDP recognition counts distinguished **clubs** as % of division club base (45/50/55), NOT distinguished _areas_ as % of paid areas | Use `divisionGapAnalysis.ts`; the area-% model was removed in #799                     |
| Area/Division recognition denominator | Area & Division recognition tiers count distinguished clubs against the **club base**                                              | Do not reuse the district ranking's paid-club-base denominator for area/division tiers |
| No Smedley level mentioned            | Smedley Distinguished exists (10 goals + 25 members)                                                                               | Include Smedley in all calculations                                                    |

---

## 10. Data Field Mapping

### 10.1 Dashboard CSV Fields

| Concept              | Primary Field               | Alternative Fields                   |
| -------------------- | --------------------------- | ------------------------------------ |
| Club ID              | `Club Number`               | `Club ID`, `ClubID`                  |
| Membership           | `Active Members`            | `Membership`, `Active Membership`    |
| DCP Goals            | `Goals Met`                 | —                                    |
| Club Status          | `Club Status`               | `Status`                             |
| Distinguished Status | `Club Distinguished Status` | —                                    |
| Membership Base      | `Mem. Base`                 | —                                    |
| CSP Status           | `CSP`                       | `Club Success Plan`, `CSP Submitted` |
| Division             | `Division`                  | `Div`                                |
| Area                 | `Area`                      | —                                    |

### 10.2 Goal-Specific Fields

| Goal | Field Name                                                                 | Threshold             |
| ---- | -------------------------------------------------------------------------- | --------------------- |
| 1    | `Level 1s`                                                                 | ≥ 4                   |
| 2    | `Level 2s`                                                                 | ≥ 2                   |
| 3    | `Add. Level 2s`                                                            | ≥ 2 (with Goal 2 met) |
| 4    | `Level 3s`                                                                 | ≥ 2                   |
| 5    | `Level 4s, Path Completions, or DTM Awards`                                | ≥ 1                   |
| 6    | `Add. Level 4s, Path Completions, or DTM award`                            | ≥ 1 (with Goal 5 met) |
| 7    | `New Members`                                                              | ≥ 4                   |
| 8    | `Add. New Members`                                                         | ≥ 4 (with Goal 7 met) |
| 9    | `Off. Trained Round 1` + `Off. Trained Round 2`                            | ≥ 4 each              |
| 10   | `Off. List On Time` + (`Mem. dues on time Oct` OR `Mem. dues on time Apr`) | ≥ 1 each              |

---

## 11. Calculation Precedence

When calculating recognition status, apply rules in this order:

1. **Eligibility Gates**: Check club visits (if data available)
2. **Paid Status**: Determine paid clubs/areas
3. **Paid Threshold**: Verify minimum paid percentage met
4. **Distinguished Calculation**: Calculate distinguished % against paid units only
5. **Recognition Level**: Assign highest level for which all criteria are met

---

## 12. Implementation Requirements

1. **CSP Check**: Always check CSP status for 2025-2026+ data
2. **Paid Denominator**: Distinguished percentages MUST use paid units as denominator
3. **Eligibility First**: Evaluate eligibility gates before scoring metrics
4. **Highest Level**: Recognition level is the highest level for which ALL criteria are met
5. **Unknown Handling**: When eligibility cannot be determined, mark as "Unknown"
6. **April 1 Cutoff**: Distinguished recognition only valid from April 1 onwards

---

## 13. District Recognition Program

**Source:** Item 1490, Rev. 04/2025

### 13.1 Prerequisites (Hard Gates)

All four Distinguished District tiers require these prerequisites:

- **District Success Plan** submitted by September 30
- **85% of Division/Area Directors trained** (training report submitted)
- **Market Analysis Plan** submitted by September 30
- **Communication Plan** submitted by September 30
- **2+ Region Advisor meetings** by May 31

**Data source:** All Districts Summary CSV columns: `DSP`, `Training`, `Market Analysis`, `Communication Plan`, `Region Advisor Visit` (Y/N values)

### 13.2 Distinguished District Tiers

| Tier                      | No Net Club Loss | Payments Growth | Club Growth | % Distinguished |
| ------------------------- | :--------------: | :-------------: | :---------: | :-------------: |
| Distinguished             |     Required     |       ≥1%       |     ≥1%     |      ≥45%       |
| Select Distinguished      |   Net +1 club    |       ≥3%       |     ≥3%     |      ≥50%       |
| President's Distinguished |        —         |       ≥5%       |     ≥5%     |      ≥55%       |
| Smedley Distinguished     |        —         |       ≥8%       |     ≥8%     |      ≥60%       |

Smedley Distinguished is new for the 2025-2026 program year.

### 13.3 Competitive Awards (Top 3 Globally)

- **President's Extension Award:** Top 3 districts by net club growth
- **President's 20-Plus Award:** Top 3 districts by % of active clubs with 20+ paid members
- **District Club Retention Award:** Top 3 districts retaining 90%+ paid clubs

### 13.4 Threshold Awards

- **District Club Strength Award:** 10%+ growth in average club size (Total Membership / Active Clubs) year-over-year
- **District Leadership Excellence Award:** 3+ consecutive years Distinguished (any tier)

### 13.5 Officer Awards

- **Excellence in Education & Training Award:** Awarded to PQD in districts that train 85% of Directors and meet Distinguished goals in Distinguished clubs
- **Excellence in Club Growth Award:** Awarded to CGD in districts that meet Distinguished goals in club and membership payments growth

---

## 14. Version History

| Version | Date          | Changes                                                                                                                                                                                                                                                          |
| ------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | January 2026  | Initial canonical rules reference                                                                                                                                                                                                                                |
| 1.1     | February 2026 | Added membership dues payment schedule (§4.1)                                                                                                                                                                                                                    |
| 1.2     | April 2026    | Added §13 District Recognition Program (all 11 award types)                                                                                                                                                                                                      |
| 1.3     | May 2026      | Corrected §6 (DAP) and §7 (DDP) to the manual (item 1490) model — distinguished **clubs** as % of **club base** (DAP 50/50+1, DDP 45/50/55) + paid-club growth; removed the legacy area-%/paid-% recognition model; clarified §9 recognition denominators (#799) |

---

## 15. Final Rules

> **CSP submission is required for Distinguished status (2025-2026+).**  
> **Distinguished percentages use paid units as denominator.**  
> **Eligibility gates are hard blockers.**  
> **Recognition levels are ordinal and mutually exclusive.**  
> **When in doubt, defer to current Toastmasters International official rules.**

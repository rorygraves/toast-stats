/* AreaRedirectPage (#1017) — flat, shareable area URL.

   Resolves the flat `/district/:districtId/area/:areaId` to the canonical nested
   route `/district/:districtId/division/:divId/area/:areaId`. The division is
   resolved by looking the area up in the same divisions snapshot AreaPage reads
   (one source of truth — R3/R8; the division is NEVER string-parsed off the area
   id). Mirrors the ClubRedirectPage pattern (#320): the nested route stays
   canonical, this is a memorable alias (operator example: /district/61/area/A1).

   Stub — redirect logic lands in the Green step. */

import React from 'react'
import { LoadingSkeleton } from '../components/LoadingSkeleton'

const AreaRedirectPage: React.FC = () => {
  return <LoadingSkeleton variant="card" />
}

export default AreaRedirectPage

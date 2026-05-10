/* My District (#417) — single district the viewer has pinned as 'theirs'.
   Sticky-pin to the top of the rankings table on the Districts page;
   foundation for future 'my dashboard' style features. */

import { useCallback, useEffect, useState } from 'react'
import { readJson, writeJson, removeKey } from '../utils/localStorageStore'

const STORAGE_NAME = 'my-district-id'

export function useMyDistrict(): {
  myDistrictId: string | null
  setMyDistrict: (id: string | null) => void
  isMyDistrict: (id: string) => boolean
} {
  const [myDistrictId, setMyDistrictIdState] = useState<string | null>(() =>
    readJson<string | null>(STORAGE_NAME, null)
  )

  // Sync to localStorage whenever the value changes (after first render).
  useEffect(() => {
    if (myDistrictId === null) {
      removeKey(STORAGE_NAME)
    } else {
      writeJson(STORAGE_NAME, myDistrictId)
    }
  }, [myDistrictId])

  const setMyDistrict = useCallback((id: string | null) => {
    setMyDistrictIdState(id)
  }, [])

  const isMyDistrict = useCallback(
    (id: string) => myDistrictId === id,
    [myDistrictId]
  )

  return { myDistrictId, setMyDistrict, isMyDistrict }
}

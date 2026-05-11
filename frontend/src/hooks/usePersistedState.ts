/* usePersistedState (#416) — useState that mirrors its value to the
   versioned localStorage primitive. Read once on mount, write on every
   change. Same shape as useState. */

import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { readJson, writeJson } from '../utils/localStorageStore'

export function usePersistedState<T>(
  storageName: string,
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readJson(storageName, initial))

  useEffect(() => {
    writeJson(storageName, value)
  }, [storageName, value])

  return [value, setValue]
}

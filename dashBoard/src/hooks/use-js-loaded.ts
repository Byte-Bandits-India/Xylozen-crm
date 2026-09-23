import { useState } from 'react'

export function useJsLoaded() {
  const [loaded] = useState(true)
  return loaded
}

import { useEffect, useState } from 'react'
import { listAgents } from '../embers/client.js'
import { embersErrorMessage } from '../embers/http.js'
import { hydrateAgents } from '../embers/officeBridge.js'

export function useAgentCatalog(layoutReady: boolean): {
  catalogError: string | null
  setCatalogError: (error: string | null) => void
} {
  const [catalogError, setCatalogError] = useState<string | null>(null)

  useEffect(() => {
    if (!layoutReady) return
    let cancelled = false
    listAgents()
      .then((agents) => {
        if (cancelled) return
        hydrateAgents(agents)
      })
      .catch((err) => {
        if (!cancelled) setCatalogError(embersErrorMessage(err))
      })
    return () => { cancelled = true }
  }, [layoutReady])

  return { catalogError, setCatalogError }
}

import { useQuery } from '@tanstack/react-query'
import type { MmgisWaypointCollection, RoverTrack } from './roverTrack'
import { parseRoverWaypoints } from './roverTrack'

export function useRoverTrack(path: string) {
  return useQuery<RoverTrack>({
    queryKey: ['rover-track', path],
    queryFn: async ({ signal }) => {
      const response = await fetch(path, { signal })
      if (!response.ok) throw new Error(`Rover track fetch failed: ${response.status}`)
      const data = (await response.json()) as MmgisWaypointCollection
      return parseRoverWaypoints(data)
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  })
}

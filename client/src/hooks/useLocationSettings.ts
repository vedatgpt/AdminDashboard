import { useQuery } from "@tanstack/react-query";
import type { LocationSettings } from "@shared/schema";

export function useLocationSettings() {
  return useQuery({
    queryKey: ['/api/location-settings/public'],
    queryFn: () => fetch('/api/location-settings/public').then(res => res.json()) as Promise<Pick<LocationSettings, 'showCountry' | 'showCity' | 'showDistrict' | 'showNeighborhood'>>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
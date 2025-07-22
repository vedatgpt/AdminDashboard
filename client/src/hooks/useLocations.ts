import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Location, InsertLocation, UpdateLocation } from "@shared/schema";

// API functions
const fetchLocations = async (): Promise<Location[]> => {
  const response = await fetch("/api/locations");
  if (!response.ok) {
    throw new Error("Failed to fetch locations");
  }
  return response.json();
};

const fetchChildLocations = async (parentId: number | null): Promise<Location[]> => {
  const url = parentId ? `/api/locations/${parentId}/children` : "/api/locations";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch child locations");
  }
  return response.json();
};

const fetchLocationById = async (id: number): Promise<Location> => {
  const response = await fetch(`/api/locations/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch location");
  }
  return response.json();
};

const fetchLocationBreadcrumbs = async (id: number): Promise<Location[]> => {
  const response = await fetch(`/api/locations/${id}/breadcrumbs`);
  if (!response.ok) {
    throw new Error("Failed to fetch breadcrumbs");
  }
  return response.json();
};

const createLocation = async (data: InsertLocation): Promise<Location> => {
  const response = await fetch("/api/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create location");
  }
  return response.json();
};

const updateLocation = async ({ id, data }: { id: number; data: UpdateLocation }): Promise<Location> => {
  const response = await fetch(`/api/locations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update location");
  }
  return response.json();
};

const deleteLocation = async (id: number): Promise<void> => {
  const response = await fetch(`/api/locations/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete location");
  }
};

// React Query hooks
export const useLocationsTree = () => {
  return useQuery({
    queryKey: ["/api/locations"],
    queryFn: fetchLocations,
    staleTime: 2 * 60 * 1000, // 2 minutes - reasonable for location data
  });
};

export const useChildLocations = (parentId: number | null) => {
  return useQuery({
    queryKey: ["/api/locations", parentId],
    queryFn: () => fetchChildLocations(parentId),
    staleTime: 2 * 60 * 1000, // 2 minutes - reasonable for location data
  });
};

export const useLocationById = (id: number) => {
  return useQuery({
    queryKey: ["/api/locations", id],
    queryFn: () => fetchLocationById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - reasonable for location data
  });
};

export const useLocationBreadcrumbs = (id: number) => {
  return useQuery({
    queryKey: ["/api/locations", id, "breadcrumbs"],
    queryFn: () => fetchLocationBreadcrumbs(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - reasonable for location data
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
  });
};
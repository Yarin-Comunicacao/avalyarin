import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    permissionDenied: false,
  });

  // Load saved location from user profile (DB)
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocalização não suportada neste navegador",
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          permissionDenied: false,
        });
        // Cache in localStorage
        localStorage.setItem("avalyarin_user_location", JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        }));
      },
      (error) => {
        const permissionDenied = error.code === error.PERMISSION_DENIED;
        setState({
          latitude: null,
          longitude: null,
          error: permissionDenied
            ? "Permissão de localização negada"
            : "Não foi possível obter sua localização",
          loading: false,
          permissionDenied,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, []);

  // Priority: 1) DB saved location (if sharing on), 2) localStorage cache, 3) nothing
  useEffect(() => {
    // If user has locationSharing enabled and has coords in DB, use those
    if (profile?.locationSharing && profile?.lat != null && profile?.lng != null) {
      setState({
        latitude: profile.lat,
        longitude: profile.lng,
        error: null,
        loading: false,
        permissionDenied: false,
      });
      // Also update localStorage cache
      localStorage.setItem("avalyarin_user_location", JSON.stringify({
        lat: profile.lat,
        lng: profile.lng,
        timestamp: Date.now(),
      }));
      return;
    }

    // Fallback: try localStorage cache
    try {
      const cached = localStorage.getItem("avalyarin_user_location");
      if (cached) {
        const { lat, lng, timestamp } = JSON.parse(cached);
        // Use cache if less than 30 minutes old
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          setState({
            latitude: lat,
            longitude: lng,
            error: null,
            loading: false,
            permissionDenied: false,
          });
        }
      }
    } catch {
      // Ignore cache errors
    }
  }, [profile?.locationSharing, profile?.lat, profile?.lng]);

  return { ...state, requestLocation };
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

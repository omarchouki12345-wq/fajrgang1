"use client";

import { MapPin } from "lucide-react";
import {
  MOROCCO_REGIONS,
  DEFAULT_REGION,
  resolveRegionKey,
  type MoroccoRegionKey,
} from "@/lib/constants";

interface RegionSelectorProps {
  value: MoroccoRegionKey;
  onChange: (region: MoroccoRegionKey) => void;
}

const STORAGE_KEY = "fajrgang_region";
const LEGACY_STORAGE_KEY = "fajrgang_city";

export default function CitySelector({ value, onChange }: RegionSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <label className="text-sm font-medium text-emerald-700 inline-flex items-center gap-1">
        <MapPin size={16} />
        الجهة:
      </label>
      <select
        className="input-field w-full sm:w-auto min-w-[220px]"
        value={value}
        onChange={(e) => onChange(e.target.value as MoroccoRegionKey)}
      >
        {Object.entries(MOROCCO_REGIONS).map(([key, region]) => (
          <option key={key} value={key}>
            {region.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function getStoredCity(): MoroccoRegionKey {
  if (typeof window === "undefined") return DEFAULT_REGION;
  const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  const region = resolveRegionKey(stored);
  if (stored !== region) {
    localStorage.setItem(STORAGE_KEY, region);
  }
  return region;
}

export function storeCity(region: MoroccoRegionKey) {
  localStorage.setItem(STORAGE_KEY, region);
}

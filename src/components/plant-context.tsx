"use client";
import { createContext, useContext } from "react";
import { getPlantProfile, type PlantId } from "@/data/plant-profiles";
export const PlantContext = createContext<PlantId>("sava");
export function usePlant() {
  return getPlantProfile(useContext(PlantContext));
}

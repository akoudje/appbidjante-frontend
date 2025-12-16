// src/utils/heroIcons.js
import * as SolidIcons from "@heroicons/react/24/solid";
import * as OutlineIcons from "@heroicons/react/24/outline";

// Fonction générique pour charger une icône HeroIcons
export function getHeroIcon(name, type = "solid") {
  const pack = type === "outline" ? OutlineIcons : SolidIcons;

  // Convertit par ex. "Users" → "UsersIcon"
  const iconName = `${name}Icon`;

  return pack[iconName] || pack["Squares2X2Icon"]; // Icône fallback
}

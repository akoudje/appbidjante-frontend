// src/utils/iconLoader.js
import * as FA from "react-icons/fa";
import * as GI from "react-icons/gi";
import * as HI from "@heroicons/react/24/outline";
import * as MD from "react-icons/md";

export const ICONS = {
  ...FA,
  ...GI,
  ...HI,
  ...MD,
};

export function getIconComponent(iconName) {
  return ICONS[iconName] || null;
}

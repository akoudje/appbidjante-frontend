// frontend/src/utils/categoryEngine.js
// Moteur de catégorisation (Module 1)
// Fonctions exportées:
// - parseBirthYear(dateStr)             // parse "DD/MM/YYYY" -> number year
// - findCategoryByBirthYear(year, categories)
// - getCategoryLabel(category)
// - isCategoryActive(category, referenceDate)
// - processMemberCategory(member, categories)
// - DEFAULT_CATEGORIES (fallback)

const DEFAULT_CATEGORIES = [
  {
    id: "1",
    generation: "BLESSOUE",
    classe: "ASSOUKROU",
    born_from: 1960,
    born_to: 1969,
    label: "BLESSOUE ASSOUKROU",
    date_sortie_1er_guerrier: "1970-01-01",
    date_sortie_2eme_guerrier: "",
  },
  {
    id: "2",
    generation: "BLESSOUE",
    classe: "AGBAN",
    born_from: 1970,
    born_to: 1979,
    label: "BLESSOUE AGBAN",
    date_sortie_1er_guerrier: "2010-06-12",
    date_sortie_2eme_guerrier: "2017-11-03",
  },
  {
    id: "3",
    generation: "BLESSOUE",
    classe: "DONGBA",
    born_from: 1980,
    born_to: 1989,
    label: "BLESSOUE DONGBA",
    date_sortie_1er_guerrier: "",
    date_sortie_2eme_guerrier: "",
  },
  {
    id: "4",
    generation: "BLESSOUE",
    classe: "DJEHOU",
    born_from: 1990,
    born_to: 1999,
    label: "BLESSOUE DJEHOU",
    date_sortie_1er_guerrier: "",
    date_sortie_2eme_guerrier: "",
  },
  {
    id: "5",
    generation: "TCHAGBA",
    classe: "ASSOUKROU",
    born_from: 2000,
    born_to: 2004,
    label: "TCHAGBA ASSOUKROU",
    date_sortie_1er_guerrier: "",
    date_sortie_2eme_guerrier: "",
  },
  {
    id: "6",
    generation: "TCHAGBA",
    classe: "AGBAN",
    born_from: 2005,
    born_to: 2009,
    label: "TCHAGBA AGBAN",
    date_sortie_1er_guerrier: "",
    date_sortie_2eme_guerrier: "",
  },
  // add others as needed...
];

/** Parse une chaîne date en format "DD/MM/YYYY" -> retourne year number, ou null */
export function parseBirthYear(dateStr) {
  if (!dateStr) return null;
  // format attendu : DD/MM/YYYY
  const parts = String(dateStr).split("/");
  if (parts.length === 3) {
    const year = Number(parts[2]);
    return Number.isFinite(year) ? year : null;
  }

  // fallback: maybe YYYY-MM-DD
  const isoParts = String(dateStr).split("-");
  if (isoParts.length === 3) {
    const year = Number(isoParts[0]);
    return Number.isFinite(year) ? year : null;
  }

  return null;
}

/** Parse une date string (DD/MM/YYYY ou YYYY-MM-DD) -> JS Date ou null */
export function parseDateFlexible(dateStr) {
  if (!dateStr) return null;
  // DD/MM/YYYY
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    const day = Number(d), month = Number(m) - 1, year = Number(y);
    if ([day, month, year].some((v) => Number.isNaN(v))) return null;
    return new Date(year, month, day);
  }
  // YYYY-MM-DD
  if (dateStr.includes("-")) {
    const [y, m, d] = dateStr.split("-");
    const year = Number(y), month = Number(m) - 1, day = Number(d);
    if ([year, month, day].some((v) => Number.isNaN(v))) return null;
    return new Date(year, month, day);
  }
  return null;
}

/** Trouve la catégorie qui correspond à une année de naissance */
export function findCategoryByBirthYear(year, categories = DEFAULT_CATEGORIES) {
  if (!year) return null;
  return (
    (categories || DEFAULT_CATEGORIES).find(
      (c) =>
        Number(c.born_from) <= Number(year) && Number(year) <= Number(c.born_to)
    ) || null
  );
}

/** Renvoie le label "GENERATION CLASSE" */
export function getCategoryLabel(category) {
  if (!category) return null;
  if (category.label) return category.label;
  return `${category.generation ?? ""} ${category.classe ?? ""}`.trim();
}

/** Détermine si une catégorie est active au regard de la date du 1er guerrier */
export function isCategoryActive(category, referenceDate = new Date()) {
  if (!category) return false;
  // support de différents noms de champs
  const warriorFirst =
    category.date_sortie_1er_guerrier ?? category.warrior_first ?? null;
  if (!warriorFirst) return false;
  const dt = parseDateFlexible(warriorFirst);
  if (!dt) return false;
  return referenceDate >= dt;
}

/**
 * Fonction principale pour un membre
 * member: { date-naissance: "DD/MM/YYYY", date_naissance: ..., categoryOfficial: id?, ... }
 * categories: array optional
 *
 * Retour :
 * {
 *  auto: "BLESSOUE AGBAN",
 *  autoObject,
 *  official: "BLESSOUE DJEHOU",
 *  officialObject,
 *  generation,
 *  isActive
 * }
 */
export function processMemberCategory(member, categories = DEFAULT_CATEGORIES) {
  if (!member) return null;

  // normalize birth year from either date-naissance or dateNaissance or date_naissance
  const dateFields =
    member["date-naissance"] || member.dateNaissance || member.date_naissance || null;
  const birthYear = parseBirthYear(dateFields);

  const autoCandidate = findCategoryByBirthYear(birthYear, categories);

  let officialObject = null;
  if (member.categoryOfficial) {
    officialObject =
      categories.find((c) => String(c.id) === String(member.categoryOfficial)) ||
      null;
  } else if (member.categorie && typeof member.categorie === "string") {
    // if categorie field contains a label, try to match
    officialObject =
      categories.find((c) => c.label === member.categorie) || null;
  }

  const selected = officialObject || autoCandidate || null;
  return {
    auto: autoCandidate ? getCategoryLabel(autoCandidate) : null,
    autoObject: autoCandidate,
    official: officialObject ? getCategoryLabel(officialObject) : null,
    officialObject,
    generation: selected?.generation ?? null,
    isActive: selected ? isCategoryActive(selected) : false,
    selectedObject: selected,
    birthYear,
  };
}

export { DEFAULT_CATEGORIES };
export default {
  parseBirthYear,
  parseDateFlexible,
  findCategoryByBirthYear,
  getCategoryLabel,
  isCategoryActive,
  processMemberCategory,
  DEFAULT_CATEGORIES,
};

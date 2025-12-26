// src/components/amendes/AmendeDetailPanel.jsx

export default function AmendeDetailPanel({ amende }) {
  if (!amende) {
    return (
      <div className="text-gray-500 text-sm italic">
        Aucune donnée disponible pour cette amende
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {/* ===================== */}
      {/* INFORMATIONS GÉNÉRALES */}
      {/* ===================== */}
      <Section title="Informations générales">
        <Row label="Référence" value={amende.reference || "—"} />
        <Row label="Type" value={formatAmendeType(amende.type)} />
        <Row label="Motif" value={amende.motif || "—"} />

        {amende.description && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-gray-500 mb-1">Description :</div>
            <div className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded">
              {amende.description}
            </div>
          </div>
        )}

        {amende.montant != null && (
          <Row
            label="Montant"
            value={`${amende.montant.toLocaleString()} FCFA`}
          />
        )}

        <Row
          label="Statut"
          value={<StatutBadge statut={amende.statut} />}
        />
      </Section>

      {/* ================= */}
      {/* CIBLES CONCERNÉES */}
      {/* ================= */}
      <Section title="Cibles concernées">
        {Array.isArray(amende.cibles) && amende.cibles.length > 0 ? (
          amende.cibles.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-start border rounded-lg px-3 py-2"
            >
              <div>
                <div className="font-medium">
                  {c.cibleNom} {c.ciblePrenom || ""}
                </div>
                <div className="text-xs text-gray-500">
                  {formatCibleType(c.type)}
                </div>
              </div>

              {c.estTransferee && (
                <span className="text-xs text-orange-600 font-medium">
                  Transférée
                </span>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">Aucune cible enregistrée</p>
        )}
      </Section>

      {/* ========= */}
      {/* PAIEMENTS */}
      {/* ========= */}
      <Section title="Paiements">
        {Array.isArray(amende.paiements) && amende.paiements.length > 0 ? (
          amende.paiements.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center border rounded-lg px-3 py-2"
            >
              <div>
                <div className="font-medium">
                  {p.montant?.toLocaleString()} FCFA
                </div>
                <div className="text-xs text-gray-500">
                  {p.mode || "—"}
                </div>
              </div>

              <div className="text-xs text-gray-600">
                {p.datePaiement
                  ? new Date(p.datePaiement).toLocaleDateString("fr-FR")
                  : "—"}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Aucun paiement enregistré</p>
        )}
      </Section>
    </div>
  );
}

/* ========================= */
/* ===== UI HELPERS ======== */
/* ========================= */

function Section({ title, children }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function StatutBadge({ statut }) {
  const map = {
    EN_ATTENTE: "bg-gray-100 text-gray-700",
    PARTIEL: "bg-yellow-100 text-yellow-700",
    PAYEE: "bg-green-100 text-green-700",
    TRANSFEREE: "bg-blue-100 text-blue-700",
    IMPAYEE: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold ${
        map[statut] || "bg-gray-100 text-gray-700"
      }`}
    >
      {formatStatut(statut)}
    </span>
  );
}

/* ========================= */
/* ===== FORMATTERS ======== */
/* ========================= */

function formatAmendeType(type) {
  switch (type) {
    case "PECUNIAIRE":
      return "Pécuniaire";
    case "DISCIPLINAIRE":
      return "Disciplinaire";
    case "MATERIELLE":
      return "Matérielle";
    case "MIXTE":
      return "Mixte";
    default:
      return type || "—";
  }
}

function formatStatut(statut) {
  switch (statut) {
    case "EN_ATTENTE":
      return "En attente";
    case "PARTIEL":
      return "Paiement partiel";
    case "PAYEE":
      return "Payée";
    case "TRANSFEREE":
      return "Transférée";
    case "IMPAYEE":
      return "Impayée";
    default:
      return statut || "—";
  }
}

function formatCibleType(type) {
  switch (type) {
    case "INDIVIDU":
      return "Individu";
    case "LIGNEE":
      return "Lignée";
    case "CATEGORIE":
      return "Catégorie";
    case "GENERATION":
      return "Génération";
    default:
      return type || "—";
  }
}

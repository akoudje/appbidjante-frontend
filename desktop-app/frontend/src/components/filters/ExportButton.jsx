// frontend/src/components/filters/ExportButton.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DocumentArrowDownIcon, PrinterIcon } from "@heroicons/react/24/solid";

export default function ExportButton({ data, columns, filename = "export" }) {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState(null);

  if (!data || !columns || data.length === 0) return null;

  // Fonction pour extraire la valeur d'une cellule
  const getCellValue = (row, column) => {
    // Si la colonne a un accessorKey direct
    if (column.accessorKey) {
      return row[column.accessorKey] || "";
    }
    
    // Si la colonne a une fonction cell
    if (column.cell) {
      try {
        // Simuler l'objet info qu'attend la fonction cell
        const info = {
          row: { original: row },
          getValue: () => row[column.id] || ""
        };
        const result = column.cell(info);
        
        // Si c'est un élément React, essayer d'extraire le texte
        if (React.isValidElement(result)) {
          // Pour les éléments simples avec du texte
          return result.props?.children || "";
        }
        
        return result || "";
      } catch (err) {
        console.warn("Erreur extraction cellule:", err);
        return "";
      }
    }
    
    // Sinon, utiliser l'id
    return row[column.id] || "";
  };

  // -------------------------------
  // EXPORT EXCEL
  // -------------------------------
  const exportExcel = async () => {
    setLoading(true);
    setExportType("excel");
    try {
      // Préparer les données pour Excel
      const headers = columns
        .filter(col => !col.id?.includes("select") && col.header !== "Actions")
        .map(col => col.header);
      
      const rows = data.map((row) => {
        const obj = {};
        columns.forEach((col) => {
          // Exclure les colonnes de sélection et actions
          if (col.id?.includes("select") || col.header === "Actions") return;
          
          const key = col.header;
          obj[key] = getCellValue(row, col);
        });
        return obj;
      });

      const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Membres");
      
      // Ajuster la largeur des colonnes
      const maxWidth = headers.reduce((acc, header) => {
        acc[header] = { wch: Math.max(header.length, 15) };
        return acc;
      }, {});
      ws["!cols"] = Object.values(maxWidth);
      
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Erreur export Excel:", error);
      alert("Erreur lors de l'export Excel");
    } finally {
      setLoading(false);
      setExportType(null);
    }
  };

  // -------------------------------
  // EXPORT PDF
  // -------------------------------
  const exportPDF = async () => {
    setLoading(true);
    setExportType("pdf");
    try {
      const doc = new jsPDF("p", "mm", "a4");
      
      // Titre
      doc.setFontSize(16);
      doc.text("Liste des Membres", 14, 15);
      doc.setFontSize(10);
      doc.text(`Export du ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);
      
      // Préparer les données pour le PDF
      const headers = columns
        .filter(col => !col.id?.includes("select") && col.header !== "Actions" && col.header !== "Photo")
        .map(col => col.header);
      
      const body = data.map(row => 
        columns
          .filter(col => !col.id?.includes("select") && col.header !== "Actions" && col.header !== "Photo")
          .map(col => {
            const value = getCellValue(row, col);
            // Nettoyer les valeurs pour le PDF
            return typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value;
          })
      );

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 30,
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 30 },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 30 }, // Nom
          1: { cellWidth: 25 }, // Prénom
          2: { cellWidth: 20 }, // Genre
          3: { cellWidth: 25 }, // Statut
        }
      });

      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erreur export PDF:", error);
      alert("Erreur lors de l'export PDF");
    } finally {
      setLoading(false);
      setExportType(null);
    }
  };

  // -------------------------------
  // EXPORT CSV (simplifié)
  // -------------------------------
  const exportCSV = () => {
    setLoading(true);
    try {
      const headers = columns
        .filter(col => !col.id?.includes("select") && col.header !== "Actions" && col.header !== "Photo")
        .map(col => col.header);
      
      const csvContent = [
        headers.join(";"),
        ...data.map(row => 
          columns
            .filter(col => !col.id?.includes("select") && col.header !== "Actions" && col.header !== "Photo")
            .map(col => {
              const value = getCellValue(row, col);
              // Échapper les guillemets et points-virgules pour CSV
              const escaped = String(value || "").replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(";")
        )
      ].join("\n");
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erreur export CSV:", error);
      alert("Erreur lors de l'export CSV");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // IMPRIMER
  // -------------------------------
  const printPage = () => {
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimer - ${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Liste des Membres</h1>
          <p>Export du ${new Date().toLocaleDateString('fr-FR')}</p>
          <table>
            <thead>
              <tr>
                ${columns
                  .filter(col => !col.id?.includes("select") && col.header !== "Actions" && col.header !== "Photo")
                  .map(col => `<th>${col.header}</th>`)
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${columns
                    .filter(col => !col.id?.includes("select") && col.header !== "Actions" && col.header !== "Photo")
                    .map(col => {
                      const value = getCellValue(row, col);
                      return `<td>${typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value}</td>`;
                    })
                    .join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Imprimer
          </button>
          <button class="no-print" onclick="window.close()" style="margin-top: 20px; margin-left: 10px; padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Fermer
          </button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* EXCEL */}
      <button
        onClick={exportExcel}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded text-white text-sm font-medium transition-colors
          ${loading && exportType === "excel" 
            ? "bg-green-400 cursor-not-allowed" 
            : "bg-green-600 hover:bg-green-700"}`}
        title="Exporter en Excel"
      >
        {loading && exportType === "excel" ? (
          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
        ) : (
          <DocumentArrowDownIcon className="w-4 h-4" />
        )}
        Excel
      </button>

      {/* PDF */}
      <button
        onClick={exportPDF}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded text-white text-sm font-medium transition-colors
          ${loading && exportType === "pdf" 
            ? "bg-red-400 cursor-not-allowed" 
            : "bg-red-600 hover:bg-red-700"}`}
        title="Exporter en PDF"
      >
        {loading && exportType === "pdf" ? (
          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
        ) : (
          <DocumentArrowDownIcon className="w-4 h-4" />
        )}
        PDF
      </button>

      {/* CSV */}
      <button
        onClick={exportCSV}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded text-white text-sm font-medium transition-colors
          ${loading && exportType === "csv" 
            ? "bg-blue-400 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-700"}`}
        title="Exporter en CSV"
      >
        {loading && exportType === "csv" ? (
          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
        ) : (
          <DocumentArrowDownIcon className="w-4 h-4" />
        )}
        CSV
      </button>

      {/* IMPRIMER */}
      <button
        onClick={printPage}
        className="flex items-center gap-2 px-3 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
        title="Imprimer"
      >
        <PrinterIcon className="w-4 h-4" />
        Imprimer
      </button>
    </div>
  );
}
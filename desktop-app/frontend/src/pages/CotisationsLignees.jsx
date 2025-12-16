// frontend/src/pages/Cotisations.jsx
import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import DetailsPanel from "../components/DetailsPanel";
import Modal from "../components/Modal";
import ActionsInline from "../components/ActionsInline";

import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api";
import CotisationForm from "../components/CotisationForm";

import { HiPlus, HiPencilSquare } from "react-icons/hi2";
import { MdDelete } from "react-icons/md";

import FilterBar from "../components/filters/FilterBar";
import ExportButtons from "../components/filters/ExportButton";

import jsPDF from "jspdf";
import "jspdf-autotable";



// ------------------------------------------------------
// PAGE COTISATIONS DES LIGNESS
// ------------------------------------------------------
export default function Cotisations() {

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contributions de familles</h1>
      </div>      
    </div>
  );
}


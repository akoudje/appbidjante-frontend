// src/components/DataTable.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/solid";

/**  
 * DataTable Light – version claire adaptée au thème Village Bidjanté  
 */
export default function DataTable({
  columns,
  data,
  onRowClick = null,
  getRowClassName = null,
  searchable = false,
  searchPlaceholder = "Rechercher...",
  actions = null,
  tableId = "default_table",
  enableCompactToggle = false,
  compact: compactProp = undefined,
}) {
  const tableRef = useRef(null);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [isCompactLocal, setIsCompactLocal] = useState(false);
  const compact = typeof compactProp === "boolean" ? compactProp : isCompactLocal;

  /** TABLE INIT **/
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: "onChange",
    globalFilterFn: "includesString",
  });

  /** LOCAL STORAGE **/
  const storageKey = `datatable:sizing:${tableId}`;

  const saveSizing = useCallback(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(table.getState().columnSizing ?? {})
      );
    } catch {}
  }, [table, storageKey]);

  const loadSizing = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      table.setColumnSizing(JSON.parse(raw));
    } catch {}
  }, [table, storageKey]);

  useEffect(() => {
    loadSizing();
    const finish = () => setTimeout(saveSizing, 50);
    document.addEventListener("mouseup", finish);
    return () => document.removeEventListener("mouseup", finish);
  }, [loadSizing, saveSizing]);

  /** AUTO-FIT **/
  const measureColumnWidth = useCallback(
    (colId) => {
      if (!tableRef.current) return null;
      const cells = tableRef.current.querySelectorAll(`[data-col="${colId}"]`);
      let max = 0;
      cells.forEach((c) => (max = Math.max(max, c.scrollWidth + 24)));
      return max;
    },
    [tableRef]
  );

  const autoFit = useCallback(
    (header) => {
      const colId = header.id;
      const w = measureColumnWidth(colId);
      if (!w) return;
      table.setColumnSizing((old) => ({ ...old, [colId]: w }));
      setTimeout(saveSizing, 50);
    },
    [measureColumnWidth, saveSizing, table]
  );

  /** STYLE **/
  const padding = compact ? "px-3 py-2" : "px-4 py-3";
  const textSize = compact ? "text-sm" : "text-base";

  return (
    <div ref={tableRef} className="w-full space-y-4">


      {/* TABLE WRAPPER */}
      <div className="border border-amber-200 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="sticky top-0 bg-gradient-to-r from-amber-400 to-amber-400 
                            text-gray-900 shadow-sm z-10">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id} className="border-b border-amber-400">
                  {group.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const colDef = header.column.columnDef;
                    const align = colDef.align || "left";

                    return (
                      <th
                        key={header.id}
                        style={{ width: header.getSize(), textAlign: align }}
                        className={`relative select-none ${padding} font-semibold 
                                  ${colDef.disableSort
                                    ? "text-gray-700"
                                    : "cursor-pointer text-gray-900 hover:bg-amber-100/70"
                                  } transition-colors duration-150`}
                        onClick={
                          colDef.disableSort
                            ? undefined
                            : header.column.getToggleSortingHandler()
                        }
                        data-col={header.id}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{flexRender(colDef.header, header.getContext())}</span>

                          {!colDef.disableSort && (
                            sorted === "asc" ? (
                              <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                            ) : sorted === "desc" ? (
                              <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ArrowsUpDownIcon className="w-4 h-4 text-black" />
                            )
                          )}
                        </div>

                        {/* Resize handle */}
                        {header.column.getCanResize() && (
                          <div
                            onDoubleClick={() => autoFit(header)}
                            onMouseDown={header.getResizeHandler()}
                            className={`absolute right-0 top-0 h-full w-1 cursor-col-resize 
                                     ${header.column.getIsResizing()
                                ? "bg-amber-400"
                                : "bg-amber-200/50 hover:bg-amber-300/600"
                              } transition-colors duration-150`}
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-amber-100 bg-white">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-12 text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-amber-100 
                                    flex items-center justify-center">
                        <svg className="w-8 h-8 text-amber-400" 
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          Aucune donnée disponible
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Essayez de modifier vos filtres de recherche
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const rowData = row.original;
                  const highlightClass = getRowClassName?.(rowData);

                  return (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick?.(rowData)}
                      className={`
                        hover:bg-gradient-to-r hover:from-amber-200/50 hover:to-orange-200/50 
                        ${onRowClick ? "cursor-pointer" : "cursor-default"}
                        ${textSize}
                        ${highlightClass || ""}
                        transition-all duration-150
                      `}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const colDef = cell.column.columnDef;
                        const align = colDef.align || "left";

                        return (
                          <td
                            key={cell.id}
                            style={{ textAlign: align }}
                            className={`${padding} align-middle text-gray-800 
                                      border-t border-orange-300/50 first:border-l-0 last:border-r-0`}
                            data-col={cell.column.id}
                          >
                            {flexRender(colDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-1 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700 font-medium">
            Afficher :
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border border-amber-300 px-3 py-1.5 rounded-lg text-sm 
                     bg-white text-gray-900
                     focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none
                     transition-all duration-200 shadow-sm"
          >
            {[15, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1.5 border border-amber-300 rounded-lg text-sm font-medium
                       bg-white text-gray-700
                       hover:bg-amber-50
                       disabled:opacity-40 disabled:cursor-not-allowed
                       disabled:hover:bg-white
                       transition-all duration-200 shadow-sm"
            >
              «
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1.5 border border-amber-300 rounded-lg text-sm font-medium
                       bg-white text-gray-700
                       hover:bg-amber-50
                       disabled:opacity-40 disabled:cursor-not-allowed
                       disabled:hover:bg-white
                       transition-all duration-200 shadow-sm"
            >
              Précédent
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 px-2">
              Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1.5 border border-amber-300 rounded-lg text-sm font-medium
                       bg-white text-gray-700
                       hover:bg-amber-50
                       disabled:opacity-40 disabled:cursor-not-allowed
                       disabled:hover:bg-white
                       transition-all duration-200 shadow-sm"
            >
              Suivant
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1.5 border border-amber-300 rounded-lg text-sm font-medium
                       bg-white text-gray-700
                       hover:bg-amber-50
                       disabled:opacity-40 disabled:cursor-not-allowed
                       disabled:hover:bg-white
                       transition-all duration-200 shadow-sm"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
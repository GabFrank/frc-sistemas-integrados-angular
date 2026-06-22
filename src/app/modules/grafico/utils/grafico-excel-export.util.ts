import {
  dateToString,
  formatearFechaGrafico,
} from "../../../commons/core/utils/dateUtils";
import { PeriodoGraficoInput } from "./grafico-periodo.model";
import { MESES_GRAFICO } from "../../../shared/constants/grafico.constants";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { GraficoFiltrosPeriodo } from "./grafico-filtro-rango-fechas.helper";
import { EtiquetasFiltroGraficoExcel, GraficoExcelTipo } from "./grafico-excel-export.model";

export function etiquetasFiltroPeriodoGrafico(
  filtro: GraficoFiltrosPeriodo
): EtiquetasFiltroGraficoExcel {
  const anhos = filtro.normalizarAnhosSeleccionados().join(", ");
  const mesesSel = filtro.mesControl.value ?? [];
  let meses = "—";
  if (filtro.tieneMesesSeleccionados(mesesSel)) {
    if (mesesSel.includes(0)) {
      meses = "Todas";
    } else {
      meses = mesesSel
        .map(
          (m) =>
            MESES_GRAFICO.find((opt) => opt.valor === m)?.nombre ?? String(m)
        )
        .join(", ");
    }
  }
  const rango = filtro.obtenerRangoDiasSiAplica();
  let rangoDias = "—";
  if (rango) {
    const ini = rango.inicio.slice(0, 10);
    const fin = rango.fin.slice(0, 10);
    rangoDias = ini === fin ? ini : `${ini} – ${fin}`;
  }
  return { filtroAnhos: anhos, filtroMeses: meses, filtroRangoDias: rangoDias };
}

export function etiquetaSucursalesSeleccionadas(
  sucursales: Sucursal[],
  sucIds: number[] | null | undefined
): string {
  if (!sucIds?.length) {
    return "Todas";
  }
  const nombres = sucIds
    .map((id) => sucursales.find((s) => s.id === id)?.nombre ?? String(id))
    .filter(Boolean);
  return nombres.length ? nombres.join(", ") : "—";
}

export function descargarExcelBase64(base64: string, nombreBase: string): void {
  if (!base64) {
    return;
  }
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nombreBase}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function periodosComparacionHoyAyer(): PeriodoGraficoInput[] {
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  return [
    {
      etiqueta: "Ayer",
      inicio: formatearFechaGrafico(ayer),
      fin: formatearFechaGrafico(ayer),
    },
    {
      etiqueta: "Hoy",
      inicio: formatearFechaGrafico(hoy),
      fin: formatearFechaGrafico(hoy),
    },
  ];
}

export function nombreArchivoGraficoExcel(tipo: GraficoExcelTipo): string {
  const slug = tipo.toLowerCase().replace(/_/g, "-");
  const fecha = dateToString(new Date(), "yyyy-MM-dd");
  return `${slug}-${fecha}`;
}

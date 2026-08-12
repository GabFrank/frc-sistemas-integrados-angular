import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Conteo } from "../conteo.model";

export class HistorialConteoData {
  /** Version vigente del conteo, la que quedo despues de la correccion. */
  conteoActual: Conteo;
  /** Version que fue reemplazada. */
  conteoAnterior: Conteo;
  apertura: boolean;
}

/** Una denominacion con lo que decia antes y lo que dice ahora. */
export interface FilaComparacion {
  denominacion: string;
  valor: number;
  cantidadAnterior: number;
  cantidadActual: number;
  diferencia: number;
}

export interface TotalComparacion {
  denominacion: string;
  simbolo: string;
  decimales: string;
  anterior: number;
  actual: number;
  diferencia: number;
}

const MONEDAS = [
  { denominacion: "GUARANI", simbolo: "Gs", decimales: "1.0-0" },
  { denominacion: "REAL", simbolo: "R$", decimales: "1.2-2" },
  { denominacion: "DOLAR", simbolo: "U$", decimales: "1.2-2" },
];

@Component({
  selector: "app-historial-conteo-dialog",
  templateUrl: "./historial-conteo-dialog.component.html",
  styleUrls: ["./historial-conteo-dialog.component.scss"],
})
export class HistorialConteoDialogComponent implements OnInit {

  titulo: string;
  filas: FilaComparacion[] = [];
  totales: TotalComparacion[] = [];
  editadoPor: string;
  editadoEn: Date;
  hayCambios = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: HistorialConteoData,
    private dialogRef: MatDialogRef<HistorialConteoDialogComponent>
  ) { }

  ngOnInit(): void {
    this.titulo = this.data?.apertura ? "Conteo de apertura" : "Conteo de cierre";
    this.editadoPor = this.data?.conteoActual?.usuario?.persona?.nombre;
    this.editadoEn = this.data?.conteoActual?.creadoEn;
    this.armarComparacion();
  }

  /**
   * Cruza las denominaciones de ambas versiones. Una denominacion que solo existe en una de las
   * dos cuenta como cero en la otra: asi se ve tanto lo que se agrego como lo que se saco.
   */
  private armarComparacion() {
    const anterior = this.mapearPorBillete(this.data?.conteoAnterior);
    const actual = this.mapearPorBillete(this.data?.conteoActual);

    const claves = new Set<string>([...anterior.keys(), ...actual.keys()]);
    const filas: FilaComparacion[] = [];

    claves.forEach((clave) => {
      const fila = anterior.get(clave) || actual.get(clave);
      const cantidadAnterior = anterior.get(clave)?.cantidad || 0;
      const cantidadActual = actual.get(clave)?.cantidad || 0;
      filas.push({
        denominacion: fila.denominacion,
        valor: fila.valor,
        cantidadAnterior,
        cantidadActual,
        diferencia: cantidadActual - cantidadAnterior,
      });
    });

    const orden = MONEDAS.map((m) => m.denominacion);
    filas.sort((a, b) => {
      const porMoneda = orden.indexOf(a.denominacion) - orden.indexOf(b.denominacion);
      return porMoneda !== 0 ? porMoneda : b.valor - a.valor;
    });

    this.filas = filas;
    this.hayCambios = filas.some((f) => f.diferencia !== 0);
    this.armarTotales(filas);
  }

  private mapearPorBillete(conteo: Conteo) {
    const mapa = new Map<string, { denominacion: string; valor: number; cantidad: number }>();
    conteo?.conteoMonedaList?.forEach((cm) => {
      const valor = cm?.monedaBilletes?.valor;
      const denominacion = cm?.monedaBilletes?.moneda?.denominacion;
      if (valor == null || denominacion == null) return;
      mapa.set(`${denominacion}-${valor}`, {
        denominacion,
        valor,
        cantidad: cm.cantidad || 0,
      });
    });
    return mapa;
  }

  private armarTotales(filas: FilaComparacion[]) {
    this.totales = MONEDAS.map((moneda) => {
      const propias = filas.filter((f) => f.denominacion === moneda.denominacion);
      const anterior = propias.reduce((acc, f) => acc + f.valor * f.cantidadAnterior, 0);
      const actual = propias.reduce((acc, f) => acc + f.valor * f.cantidadActual, 0);
      return {
        denominacion: moneda.denominacion,
        simbolo: moneda.simbolo,
        decimales: moneda.decimales,
        anterior,
        actual,
        diferencia: actual - anterior,
      };
    }).filter((t) => t.anterior !== 0 || t.actual !== 0);
  }

  onCerrar() {
    this.dialogRef.close();
  }
}

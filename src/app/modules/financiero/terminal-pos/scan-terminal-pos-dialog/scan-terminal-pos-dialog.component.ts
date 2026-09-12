import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { debounceTime, distinctUntilChanged, filter, map, tap } from "rxjs/operators";
import { TerminalPos } from "../terminal-pos.model";
import { TerminalPosService } from "../terminal-pos.service";
import { DatosCupon, FormatoQrPos } from "../../venta-tarjeta/qr-pos/formato-qr-pos.model";
import { FormatoQrPosService } from "../../venta-tarjeta/qr-pos/formato-qr-pos.service";
import { DecimalesPorMoneda, ordenarPorProveedor, parsearCupon } from "../../venta-tarjeta/qr-pos/qr-pos-parser";

/**
 * Largo minimo antes de intentar la busqueda. El codigo mas corto en uso es del estilo
 * TPOS-XXX-00; buscar con uno o dos caracteres consultaria por prefijos que matchean varias
 * terminales (el filtro del backend usa LIKE) y podria confirmar la equivocada.
 */
const LARGO_MINIMO_CODIGO = 4;

export class AddTerminalPosData {
  terminalPos?: TerminalPos;
  /** Proveedor de la línea, para probar primero su formato al reconocer un cupón. */
  proveedorServicioId?: number;
  /** Decimales por moneda, para escalar importes en la menor unidad. */
  decimalesPorMoneda?: DecimalesPorMoneda;
}

export interface ScanTerminalPosResult {
  terminalPos: TerminalPos;
  /**
   * El cupón, cuando lo que se escaneó fue el cupón y no el código de la terminal.
   *
   * Cuando viene, el paso siguiente ya está hecho: quien abrió este diálogo puede aplicarlo sin
   * volver a pedir la lectura.
   */
  datosCupon?: DatosCupon;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-scan-terminal-pos-dialog",
  templateUrl: "./scan-terminal-pos-dialog.component.html",
  styleUrls: ["./scan-terminal-pos-dialog.component.scss"],
})
export class ScanTerminalPosDialogComponent implements OnInit {

  formGroup: FormGroup;

  codigoControl = new FormControl(null, Validators.required);
  selectedTerminalPos: TerminalPos = null;
  buscando = false;
  noEncontrado = false;

  /** Los formatos activos, para poder reconocer un cupón en el mismo input. */
  private formatos: FormatoQrPos[] = [];

  /**
   * Se escaneó un cupón cuya terminal no se pudo resolver. El input sigue esperando el código del
   * aparato, pero ahora se sabe que el cupón ya está leído.
   */
  cuponPendiente: DatosCupon = null;
  avisoCupon: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddTerminalPosData,
    private matDialogRef: MatDialogRef<ScanTerminalPosDialogComponent>,
    private terminalPosService: TerminalPosService,
    private formatoQrPosService: FormatoQrPosService
  ) {
    if (data?.terminalPos != null) {
      this.selectedTerminalPos = data.terminalPos;
      this.codigoControl.setValue(data.terminalPos.codigo);
    }
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      codigo: this.codigoControl
    });

    // Auto-búsqueda real. Antes este subscribe SOLO limpiaba el estado pese al comentario que
    // decía que auto-buscaba: lo único que confirmaba era el (ngSubmit) del form, o sea Enter.
    // Como el HTML tampoco tenía botón de confirmar, un lector sin sufijo CR dejaba al cajero
    // mirando el código en pantalla sin ninguna forma de seguir salvo cancelar. Funcionaba de
    // casualidad, porque los lectores del PDV mandan Enter al final.
    //
    // El debounce evita disparar una consulta por cada carácter que escupe el lector; 350 ms es
    // más que el tiempo entre teclas de un wedge y menos de lo que tarda una persona en notarlo.
    // Los formatos se traen del FILIAL, que es contra quien corre el PDV. Si no llegan, el input
    // sigue funcionando como siempre: sólo pierde la capacidad de reconocer un cupón.
    this.formatoQrPosService.onGetActivos()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => (this.formatos = ordenarPorProveedor(res || [], this.data?.proveedorServicioId)),
        error: () => (this.formatos = []),
      });

    this.codigoControl.valueChanges
      .pipe(
        tap(() => {
          this.selectedTerminalPos = null;
          this.noEncontrado = false;
        }),
        map((valor: string) => (valor || '').trim()),
        filter((valor: string) => valor.length >= LARGO_MINIMO_CODIGO),
        debounceTime(350),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe(() => this.onConfirmar());
  }

  onConfirmar() {
    if (this.formGroup.invalid) return;
    // La auto-busqueda y el boton (y el Enter del lector) llaman al mismo metodo: sin esta
    // guarda, un lector que manda CR dispara dos consultas para el mismo codigo.
    if (this.buscando) return;

    const codigo = this.codigoControl.value?.trim();

    // ⚠️ PRIMERO SE PRUEBA COMO CUPON, Y EL ORDEN ES LO QUE LO HACE SEGURO.
    //
    // Los patrones estan anclados con ^...$, asi que un codigo de terminal --`B1`, `TPOS-VPX-01`--
    // no puede matchear un patron de cupon: probar como cupon primero no tiene falsos positivos.
    // Al reves si los tendria, porque la busqueda de codigo usa LIKE y el prefijo de una cadena de
    // cupon podria matchear una terminal cualquiera.
    //
    // Esto es lo que saca el peaje del primer dialogo: el cajero escanea lo que tenga a mano --el
    // aparato o el cupon-- y el sistema decide que era.
    if (this.intentarComoCupon(codigo)) return;

    this.buscando = true;
    this.noEncontrado = false;

    // Los nulls del medio son `serie` y `sucursalId`: acá se busca por el codigo que el cajero
    // escanea, no por la serie del aparato ni por donde esté.
    this.terminalPosService.onFilter(null, codigo, null, null, true, 0, 1, false)
      .pipe(untilDestroyed(this))
      .subscribe((page: any) => {
        this.buscando = false;
        const resultados = page?.getContent ?? page?.data?.getContent ?? [];
        if (resultados.length > 0) {
          this.selectedTerminalPos = resultados[0];
          // Si ya se habia escaneado el cupon y faltaba la terminal, salen los dos juntos y el
          // paso siguiente ya no hace falta.
          const result: ScanTerminalPosResult = {
            terminalPos: this.selectedTerminalPos,
            datosCupon: this.cuponPendiente ?? undefined,
          };
          this.matDialogRef.close(result);
        } else {
          this.noEncontrado = true;
          this.selectedTerminalPos = null;
        }
      }, () => {
        this.buscando = false;
        this.noEncontrado = true;
      });
  }

  onCancel() {
    this.matDialogRef.close();
  }

  /**
   * Prueba la cadena como cupon. Devuelve `true` si lo era --y entonces ya se resolvio o se
   * informo-- y `false` si hay que seguir tratandola como codigo de terminal.
   */
  private intentarComoCupon(cadena: string): boolean {
    if (!this.formatos.length) return false;

    const r = parsearCupon(cadena, this.formatos, this.data?.decimalesPorMoneda);
    if (!r.ok || !r.datos) return false;

    this.cuponPendiente = r.datos;
    this.resolverTerminalDelCupon(r.datos);
    return true;
  }

  /**
   * Que terminal es, a partir del propio cupon.
   *
   * Los cupones ya traen el numero de aparato impreso --`Terminal:52287864` en Dinelco, `STONEID:`
   * en Stone-- y el mapeo puede capturarlo como `terminal`. Con la `serie` cargada en el ABM, eso
   * alcanza para saber de que maquina salio sin preguntarle nada al cajero.
   *
   * Si no se puede resolver, NO se inventa: el cupon queda leido y el input sigue esperando el
   * codigo del aparato. Elegir la terminal equivocada seria peor que pedir un escaneo mas, porque
   * la conciliacion por terminal quedaria mal y nadie lo notaria.
   */
  private resolverTerminalDelCupon(datos: DatosCupon): void {
    const serie = datos?.terminal;
    if (!serie) {
      this.avisoCupon = 'Leí el cupón. Ahora escaneá el código de la terminal para saber de qué '
        + 'aparato salió.';
      return;
    }

    this.buscando = true;
    // Se busca por SERIE, que es el identificador que el cupon imprime — distinto de `codigo`,
    // que es la etiqueta interna que el cajero escanea.
    this.terminalPosService.onFilter(null, null, String(serie), null, true, 0, 2, false)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (page: any) => {
          this.buscando = false;
          const resultados = page?.getContent ?? page?.data?.getContent ?? [];
          if (resultados.length === 1) {
            this.selectedTerminalPos = resultados[0];
            this.matDialogRef.close({
              terminalPos: this.selectedTerminalPos,
              datosCupon: datos,
            } as ScanTerminalPosResult);
            return;
          }
          // Cero o mas de una: no se elige por el cajero. Con `LIKE` de por medio, dos coincidencias
          // significan que la serie de una es prefijo de la otra, y adivinar ahi es cobrar contra la
          // maquina equivocada.
          this.avisoCupon = resultados.length === 0
            ? `Leí el cupón, y dice que salió de la máquina "${serie}", que no está registrada. `
              + 'Escaneá el código de la terminal.'
            : `Leí el cupón, pero "${serie}" coincide con más de una terminal. `
              + 'Escaneá el código de la que corresponde.';
        },
        error: () => {
          this.buscando = false;
          this.avisoCupon = 'Leí el cupón. Escaneá el código de la terminal para continuar.';
        },
      });
  }
}

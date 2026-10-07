import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { debounceTime, distinctUntilChanged, filter, map, tap } from "rxjs/operators";
import { TerminalPos } from "../terminal-pos.model";
import { TerminalPosService } from "../terminal-pos.service";
import { DatosCupon, FormatoQrPos } from "../../venta-tarjeta/qr-pos/formato-qr-pos.model";
import { FormatoTerminalPosService } from "../../venta-tarjeta/qr-pos/formato-terminal-pos/formato-terminal-pos.service";
import { TIPO_WEB } from "../../venta-tarjeta/qr-pos/formato-terminal-pos/formato-terminal-pos.model";
import { VentaTarjetaService } from "../../venta-tarjeta/venta-tarjeta.service";
import { DecimalesPorMoneda, ordenarPorProveedor, parsearCupon } from "../../venta-tarjeta/qr-pos/qr-pos-parser";
import { LectorTecladoDirective } from "../../../../shared/lector-teclado/lector-teclado.directive";
import { lecturasAProbar } from "../../../../shared/lector-teclado/teclado-lector";

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
  /** Sucursal del cobro. Acota el chequeo de cupon ya usado, que es por sucursal. */
  sucursalId?: number;
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
  /** La búsqueda de la terminal falló (sin conexión, rechazo): distinto de «no existe». */
  errorConsulta = false;

  /** Los formatos activos, para poder reconocer un cupón en el mismo input. */
  private formatos: FormatoQrPos[] = [];

  /**
   * Se escaneó un cupón cuya terminal no se pudo resolver. El input sigue esperando el código del
   * aparato, pero ahora se sabe que el cupón ya está leído.
   */
  cuponPendiente: DatosCupon = null;
  avisoCupon: string = null;

  /** Desde `beforeClosed`: el dialogo se esta yendo y el foco ya no se pelea (ver `onBlurCodigo`). */
  private cerrando = false;

  /**
   * Las teclas fisicas de lo escaneado. Con Windows en español el lector (tabla EE.UU.) llega con
   * el `*` del cupon como `(` y el `-` de `POS-001` como `'`: esto ofrece la cadena que mando.
   */
  @ViewChild(LectorTecladoDirective) private lector: LectorTecladoDirective;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddTerminalPosData,
    private matDialogRef: MatDialogRef<ScanTerminalPosDialogComponent>,
    private terminalPosService: TerminalPosService,
    private formatoTerminalPosService: FormatoTerminalPosService,
    private ventaTarjetaService: VentaTarjetaService
  ) {
    // La terminal que la linea ya tiene se RECUERDA, pero no se escribe en el input.
    //
    // Antes se precargaba `codigo` ahi, y ese texto era lo unico que le decia al cajero con que
    // maquina estaba trabajando --el template no la mostraba en ningun lado--. El precio era alto:
    // ese mismo campo es donde entra el proximo escaneo, el lector es keyboard-wedge y escribe
    // donde esta el cursor, asi que al reabrir el dialogo por "Escanear otro" el cupon se
    // CONCATENABA al codigo (`VP-CAJA1FRCP1*...`). Esa cadena no matchea ningun patron --estan
    // anclados con ^-- ni encuentra terminal por codigo: el cajero escaneaba un cupon bueno y
    // recibia un error ajeno, sin nada que le dijera que habia que borrar el campo a mano.
    // Medido el 2026-09-17 en la app en vivo.
    //
    // Ahora la terminal se muestra como texto (ver el template) y el campo queda libre. Cancelar
    // sigue dejando la linea como estaba, que es la forma de conservarla sin volver a escanear.
    if (data?.terminalPos != null) {
      this.selectedTerminalPos = data.terminalPos;
    }
  }

  ngOnInit(): void {
    this.matDialogRef.beforeClosed().pipe(untilDestroyed(this)).subscribe(() => (this.cerrando = true));

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
    //
    // ⚠️ De `formato_terminal_pos`, el del ABM — NO de `formato_qr_pos`. Ver el comentario largo en
    // `escanear-cupon-dialog`: hasta el 2026-09-16 esto leía la tabla legacy y el patrón que el
    // administrador editaba no era el que el PDV usaba para leer. El filtro por tipo tampoco es
    // cosmético: los patrones MAQUINA son de texto OCR, llenos de `[\s\S]*`, y en la misma bolsa
    // podrían matchear una cadena de QR.
    this.formatoTerminalPosService.onGetActivos(false)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => (this.formatos = ordenarPorProveedor(
          (res || []).filter((f: any) => f?.tipo === TIPO_WEB), this.data?.proveedorServicioId)),
        error: () => (this.formatos = []),
      });

    this.codigoControl.valueChanges
      .pipe(
        tap(() => {
          this.selectedTerminalPos = null;
          this.noEncontrado = false;
          this.errorConsulta = false;
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
    const alternativa = this.lector?.alternativa();

    // ⚠️ PRIMERO SE PRUEBA COMO CUPON, Y EL ORDEN ES LO QUE LO HACE SEGURO.
    //
    // Los patrones estan anclados con ^...$, asi que un codigo de terminal --`B1`, `TPOS-VPX-01`--
    // no puede matchear un patron de cupon: probar como cupon primero no tiene falsos positivos.
    // Al reves si los tendria, porque la busqueda de codigo usa LIKE y el prefijo de una cadena de
    // cupon podria matchear una terminal cualquiera.
    //
    // Esto es lo que saca el peaje del primer dialogo: el cajero escanea lo que tenga a mano --el
    // aparato o el cupon-- y el sistema decide que era.
    if (this.intentarComoCupon(codigo, alternativa)) return;

    this.buscando = true;
    this.noEncontrado = false;
    this.errorConsulta = false;
    this.buscarTerminal(lecturasAProbar(codigo, alternativa));
  }

  /**
   * Busca la terminal por la primera lectura y, si no aparece, por la siguiente. La segunda es la
   * cadena rearmada desde las teclas fisicas: primero va lo que tipeo Windows, que es lo que tipea
   * un cajero a mano.
   */
  private buscarTerminal(lecturas: string[]): void {
    const [codigo, ...resto] = lecturas;
    // Los nulls del medio son `serie` y `sucursalId`: acá se busca por el codigo que el cajero
    // escanea, no por la serie del aparato ni por donde esté.
    this.terminalPosService.onFilter(null, codigo, null, null, true, 0, 1, false)
      .pipe(untilDestroyed(this))
      .subscribe((page: any) => {
        // null = la consulta fue rechazada: no es «no existe una terminal con ese código».
        if (page == null) { this.buscando = false; this.errorConsulta = true; return; }
        const resultados = page?.getContent ?? page?.data?.getContent ?? [];
        if (resultados.length === 0 && resto.length > 0) {
          this.buscarTerminal(resto);
          return;
        }
        this.buscando = false;
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
        this.errorConsulta = true;
      });
  }

  onCancel() {
    this.matDialogRef.close();
  }

  /**
   * Prueba la cadena como cupon. Devuelve `true` si lo era --y entonces ya se resolvio o se
   * informo-- y `false` si hay que seguir tratandola como codigo de terminal.
   */
  private intentarComoCupon(cadena: string, alternativa?: string | null): boolean {
    if (!this.formatos.length) return false;

    const r = parsearCupon(cadena, this.formatos, this.data?.decimalesPorMoneda, alternativa);
    if (!r.ok || !r.datos) return false;

    // Si se leyo por la rearmada, el campo pasa a mostrarla: el cajero ve lo que se uso, no los
    // `(` que tipeo Windows.
    if (r.datos.qrCrudo !== cadena) {
      this.codigoControl.setValue(r.datos.qrCrudo, { emitEvent: false });
    }

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
      // Si el formato DECLARA `terminal` en su mapeo y el cupón no la trae, el cupón no es el que
      // el formato describe: una versión anterior del cupón, o el formato mal configurado. Eso es
      // un error y se dice como tal, no un paso más del flujo.
      //
      // Si el formato NO la declara, no hay nada mal: ese proveedor simplemente no imprime de qué
      // punto salió, y pedir la terminal es el camino normal.
      this.esperarTerminal(declaraTerminal(datos?.formato)
        ? 'Este cupón no trae el identificador de la terminal que el formato declara. '
          + 'Puede ser de una versión anterior del cupón.'
        : 'Leí el cupón. Ahora escaneá el código de la terminal para saber de qué aparato salió.');
      return;
    }

    this.buscando = true;
    // Busqueda EXACTA por serie --el identificador que el cupon imprime, distinto de `codigo`, que
    // es la etiqueta interna que el cajero escanea--.
    //
    // Exacta y no el filtro de la pantalla, que usa LIKE: este valor viene del propio cupon, texto
    // libre capturado por el regex, y se acepta SIN preguntarle nada al cajero cuando hay uno solo.
    // Un `%` o un `_` ahi adentro serian comodines de SQL: ensancharian la busqueda en silencio y
    // podrian resolver contra la maquina equivocada.
    this.terminalPosService.onGetPorSerie(String(serie), false)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: any) => {
          this.buscando = false;
          // null = consulta rechazada: no es «esa máquina no está registrada».
          if (res == null) {
            this.avisoCupon = 'Leí el cupón. Escaneá el código de la terminal para continuar.';
            return;
          }
          const resultados = res;
          if (resultados.length === 1) {
            this.selectedTerminalPos = resultados[0];
            this.cerrarSiElCuponSirve(datos);
            return;
          }
          // Cero o mas de una: no se elige por el cajero. Dos con la misma serie exacta significa
          // que estan cargadas bajo proveedores distintos --el unico caso que los indices permiten--
          // y adivinar ahi es cobrar contra la maquina equivocada.
          this.esperarTerminal(resultados.length === 0
            ? `Leí el cupón, y dice que salió de la máquina "${serie}", que no está registrada. `
              + 'Escaneá el código de la terminal.'
            : `Leí el cupón, pero "${serie}" coincide con más de una terminal. `
              + 'Escaneá el código de la que corresponde.');
        },
        error: () => {
          this.buscando = false;
          this.esperarTerminal('Leí el cupón. Escaneá el código de la terminal para continuar.');
        },
      });
  }

  /**
   * El cupón ya está leído y falta la terminal: el campo se vacía para el próximo escaneo.
   *
   * Antes quedaba con el texto del cupón, y el lector --keyboard-wedge, escribe donde está el
   * cursor-- pegaba el código de la terminal atrás (`FRCP1*…*202608271401POS-001`): ni terminal ni
   * cupón, y el cajero tenía que borrar a mano. Vacío, además, `LectorTecladoDirective` arranca un
   * registro nuevo y puede rearmar el `-` de `POS-001` si Windows lo tipeó como `'` (auditoría del
   * diff, 2026-10-05). `reset` y no `setValue('')`: ver `cerrarSiElCuponSirve`.
   */
  private esperarTerminal(aviso: string): void {
    this.avisoCupon = aviso;
    this.codigoControl.reset(null, { emitEvent: false });
    this.enfocarInput();
  }

  /**
   * Cierra con el cupón aplicado, salvo que ese cupón ya se haya usado.
   *
   * <b>Por qué acá y no después de cerrar.</b> Preguntarlo más adelante --cuando la línea de cobro
   * ya existe-- deja al cajero con el diálogo cerrado, un aviso suelto abajo, una línea pendiente
   * que él no pidió, y este mismo input precargado con el código de la terminal cuando lo reabre.
   * Cuatro pasos para deshacer algo que nunca debió pasar. Acá el cupón se rechaza donde se
   * escaneó: el aviso queda en el diálogo, el input se limpia y el lector puede disparar de nuevo.
   *
   * Es el mismo comportamiento que ya tenía la otra puerta (`escanear-cupon-dialog`), que muestra
   * el motivo en `errorLectura` y vacía su campo. Las dos puertas tienen que sentirse iguales.
   *
   * <b>Falla abierta</b>: si no se pudo preguntar --filial caído, red-- se sigue. La validación de
   * verdad corre igual al guardar, y bloquear un cobro porque no se pudo consultar sería peor que
   * el problema que esto resuelve.
   */
  private cerrarSiElCuponSirve(datos: DatosCupon): void {
    const cerrar = () => this.matDialogRef.close({
      terminalPos: this.selectedTerminalPos,
      // Ya se preguntó acá: quien recibe esto no necesita volver a consultar.
      datosCupon: { ...datos, verificado: true },
    } as ScanTerminalPosResult);

    this.buscando = true;
    this.ventaTarjetaService
      .onMotivoCuponNoUsable(
        datos.qrCrudo,
        datos.identificadorTransaccion,
        Number(this.data?.sucursalId),
        datos.codigoAutorizacion,
        this.selectedTerminalPos?.id != null ? Number(this.selectedTerminalPos.id) : undefined
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (motivo) => {
          this.buscando = false;
          if (!motivo) { cerrar(); return; }
          this.avisoCupon = motivo + ' Escaneá el cupón que corresponde a este cobro.';
          this.cuponPendiente = null;
          this.selectedTerminalPos = null;
          // `reset` y no `setValue('')`: vaciar el campo lo deja invalido Y tocado, asi que Material
          // apila "El codigo es obligatorio" encima del motivo real. Dos errores a la vez, y el
          // segundo tapa al primero siendo el menos util. `reset` lo devuelve a pristine.
          this.codigoControl.reset(null, { emitEvent: false });
          this.enfocarInput();
        },
        error: () => { this.buscando = false; cerrar(); },
      });
  }

  /**
   * Si el foco sale del input hacia FUERA del dialogo, vuelve.
   *
   * El lector es keyboard-wedge: escribe donde este el foco y termina con Enter. Si el foco quedaba
   * en el cobro de atras --el campo «valor» de pago-touch se lo robaba al abrir--, el Enter
   * finalizaba la venta sin terminal (farmacia filial 1: 116 de 631, 25 al 28/09/2026). Un foco que
   * va a un boton del propio dialogo (Cancelar, Confirmar) se respeta: es el cajero eligiendo.
   * Un click en el fondo del dialogo deja `relatedTarget` en null: tambien vuelve al input.
   */
  onBlurCodigo(event: FocusEvent): void {
    if (this.cerrando) return;
    const destino = event?.relatedTarget as HTMLElement | null;
    const contenedor = document.querySelector('app-scan-terminal-pos-dialog');
    if (destino && contenedor?.contains(destino)) return;
    this.enfocarInput();
  }

  /**
   * Deja el input listo para el proximo escaneo.
   *
   * `select()` ademas de `focus()`: si algun dia algo vuelve a dejar texto en el campo, el lector
   * --keyboard-wedge, escribe donde esta el cursor-- lo reemplaza en vez de concatenarse atras.
   * Sobre un campo vacio no hace nada.
   */
  private enfocarInput(): void {
    setTimeout(() => {
      // Si el dialogo ya se cerro, el input no existe y no hay nada que enfocar.
      const input = document.querySelector<HTMLInputElement>('app-scan-terminal-pos-dialog input');
      if (input && document.activeElement !== input) { input.focus(); input.select(); }
    });
  }

}

/**
 * Si el formato dice que sus cupones traen el identificador de la terminal.
 *
 * Es lo que separa «este proveedor no lo imprime» --normal, se pide la terminal-- de «este cupón no
 * es el que el formato describe» --error--. Sin esta distinción los dos casos se ven iguales en
 * pantalla y un cupón desactualizado pasa por configuración faltante.
 */
function declaraTerminal(formato?: FormatoQrPos): boolean {
  if (!formato?.mapeo) return false;
  try {
    return !!JSON.parse(formato.mapeo)?.terminal;
  } catch {
    return false;
  }
}

import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { MainService } from '../../../../main.service';
import { Presentacion } from '../../presentacion/presentacion.model';
import { TipoPrecio } from '../../tipo-precio/tipo-precio.model';
import { TipoPrecioService } from '../../tipo-precio/tipo-precio.service';
import { PrecioPorSucursalInput } from '../precio-por-sucursal-input.model';
import { PrecioPorSucursal } from '../precio-por-sucursal.model';
import { PrecioPorSucursalService } from '../precio-por-sucursal.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import {
  costoEnMonedaDelPrecio,
  evaluarMargenPrecio,
  MARGEN_MINIMO_PORCENTAJE,
} from '../margen-precio.util';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { ModuloMoneda } from '../../../financiero/moneda/configuracion-moneda-modulo/configuracion-moneda-modulo.model';
import { MonedaModuloService } from '../../../../shared/services/moneda-modulo.service';
import { CostoPorProductoService } from '../../../operaciones/costo-por-producto/costo-por-producto.service';
import { PrecioMonedaService } from '../precio-moneda.service';
import { debeMostrarSelectorMoneda, redondearMonto } from '../precio-moneda.util';

export class AdicionarPrecioPorSucursalData {
  precio: PrecioPorSucursal;
  presentacion: Presentacion;
  /** Costo medio del producto en la moneda de la empresa, por unidad base de stock. */
  costoMedio?: number;
  /** Producto de la presentación: para leer su costo en la moneda de costeo al evaluar el margen en otra moneda. */
  productoId?: number;
  /** El alta llega marcada como precio de promoción (viene del alta de una presentación promo). */
  promocion?: boolean;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { concat, defer, forkJoin, of } from 'rxjs';
import { catchError, take, toArray } from 'rxjs/operators';
import { ContextoConsulta, QueryError } from '../../../../generics/generic-crud.service';
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.constantes';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { esRechazoDelServidor } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esPrecioGuardable } from '../precio-guardable';

/** Lectura de precios antes de guardar: error de red y de servidor llegan acá (un solo aviso, el del diálogo). */
const LECTURA_PRECIOS: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_PRECIOS: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
/**
 * Valor de cierre cuando un guardado quedó sin confirmar (o a medias): no trae el precio, pero no es null,
 * así que quien abrió el diálogo recarga los precios de la presentación.
 */
export const PRECIO_SIN_CONFIRMAR = { sinConfirmar: true };

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-precio-dialog',
  templateUrl: './adicionar-precio-dialog.component.html',
  styleUrls: ['./adicionar-precio-dialog.component.scss']
})
export class AdicionarPrecioDialogComponent implements OnInit {
  formGroup: FormGroup;
  selectedPrecioPorSucursal: PrecioPorSucursal;
  precioControl = new FormControl(null, Validators.required);
  /** Id de la moneda del precio. Null = todavía no se resolvió (no se manda nada y el central usa la del módulo PRECIOS). */
  monedaControl = new FormControl<number | string | null>(null);
  principalControl = new FormControl(null);
  tipoPrecioControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(null);
  /**
   * Solo en el alta: precio de una promo (2x1, 3x2…). Nace inactivo, para que no rija en todas las sucursales, y
   * principal si es el primero de la presentación, porque las cajas sin tipos de precio cobran solo el principal.
   * Fuera del formGroup: no se guarda.
   */
  promocionControl = new FormControl(false);
  /** El toggle puso Principal en Sí: al desmarcarlo se deshace solo eso, no lo que eligió el usuario. */
  private principalPorPromocion = false;
  precioInput = new PrecioPorSucursalInput;
  isEditting = false;
  tipoPrecioList: TipoPrecio[];
  tiposPrecioFallo = false;

  // Moneda del precio (Fase 3). Con todo en la moneda de la empresa nada de esto se ve ni cambia.
  /** Monedas elegibles; vacía si no se pudieron leer (no hay selector). */
  monedaList: Moneda[] = [];
  /** Hay selector: más de una moneda y, en una edición, se pudo leer la moneda guardada. */
  mostrarSelectorMoneda = false;
  /** El precio se carga con máscara de la moneda (solo si no es la de la empresa; la de siempre es el campo plano). */
  usaMascaraMoneda = false;
  opcionesMascara: any = null;
  /** Símbolo de la moneda del precio, solo en otra moneda que la de la empresa. */
  simboloPrecio = '';
  /** Moneda de la empresa; null hasta resolverla. */
  private monedaEmpresa: Moneda | null = null;
  /** Moneda no-empresa con que el precio está guardado (edición); null = en la de la empresa o no se pudo leer. */
  private monedaGuardada: Moneda | null = null;
  /** En una edición, ¿se pudo leer la moneda guardada? Sin eso no se ofrece cambiarla. */
  private monedaGuardadaLeida = false;
  /** La moneda del módulo PRECIOS es la de la empresa (true hasta saber lo contrario: bodega no ve nada nuevo). */
  private monedaPreciosEsEmpresa = true;
  private cantidadPreciosOtraMoneda = 0;
  /** El campo del precio que esté a la vista (plano o enmascarado). */
  @ViewChild('precioInput') campoPrecio: ElementRef<HTMLInputElement>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarPrecioPorSucursalData,
    private matDialogRef: MatDialogRef<AdicionarPrecioDialogComponent>,
    private precioService: PrecioPorSucursalService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private tipoPrecioService: TipoPrecioService,
    private cargandoDialog: CargandoDialogService,
    private mainService: MainService,
    private dialogosService: DialogosService,
    private monedaModulo: MonedaModuloService,
    private monedaService: MonedaService,
    private precioMonedaService: PrecioMonedaService,
    private costoService: CostoPorProductoService
  ) {}

  ngOnInit(): void {
    this.createForm();

    this.tipoPrecioList = []

    this.loadTipoPrecios()
    this.cargarMoneda();

    if (this.data?.precio?.id != null) {
      this.cargarDato();
      this.formGroup.disable()
    } else {
      this.isEditting = true;
      if (this.data?.promocion === true) {
        this.promocionControl.setValue(true);
        this.onPromocionChange();
      }
    }
  }

  /** Pone el foco en el campo del precio (el de siempre o el enmascarado, según la moneda). */
  enfocarPrecio(): void {
    this.campoPrecio?.nativeElement?.focus();
  }

  /**
   * Resuelve la moneda del precio sin bloquear nada: todo son lecturas de fondo que pueden fallar, y
   * si fallan el diálogo es el de siempre (moneda de la empresa, sin selector).
   */
  private cargarMoneda(): void {
    this.monedaControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.actualizarMoneda());

    this.monedaModulo.empresa$.pipe(untilDestroyed(this)).subscribe((e) => {
      this.monedaEmpresa = e;
      this.actualizarMoneda();
    });

    this.monedaService.onGetAllEnSegundoPlano(true, { graphError: { show: false }, networkError: { show: false, propagate: true } })
      .pipe(take(1), untilDestroyed(this))
      .subscribe({
        next: (monedas) => {
          this.monedaList = (monedas || []).filter((m) => m?.activo !== false);
          this.actualizarMoneda();
        },
        error: () => {},
      });

    // Moneda del módulo PRECIOS (decide si se ofrece el selector y la moneda de un alta)
    this.monedaModulo.monedaDe(ModuloMoneda.PRECIOS).pipe(take(1), untilDestroyed(this)).subscribe((m) => {
      this.monedaPreciosEsEmpresa = this.monedaModulo.esMonedaEmpresa(m);
      if (this.data?.precio?.id == null) this.monedaControl.setValue(m.id, { emitEvent: true });
      this.actualizarMoneda();
    });

    // El mapa de precios en otra moneda (una lectura única del central, en caché). Sin él (falló o todavía no
    // llegó) un precio editado se trata como de la empresa y no se ofrece cambiar su moneda.
    this.precioMonedaService.asegurarMapaCentral();
    this.precioMonedaService.mapaCentral$.pipe(untilDestroyed(this)).subscribe((m) => {
      this.cantidadPreciosOtraMoneda = m.mapa.size;
      if (this.data?.precio?.id != null && m.estado === 'ok' && !this.monedaGuardadaLeida) {
        this.monedaGuardadaLeida = true;
        const guardada = m.mapa.get(String(this.data.precio.id)) ?? null;
        if (guardada != null && !this.monedaModulo.esMonedaEmpresa(guardada)) {
          this.monedaGuardada = guardada;
          this.monedaControl.setValue(guardada.id);
        } else if (this.monedaEmpresa?.id != null) {
          this.monedaControl.setValue(this.monedaEmpresa.id);
        }
      }
      this.actualizarMoneda();
    });
  }

  /** La moneda elegida; null si no hay selección (se trata como la de la empresa). */
  private monedaElegida(): Moneda | null {
    const id = this.monedaControl.value;
    if (id == null) return null;
    return this.monedaList.find((m) => String(m.id) === String(id))
      ?? (this.monedaGuardada && String(this.monedaGuardada.id) === String(id) ? this.monedaGuardada : null)
      ?? (this.monedaEmpresa && String(this.monedaEmpresa.id) === String(id) ? this.monedaEmpresa : null);
  }

  private esMonedaDeLaEmpresa(m: Moneda | null): boolean {
    return m == null || this.monedaModulo.esMonedaEmpresa(m);
  }

  private actualizarMoneda(): void {
    const elegida = this.monedaElegida();
    const otra = !this.esMonedaDeLaEmpresa(elegida);
    this.usaMascaraMoneda = otra;
    this.simboloPrecio = otra ? (elegida?.simbolo || '') : '';
    this.opcionesMascara = otra ? this.monedaService.currencyOptionsMontoPositivo(elegida, { allowZero: true }) : null;
    const hayEleccion = this.monedaList.length > 1 || this.monedaGuardada != null;
    this.mostrarSelectorMoneda = hayEleccion
      && (this.data?.precio?.id == null || this.monedaGuardadaLeida)
      && debeMostrarSelectorMoneda(this.monedaPreciosEsEmpresa, this.cantidadPreciosOtraMoneda, this.monedaGuardada != null);
  }

  /** Mínimo guardable: 1 en la moneda de la empresa (como siempre); el centavo de la moneda en otra con decimales. */
  private minimoPrecio(): number {
    const m = this.monedaElegida();
    if (this.esMonedaDeLaEmpresa(m)) return 1;
    return m.decimales > 0 ? Math.pow(10, -m.decimales) : 1;
  }

  /**
   * El `monedaId` a mandar, o undefined (la clave NO viaja). Un central viejo rechaza el input entero si
   * llega una clave que no conoce, así que solo viaja si el usuario eligió una moneda distinta de la de
   * la empresa, o si el precio ya la tenía guardada (para poder volver a la de la empresa).
   */
  private monedaIdParaGuardar(): number | undefined {
    const elegida = this.monedaElegida();
    if (elegida == null) return undefined;
    if (!this.esMonedaDeLaEmpresa(elegida) || this.monedaGuardada != null) return Number(elegida.id);
    return undefined;
  }

  onPromocionChange() {
    if (this.promocionControl.value === true) {
      this.activoControl.setValue(false);
      this.activoControl.disable();
      // Principal solo si es el primer precio de la presentación: con otros precios, guardar un principal baja al
      // anterior y la presentación quedaría sin principal activo. Ahí lo decide el usuario.
      this.principalPorPromocion = !(this.data?.presentacion?.precios?.length > 0) && this.principalControl.value !== true;
      if (this.principalPorPromocion) this.principalControl.setValue(true);
    } else {
      this.activoControl.enable();
      this.activoControl.setValue(true);
      if (this.principalPorPromocion) this.principalControl.setValue(false);
      this.principalPorPromocion = false;
    }
  }

  /** Botón del pie: en modo ver pasa a editar; editando, guarda. Solo el paso a editar habilita el formulario. */
  onBotonPrincipal() {
    if (this.isEditting) {
      this.onSave();
      return;
    }
    this.isEditting = true;
    this.formGroup.enable();
  }

  /** El toggle solo existe en el alta. */
  private esPromocion(): boolean {
    return this.precioInput.id == null && this.promocionControl.value === true;
  }

  loadTipoPrecios(){
    this.tiposPrecioFallo = false;
    this.tipoPrecioService.onGetAllTipoPrecios(true, PROPAGAR_ERROR_DE_RED, CONSULTA_PRECIOS).pipe(untilDestroyed(this)).subscribe({ error: () => {
      this.tiposPrecioFallo = true;
      this.notificacionSnackBar.openWarn('No se pudieron cargar los tipos de precio: usá «Reintentar».', 5);
    }, next: res => {
      if(res!=null){
        this.tipoPrecioList = res;
      } else {
        this.tiposPrecioFallo = true; // error del servidor: ya se avisó
      }
    } })
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("precio", this.precioControl);
    this.formGroup.addControl("principal", this.principalControl);
    this.formGroup.addControl("activo", this.activoControl);
    this.formGroup.addControl("tipoPrecio", this.tipoPrecioControl);
    this.formGroup.addControl("moneda", this.monedaControl);

    this.principalControl.setValue(false);
    this.activoControl.setValue(true);
  }

  cargarDato() {
    this.selectedPrecioPorSucursal = this.data.precio;
    this.precioControl.setValue(this.selectedPrecioPorSucursal.precio);
    this.principalControl.setValue(this.selectedPrecioPorSucursal.principal);
    this.activoControl.setValue(this.selectedPrecioPorSucursal.activo);
    
    if (this.selectedPrecioPorSucursal.tipoPrecio && this.selectedPrecioPorSucursal.tipoPrecio.id) {
      this.tipoPrecioControl.setValue(this.selectedPrecioPorSucursal.tipoPrecio.id);
    }

    this.precioInput.id = this.selectedPrecioPorSucursal.id;

    console.log('Tipo precio cargado:', this.tipoPrecioControl.value);
  }

  onSave() {
    if (!this.formGroup.valid) {
      this.notificacionSnackBar.notification$.next({
        texto: "Por favor complete todos los campos obligatorios",
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }
    if (this.precioSinValor()) return;

    this.precioInput.precio = this.precioControl.value;
    // El toggle manda: un precio de promoción no se guarda activo aunque el toggle se haya habilitado
    this.precioInput.activo = this.esPromocion() ? false : this.activoControl.value;
    this.precioInput.principal = this.principalControl.value;
    this.precioInput.presentacionId = this.data.presentacion.id;
    this.precioInput.tipoPrecioId = this.tipoPrecioControl.value;
    const monedaId = this.monedaIdParaGuardar();
    if (monedaId !== undefined) this.precioInput.monedaId = monedaId;
    else delete this.precioInput.monedaId;

    if (this.precioInput.id == null) {
      this.precioService.onGetPrecioPorSurursalPorPresentacionId(this.data.presentacion.id, true, LECTURA_PRECIOS, CONSULTA_PRECIOS)
        .pipe(untilDestroyed(this))
        .subscribe({ error: () => this.avisarPreciosSinLeer(), next: (preciosExistentes: PrecioPorSucursal[]) => {
          if (preciosExistentes == null) {
            // Sin precios llega []: un null es un fallo, no «no existe ese tipo»
            this.avisarPreciosSinLeer();
            return;
          }
          const yaExiste = preciosExistentes.some(
            precio => precio.tipoPrecio?.id === this.precioInput.tipoPrecioId
          );

          if (yaExiste) {
            this.notificacionSnackBar.notification$.next({
              texto: "Ya existe un precio con ese tipo de precio para esta presentación.",
              color: NotificacionColor.warn,
              duracion: 3
            });
            return;
          }

          this.verificarMargen();
        } });
      return;
    }

    this.verificarMargen();
  }

  /**
   * Avisa cuando el precio deja un margen menor al mínimo sobre el costo del producto.
   * El usuario elige entre cancelar (no guarda y el diálogo queda abierto con el valor
   * cargado, para corregirlo ahí mismo), aplicar el precio mínimo sugerido, o guardar
   * igual el precio que ingresó.
   */
  private verificarMargen() {
    const elegida = this.monedaElegida();
    if (this.esMonedaDeLaEmpresa(elegida)) {
      // Moneda de la empresa: el costo de siempre, sin leer nada más.
      this.avisarMargen(this.data?.costoMedio, null);
      return;
    }
    // Otra moneda: el margen se mide en la moneda del precio. Costo de costeo y cambios del comercio,
    // leídos de fondo; si no se pueden leer no hay margen que calcular y se guarda sin avisar.
    const productoId = this.data?.productoId ?? this.data?.presentacion?.producto?.id;
    forkJoin({
      costeo: productoId != null ? this.costoService.getCostoEnCosteo(productoId) : of(null),
      monedas: this.monedaService.onGetAllEnSegundoPlano(true, { graphError: { show: false }, networkError: { show: false, propagate: true } })
        .pipe(take(1), catchError(() => of([] as Moneda[]))),
    }).pipe(untilDestroyed(this)).subscribe(({ costeo, monedas }) => {
      const conCambio = (m: Moneda) => (monedas || []).find((x) => String(x.id) === String(m?.id)) ?? m;
      const costo = costoEnMonedaDelPrecio(
        this.data?.costoMedio,
        conCambio(elegida),
        this.monedaEmpresa ? conCambio(this.monedaEmpresa) : null,
        costeo,
      );
      this.avisarMargen(costo, elegida);
    });
  }

  /** `moneda`: la del precio cuando no es la de la empresa (para formatear los montos); null = la de siempre. */
  private avisarMargen(costoMedio: number, moneda: Moneda | null) {
    const evaluacion = evaluarMargenPrecio(
      Number(this.precioControl.value),
      costoMedio,
      this.data?.presentacion?.cantidad
    );

    if (evaluacion == null || !evaluacion.debeAvisar) {
      this.continuarGuardado();
      return;
    }

    const precioSugerido = moneda == null
      ? Math.round(evaluacion.precioMinimoSugerido)
      : redondearMonto(evaluacion.precioMinimoSugerido, moneda.decimales);

    this.dialogosService
      .confirm(
        'Margen por debajo del mínimo',
        `El precio ingresado deja un margen de ${this.formatearPorcentaje(
          evaluacion.margenPorcentaje
        )}% sobre el costo.`,
        `Se espera un margen mínimo de ${MARGEN_MINIMO_PORCENTAJE}%.`,
        [
          `Costo de la presentación: ${this.formatearMonto(
            evaluacion.costoPresentacion, moneda
          )}`,
          `Precio ingresado: ${this.formatearMonto(
            Number(this.precioControl.value), moneda
          )}`,
          `Precio mínimo sugerido: ${this.formatearMonto(precioSugerido, moneda)}`,
        ],
        true,
        'Cancelar',
        'Usar precio sugerido',
        'Continuar igual'
      )
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        // DialogosComponent enfoca siempre el primer botón, y cada botón cierra con un valor
        // fijo: el 1° con true, el 2° con false y el 3° con null. "Cancelar" va primero para
        // que un Enter reflejo no se saltee el aviso. Con tres botones el diálogo se puede
        // cerrar con ESC, que devuelve undefined y también cuenta como cancelar.
        if (res === false) {
          this.aplicarPrecioSugerido(precioSugerido);
          this.continuarGuardado();
        } else if (res === null) {
          this.continuarGuardado();
        }
      });
  }

  /** Reemplaza el precio ingresado por el mínimo sugerido, antes de guardar. */
  private aplicarPrecioSugerido(precioSugerido: number) {
    this.precioControl.setValue(precioSugerido);
    this.precioInput.precio = precioSugerido;
  }

  /** Moneda de la empresa (`moneda` null): el formato de siempre. Otra: símbolo y decimales de esa moneda. */
  private formatearMonto(valor: number, moneda: Moneda | null): string {
    if (moneda == null) return Math.round(valor).toLocaleString('es-PY');
    const decimales = moneda.decimales > 0 ? moneda.decimales : 0;
    const texto = valor.toLocaleString('es-PY', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
    return `${moneda.simbolo ? moneda.simbolo + ' ' : ''}${texto}`;
  }

  private formatearPorcentaje(valor: number): string {
    return valor.toFixed(1).replace('.', ',');
  }

  private avisarPreciosSinLeer(): void {
    this.notificacionSnackBar.openWarn(
      'No se pudieron leer los precios de la presentación: no se guardó nada. Volvé a intentar.', 6);
  }

  /**
   * Avisa y devuelve true si el precio no se puede guardar. Se mira al guardar y no con un
   * validador del control: un precio viejo en cero tiene que poder editarse sin tocar el valor.
   */
  private precioSinValor(): boolean {
    const minimo = this.minimoPrecio();
    if (esPrecioGuardable(this.precioControl.value, this.selectedPrecioPorSucursal?.precio, minimo)) return false;
    this.notificacionSnackBar.openWarn(minimo === 1
      ? "El precio tiene que ser de 1 o más."
      : `El precio tiene que ser de ${this.formatearMonto(minimo, this.monedaElegida())} o más.`, 4);
    return true;
  }

  private continuarGuardado() {
    // De nuevo acá: el precio mínimo sugerido por margen se aplica después del chequeo de onSave.
    if (this.precioSinValor()) return;
    const { requestId } = this.cargandoDialog.openDialog();

    if (this.principalControl.value !== true) {
      this.guardarPrecio(requestId, false);
      return;
    }
    // Precio principal: primero se baja el principal anterior. Sin poder leer los precios, o sin poder bajarlo,
    // NO se guarda el nuevo (quedarían dos principales) (#390).
    this.precioService.onGetPrecioPorSurursalPorPresentacionId(this.data.presentacion.id, true, LECTURA_PRECIOS,
      CONSULTA_PRECIOS, true)
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        this.cargandoDialog.closeDialog(requestId);
        this.avisarPreciosSinLeer();
      }, next: (preciosExistentes: PrecioPorSucursal[]) => {
        if (preciosExistentes == null) {
          this.cargandoDialog.closeDialog(requestId);
          this.avisarPreciosSinLeer();
          return;
        }
        const bajas = preciosExistentes
          .filter(precio => precio.principal && precio.id !== this.precioInput.id)
          .map(precio => {
            const updateInput = new PrecioPorSucursalInput();
            updateInput.id = precio.id;
            updateInput.precio = precio.precio;
            updateInput.activo = precio.activo;
            updateInput.principal = false;
            updateInput.presentacionId = this.data.presentacion.id;
            updateInput.tipoPrecioId = precio.tipoPrecio?.id;
            updateInput.sucursalId = this.mainService?.sucursalActual?.id;
            updateInput.usuarioId = null;
            // Al central, como el alta: los precios se replican central → filial, una baja hecha en el filial se pierde
            // defer: onSave abre su modal «Guardando…» al llamarse; así una baja que no llega a correr no deja el suyo abierto
            return defer(() => this.precioService.onSave(updateInput).pipe(take(1)));
          });

        if (bajas.length === 0) {
          this.guardarPrecio(requestId, false);
          return;
        }
        // De a una: si una falla no se sigue con las demás
        concat(...bajas).pipe(toArray(), untilDestroyed(this)).subscribe({
          next: () => this.guardarPrecio(requestId, true),
          error: (error) => {
            this.cargandoDialog.closeDialog(requestId);
            // Rechazo: el motivo ya lo mostró el servicio; no decir «no se pudo» como si fuera un corte
            this.notificacionSnackBar.openWarn(esRechazoDelServidor(error)
              ? 'No se guardó el precio nuevo: el servidor rechazó quitar el precio principal anterior. Revisá los precios de la presentación.'
              : 'No se pudo quitar el precio principal anterior: el precio nuevo NO se guardó. Revisá los precios de la presentación.', 10);
            // La baja pudo haberse aplicado: el padre recarga los precios
            this.matDialogRef.close(PRECIO_SIN_CONFIRMAR);
          }
        });
      } });
  }

  /** `seBajoElPrincipal`: ya se quitó el principal anterior; si este guardado falla, la presentación queda sin principal. */
  private guardarPrecio(requestId: number, seBajoElPrincipal: boolean) {
    this.precioInput.sucursalId = this.mainService?.sucursalActual?.id;

    this.precioService.onSave(this.precioInput).pipe(untilDestroyed(this)).subscribe(res => {
      this.cargandoDialog.closeDialog(requestId);
      if (res != null) {
        // `promocion` solo si quedó inactivo: quien abrió el diálogo sigue con las sucursales
        this.matDialogRef.close(this.esPromocionGuardada(res) ? { ...res, promocion: true } : res);
      } else {
        this.notificacionSnackBar.openWarn(
          'No se pudo confirmar el guardado del precio: revisá los precios de la presentación.', 8);
        this.matDialogRef.close(PRECIO_SIN_CONFIRMAR);
      }
    }, error => {
      this.cargandoDialog.closeDialog(requestId);
      // Una respuesta vacía también llega como arreglo, pero no es un rechazo: pudo haberse guardado
      const rechazado = esRechazoDelServidor(error);
      if (rechazado && !seBajoElPrincipal) {
        // El servidor respondió que no (ya lo avisó el servicio) y no se tocó nada más: se puede corregir y reintentar
        return;
      }
      if (rechazado) {
        this.notificacionSnackBar.openWarn(
          'No se guardó el precio nuevo y el principal anterior ya se había quitado: la presentación quedó sin precio principal. Revisá sus precios.', 12);
      } else if (seBajoElPrincipal) {
        // Se avisa siempre (también tras el corte por tiempo): el link no sabe que el principal ya se quitó
        this.notificacionSnackBar.openWarn(
          'No se pudo confirmar si el precio nuevo se guardó y el principal anterior ya se había quitado: la presentación pudo quedar sin precio principal. Revisá sus precios.', 12);
      } else if (!esTimeoutDeLink(error)) {
        // Sin respuesta: pudo haberse guardado (en el corte por tiempo ya avisa el link)
        this.notificacionSnackBar.openWarn(
          'No se pudo confirmar el guardado: pudo haberse guardado. Revisá los precios de la presentación antes de reintentar.', 10);
      }
      this.matDialogRef.close(PRECIO_SIN_CONFIRMAR);
    });
  }

  onCancelar() {
    this.matDialogRef.close()
  }

  private esPromocionGuardada(precio: PrecioPorSucursal): boolean {
    return this.promocionControl.value === true && this.data?.precio?.id == null && precio?.activo === false;
  }

}

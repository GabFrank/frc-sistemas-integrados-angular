import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { esSucursalCompras } from '../../../empresarial/sucursal/sucursal-compras.util';
import { ROLES } from '../../../personas/roles/roles.enum';
import {
  AjusteStockLoteInput,
  ESTADO_LOTE_LABELS,
  EstadoLote,
  LoteDeProducto,
  ModoAjusteLote,
  ResumenStockLote
} from '../../../operaciones/lote/lote.model';
import { LoteService } from '../../../operaciones/lote/lote.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';
import { Producto } from '../producto.model';

/** Tolerancia al comparar cantidades en punto flotante, igual que en el backend. */
const EPSILON = 0.0001;

export interface AjustarStockLoteDialogData {
  producto: Producto;
  sucursalPreseleccionada?: Sucursal;
  permitirCambiarSucursal?: boolean;
  /** Lote ya elegido, cuando se entra desde una fila de "Stock por lotes". */
  loteIdPreseleccionado?: number;
  /** Número del lote preseleccionado: evita una búsqueda por id para resolver su saldo. */
  numeroLotePreseleccionado?: string;
}

/**
 * Ajuste de stock de un producto CON control de lote.
 *
 * Es el mismo diálogo que el ajuste común —sucursal, stock actual, cantidad real, ajuste— con el
 * lote en el medio. El ajuste común no sirve para estos productos porque escribe la existencia
 * agregada y deja el ledger por lote sin tocar, con lo que FEFO nunca puede volver a asignar esa
 * mercadería. Acá el lote es obligatorio y el backend escribe las dos cuentas en la misma
 * transacción.
 *
 * El operador carga la cantidad real DEL LOTE y la diferencia se aplica también a la existencia del
 * producto: ajustar un lote mueve el stock general, que es lo único que tiene sentido cuando el
 * stock de estos productos solo se puede tocar por lote.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ajustar-stock-lote-dialog',
  templateUrl: './ajustar-stock-lote-dialog.component.html',
  styleUrls: ['./ajustar-stock-lote-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AjustarStockLoteDialogComponent implements OnInit {

  @ViewChild('cantidadInput') cantidadInput: ElementRef<HTMLInputElement>;

  formGroup: FormGroup;
  sucursalControl = new FormControl(null, Validators.required);
  cantidadControl = new FormControl(null, Validators.required);

  productoDescripcion = '';
  sucursales: Sucursal[] = [];
  selectedSucursal: Sucursal;
  permitirCambiarSucursal = true;
  /** Sin este rol COMPRAS no se puede ajustar: ajustar exige ver su stock, que está oculto. */
  puedeVerStockCompras = false;

  /** Lote elegido en el buscador. Null mientras no se eligió ninguno. */
  loteElegido: LoteDeProducto;
  /** Etiqueta ya armada del lote elegido: el template no calcula nada. */
  loteEtiqueta = '';
  loteEstadoLabel = '';
  loteNoLiberado = false;

  cargando = false;
  guardando = false;

  // Todo precalculado para el template.
  /** Stock del producto en la sucursal: todo lo que hay, con lote y sin lote. Null mientras no se leyó. */
  existencia: number | null = null;
  existenciaDespues: number | null = null;
  /**
   * Guardar exige la existencia y el saldo del lote leídos para la sucursal ACTUAL (#390): antes, si la relectura
   * no respondía, quedaban los de la sucursal anterior (o una existencia de 0 con un error) y se podía guardar.
   */
  existenciaCargada = false;
  saldoLoteVerificado = false;
  releyendoLote = false;
  /** Fallos con «Reintentar» en el template. */
  sucursalesFallo = false;
  existenciaFallo = false;
  loteFallo = false;
  /** Solo aplica la última respuesta: una tardía de la sucursal anterior se descarta. */
  private cargaExistencia = 0;
  private cargaLote = 0;
  saldoLote = 0;
  diferencia = 0;
  diferenciaLabel = '0';
  colorDiferencia = '#ffffff';
  hayAjuste = false;
  puedeGuardar = false;
  hayLote = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AjustarStockLoteDialogData,
    private dialogRef: MatDialogRef<AjustarStockLoteDialogComponent>,
    private sucursalService: SucursalService,
    private loteService: LoteService,
    private notificacionService: NotificacionSnackbarService,
    private cargandoService: CargandoDialogService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {
    this.productoDescripcion = data?.producto?.descripcion || '';
  }

  ngOnInit(): void {
    this.puedeVerStockCompras = this.mainService.tieneAlgunRol([ROLES.VER_STOCK_COMPRAS]);
    // El formulario va primero aunque el diálogo se cierre: el template se renderiza igual hasta
    // que termina de cerrar y liga [formGroup].
    this.armarFormulario();
    // Antes de cargarSucursales(): con una sucursal preseleccionada, esa es la que pide el stock.
    // Cierra con null, como onCancelar: el stock por lote recarga con cualquier cosa distinta.
    if (!this.puedeVerStockCompras && esSucursalCompras(this.data?.sucursalPreseleccionada)) {
      this.notificacionService.openWarn('Sin permiso para ajustar el stock de COMPRAS');
      this.dialogRef.close(null);
      return;
    }
    this.configurarSucursal();
    this.cargarSucursales();
  }

  private armarFormulario(): void {
    this.formGroup = new FormGroup({
      sucursal: this.sucursalControl,
      cantidad: this.cantidadControl
    });

    this.sucursalControl.valueChanges.pipe(untilDestroyed(this)).subscribe((sucursalId) => {
      this.selectedSucursal = this.sucursales.find((s) => s.id === sucursalId);
      if (this.selectedSucursal != null) {
        this.cargarStockDelProducto();
        // El saldo del lote es POR SUCURSAL: el que quedó de la elección anterior ya no vale.
        if (this.loteElegido != null) {
          this.releerSaldoDelLote();
        }
      }
    });

    this.cantidadControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.recalcular());
  }

  private configurarSucursal(): void {
    this.permitirCambiarSucursal = this.data.permitirCambiarSucursal !== false;
    if (this.data.sucursalPreseleccionada != null) {
      this.selectedSucursal = this.data.sucursalPreseleccionada;
      this.sucursalControl.setValue(this.data.sucursalPreseleccionada.id, { emitEvent: false });
      if (!this.permitirCambiarSucursal) {
        this.sucursalControl.disable();
      }
    }
  }

  /**
   * Se excluye SERVIDOR igual que en el ajuste común: no es una sucursal donde haya mercadería
   * física que contar.
   */
  private cargarSucursales(): void {
    this.sucursalesFallo = false;
    this.sucursalService.onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED,
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true })
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        this.sucursalesFallo = true;
        this.notificacionService.openWarn('No se pudieron cargar las sucursales: usá «Reintentar».', 5);
        this.cdr.markForCheck();
      }, next: (res) => {
        if (res == null) {
          this.sucursalesFallo = true; // error GraphQL: el servicio ya avisó
          this.cdr.markForCheck();
          return;
        }
        this.sucursales = (res || []).filter(
          (sucursal) =>
            sucursal.nombre !== 'SERVIDOR' &&
            (this.puedeVerStockCompras || !esSucursalCompras(sucursal))
        );
        if (this.selectedSucursal != null) {
          this.cargarStockDelProducto();
          this.preseleccionarLote();
        }
        this.cdr.markForCheck();
      } });
  }

  reintentarSucursales(): void {
    this.cargarSucursales();
  }

  reintentarExistencia(): void {
    this.cargarStockDelProducto();
  }

  reintentarLote(): void {
    if (this.loteElegido != null) {
      this.releerSaldoDelLote();
    } else {
      this.preseleccionarLote();
    }
  }

  /**
   * Stock del producto en la sucursal. Se pide al mismo endpoint que ya devuelve las cuentas del
   * producto y se usa solo `existencia`: es el stock combinado, lo que hay en lotes y lo que no.
   */
  private cargarStockDelProducto(): void {
    const productoId = this.data?.producto?.id;
    const sucursalId = this.selectedSucursal?.id;
    if (productoId == null || sucursalId == null) {
      return;
    }
    const carga = ++this.cargaExistencia;
    this.cargando = true;
    this.existencia = null;
    this.existenciaCargada = false;
    this.existenciaFallo = false;
    this.recalcular();

    this.loteService.onResumenStockLote(productoId, sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (resumen: ResumenStockLote) => {
          if (carga !== this.cargaExistencia) return; // respuesta de otra sucursal
          this.cargando = false;
          if (resumen == null) {
            // Error GraphQL (el servicio ya avisó): antes quedaba en 0 y se podía guardar
            this.existenciaFallo = true;
            this.recalcular();
            return;
          }
          this.existencia = resumen.existencia || 0;
          this.existenciaCargada = true;
          this.recalcular();
        },
        error: () => {
          if (carga !== this.cargaExistencia) return;
          this.cargando = false;
          this.existenciaFallo = true;
          this.notificacionService.openWarn('No se pudo cargar el stock del producto: usá «Reintentar».', 5);
          this.recalcular();
        }
      });
  }

  /**
   * Resuelve el lote que vino preseleccionado desde "Stock por lotes". Se busca por su número, que
   * es lo que la fila ya sabe: así se obtiene el saldo en ESTA sucursal sin traer la lista entera.
   */
  private preseleccionarLote(): void {
    const numero = this.data?.numeroLotePreseleccionado;
    if (numero == null || this.loteElegido != null) {
      return;
    }
    this.buscarLotePorNumero(numero, this.data.loteIdPreseleccionado);
  }

  private releerSaldoDelLote(): void {
    this.buscarLotePorNumero(this.loteElegido.numeroLote, this.loteElegido.loteId);
  }

  private buscarLotePorNumero(numeroLote: string, loteId?: number): void {
    const productoId = this.data?.producto?.id;
    const sucursalId = this.selectedSucursal?.id;
    if (productoId == null || sucursalId == null) {
      return;
    }
    const carga = ++this.cargaLote;
    this.saldoLoteVerificado = false;
    this.releyendoLote = true;
    this.loteFallo = false;
    this.recalcular();
    // 50 filas: la búsqueda por número es parcial y un lote con saldo 0 puede quedar al final de la página
    this.loteService.onBuscarLotesDeProducto(productoId, sucursalId, numeroLote, 0, 50)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pagina) => {
          if (carga !== this.cargaLote) return; // respuesta de otra sucursal o elección
          this.releyendoLote = false;
          if (pagina == null) {
            this.loteFallo = true; // error GraphQL: el servicio ya avisó
            this.recalcular();
            return;
          }
          const filas = pagina.getContent || [];
          const encontrado = loteId != null
            ? filas.find((fila) => +fila.loteId === +loteId)
            : filas.find((fila) => fila.numeroLote === numeroLote);
          if (encontrado != null) {
            this.aplicarLote(encontrado);
          } else {
            // No se quita el lote: queda sin verificar hasta elegirlo de nuevo con el buscador
            this.notificacionService.openWarn('No se encontró el saldo del lote en esta sucursal: elegilo de nuevo con el buscador.', 5);
            this.recalcular();
          }
        },
        error: () => {
          if (carga !== this.cargaLote) return;
          this.releyendoLote = false;
          this.loteFallo = true;
          this.notificacionService.openWarn('No se pudo leer el saldo del lote: usá «Reintentar».', 5);
          this.recalcular();
        }
      });
  }

  /** Abre el buscador genérico paginado. Es el mismo que usan productos y personas. */
  onBuscarLote(): void {
    if (this.selectedSucursal == null) {
      this.notificacionService.openWarn('Elegí primero la sucursal.');
      return;
    }
    this.loteService
      .onBuscarLoteDeProducto(this.data.producto.id, this.selectedSucursal.id)
      .pipe(untilDestroyed(this))
      .subscribe((lote) => {
        if (lote != null) {
          // Elegido en el buscador, con el saldo de esta sucursal: descarta una relectura en vuelo
          this.cargaLote++;
          this.releyendoLote = false;
          this.loteFallo = false;
          this.aplicarLote(lote);
          this.enfocarCantidad();
        }
      });
  }

  private aplicarLote(lote: LoteDeProducto): void {
    this.loteElegido = lote;
    this.hayLote = true;
    this.saldoLoteVerificado = true;
    this.saldoLote = lote.saldo || 0;
    this.loteNoLiberado = lote.estado != null && lote.estado !== EstadoLote.LIBERADO;
    this.loteEstadoLabel = ESTADO_LOTE_LABELS[lote.estado] || '';
    const vencimiento = lote.fechaVencimiento
      ? `vence ${dateToString(new Date(lote.fechaVencimiento), 'dd/MM/yyyy')}`
      : 'sin vencimiento';
    this.loteEtiqueta = `${lote.numeroLote} · ${vencimiento}`;
    // Arranca en el saldo actual, igual que el ajuste común: el operador corrige sobre lo que hay.
    this.cantidadControl.setValue(this.saldoLote, { emitEvent: false });
    this.recalcular();
  }

  /** Vuelve a dejar el lote sin elegir, para buscar otro. */
  onQuitarLote(): void {
    this.cargaLote++;
    this.releyendoLote = false;
    this.loteFallo = false;
    this.saldoLoteVerificado = false;
    this.loteElegido = null;
    this.hayLote = false;
    this.saldoLote = 0;
    this.loteEtiqueta = '';
    this.loteEstadoLabel = '';
    this.loteNoLiberado = false;
    this.cantidadControl.setValue(null, { emitEvent: false });
    this.recalcular();
  }

  private enfocarCantidad(): void {
    setTimeout(() => {
      this.cantidadInput?.nativeElement?.focus();
      this.cantidadInput?.nativeElement?.select();
    });
  }

  /**
   * La cuenta que se muestra. Es la misma que hace el backend, repetida acá solo para previsualizar:
   * la fuente de verdad es el resultado que devuelve la mutation.
   *
   * La diferencia del lote se aplica también a la existencia del producto: en estos productos el
   * stock solo se toca por lote, así que ajustar un lote es ajustar el stock general.
   */
  private recalcular(): void {
    const cantidadFinal = this.cantidadControl.value != null ? +this.cantidadControl.value : null;

    this.diferencia = cantidadFinal != null ? cantidadFinal - this.saldoLote : 0;
    this.hayAjuste = Math.abs(this.diferencia) > EPSILON;
    this.diferenciaLabel = this.diferencia > 0 ? `+${this.diferencia}` : `${this.diferencia}`;
    this.colorDiferencia = this.diferencia > 0
      ? '#4caf50'
      : this.diferencia < 0 ? '#f44336' : '#ffffff';
    this.existenciaDespues = this.existenciaCargada ? this.existencia + this.diferencia : null;

    // Se miran los controles y no formGroup.valid: recalcular() corre dentro del valueChanges de
    // un hijo, y ahi el estado del grupo todavia es el del ciclo anterior —Angular actualiza al
    // padre DESPUES de emitir en el hijo (forms.mjs: valueChanges.emit antes de
    // _parent.updateValueAndValidity)—. Leyendolo desde aca, Guardar nunca se habilitaba.
    this.puedeGuardar = this.selectedSucursal != null
      && this.hayLote
      && this.cantidadControl.valid
      && !this.cargando
      && !this.guardando
      && this.existenciaCargada
      && this.saldoLoteVerificado
      && !this.releyendoLote
      && this.hayAjuste;
    this.cdr.markForCheck();
  }

  onGuardar(): void {
    if (!this.puedeGuardar) {
      this.notificacionService.openWarn(!this.existenciaCargada || !this.saldoLoteVerificado || this.releyendoLote
        ? 'Todavía no se leyó el stock o el saldo del lote en esta sucursal: esperá o usá «Reintentar».'
        : 'Elegí el lote y cargá la cantidad real.');
      return;
    }

    const input: AjusteStockLoteInput = {
      productoId: this.data.producto.id,
      sucursalId: this.selectedSucursal.id,
      // Siempre CORREGIR: el ajuste del lote mueve la existencia del producto. El otro modo del
      // backend (ATRIBUIR, que traza sin mover el total) no se ofrece acá.
      modo: ModoAjusteLote.CORREGIR,
      cantidadFinal: +this.cantidadControl.value,
      loteId: this.loteElegido.loteId,
      usuarioId: this.mainService.usuarioActual?.id
    };

    this.guardando = true;
    const { requestId } = this.cargandoService.openDialog();
    this.loteService.onAjustarStockLote(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (resultado) => {
          this.cargandoService.closeDialog(requestId);
          this.guardando = false;
          this.notificacionService.openGuardadoConExito();
          this.dialogRef.close(resultado);
        },
        error: () => {
          this.cargandoService.closeDialog(requestId);
          this.guardando = false;
          this.notificacionService.openAlgoSalioMal('No se pudo guardar el ajuste.');
          this.cdr.markForCheck();
        }
      });
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}

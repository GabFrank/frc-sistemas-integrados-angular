import { AfterViewInit, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { CajaVirtual } from '../../../modules/financiero/caja-virtual/caja-virtual.model';
import { BeepService } from '../../beep/beep.service';
import { Retiro, EstadoRetiro } from '../../../modules/financiero/retiro/retiro.model';
import { RetiroService } from '../../../modules/financiero/retiro/retiro.service';
import { QrLectorService } from '../qr-lector.service';
import { QrCrudo, QrItemCarrito, QrTipoSoportado, claveItem } from '../qr-lector.model';

export interface QrLectorDialogData {
  cajaVirtual: CajaVirtual;
}

/**
 * Lo que devuelve el diálogo al cerrarse con documentos cargados. El que lo abrió decide
 * a dónde llevarlos: el carrito no navega por su cuenta.
 */
export interface QrLectorResultado {
  tipo: QrTipoSoportado;
  items: QrItemCarrito[];
}

/** Un intento fallido, para mostrarlo en la lista sin perder el hilo de lo que ya se cargó. */
interface Rechazo {
  codigo: string;
  motivo: string;
}

/**
 * Carrito de escaneo.
 *
 * El operador pasa uno o varios papeles por el lector y cada uno se suma a una lista. No
 * cierra en el primer escaneo: pagar varias notas de una vez es el caso normal, y el motor
 * de pago está hecho para eso (PagoProveedorService.procesarEvento acepta N solicitudes).
 *
 * Dos reglas se validan acá y no al final:
 *
 *  - **Mismo tipo.** Decisión de producto: no se mezcla una compra con un vale, aunque el
 *    backend lo aceptaría. El movimiento consolidado quedaría con una etiqueta que no
 *    describe lo que se pagó.
 *  - **Misma contraparte.** Es una restricción dura del backend
 *    ("Todas las notas del pago deben ser del mismo proveedor"). Validarla acá evita que el
 *    operador cargue diez papeles y se entere recién al confirmar.
 *
 * El primer documento escaneado fija ambas cosas; los siguientes se comparan contra él.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-qr-lector-dialog',
  templateUrl: './qr-lector-dialog.component.html',
  styleUrls: ['./qr-lector-dialog.component.scss'],
})
export class QrLectorDialogComponent implements AfterViewInit {

  @ViewChild('lectorInput') lectorInput: ElementRef<HTMLInputElement>;

  items: QrItemCarrito[] = [];
  rechazos: Rechazo[] = [];

  /** Tipo y contraparte que fijó el primer documento del carrito. */
  tipoCarrito: QrTipoSoportado = null;
  contraparteCarrito: string = null;
  private contraparteIdCarrito: number = null;

  resolviendo = false;
  total = 0;
  monedaSimbolo = '';

  /**
   * Último código procesado. Los lectores HID baratos repiten el Enter y dispararían dos
   * resoluciones del mismo papel; esto las colapsa sin bloquear un reescaneo intencional
   * (que igual sería rechazado como duplicado, con su motivo).
   */
  private ultimoCodigo: string = null;
  private ultimoEn = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QrLectorDialogData,
    private dialogRef: MatDialogRef<QrLectorDialogComponent>,
    private qrLector: QrLectorService,
    private beep: BeepService,
    private retiroService: RetiroService,
  ) {}

  ngAfterViewInit(): void {
    this.enfocar();
  }

  /** El input tiene que estar siempre listo: el operador no debería tener que clickear. */
  enfocar() {
    setTimeout(() => this.lectorInput?.nativeElement?.focus(), 100);
  }

  onEnter(valor: string) {
    const codigo = (valor || '').trim();
    this.limpiarInput();
    if (!codigo) return;

    // Colapsa el doble disparo del lector (mismo código dentro de la ventana de repetición).
    const ahora = Date.now();
    if (codigo === this.ultimoCodigo && ahora - this.ultimoEn < 400) return;
    this.ultimoCodigo = codigo;
    this.ultimoEn = ahora;

    const res = this.qrLector.parse(codigo);
    if (!res.ok) {
      this.rechazar(codigo, res.error?.mensaje || 'No se pudo leer el código.');
      return;
    }
    this.resolver(res.qr);
  }

  /**
   * Resuelve el documento contra el backend.
   *
   * TODO(F3/F4): acá van los handlers por tipo. Cada uno tiene que aplicar el control de
   * acceso de la caja además de leer el documento: las queries de "traeme este documento por
   * id" (RetiroGraphQL.retiro, SolicitudPagoGraphQL.solicitudPago) no validan rol, así que
   * confiar en ellas dejaría enumerar documentos tipeando códigos a mano.
   */
  private resolver(qr: QrCrudo) {
    this.resolviendo = true;
    this.resolverDocumento(qr).pipe(untilDestroyed(this)).subscribe({
      next: item => {
        this.resolviendo = false;
        if (item == null) {
          this.rechazar(qr.raw, 'No se encontró el documento de ese código.');
          return;
        }
        this.agregar(item, qr.raw);
      },
      error: err => {
        this.resolviendo = false;
        const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo leer el documento.';
        this.rechazar(qr.raw, msg);
      },
    });
  }

  /** Punto de extensión por tipo. F4 agrega SOLPAG acá. */
  private resolverDocumento(qr: QrCrudo): Observable<QrItemCarrito> {
    switch (qr.tipoEntidad) {
      case QrTipoSoportado.RETIRO:
        return this.resolverRetiro(qr);
      default:
        return of(null);
    }
  }

  /**
   * Resuelve un retiro de PDV por su PK compuesta (id, sucursalId).
   *
   * El ingreso a la caja mayor lo consuma un poller, no una llamada síncrona, así que hay
   * tres estados y no dos: disponible, ya enviado pero sin acreditar, y ya acreditado. Sin
   * distinguir el del medio, quien escanea un retiro recién enviado leería "ya ingresó" y
   * saldría a buscar un movimiento que todavía no existe.
   */
  private resolverRetiro(qr: QrCrudo): Observable<QrItemCarrito> {
    const sucursalId = this.qrLector.sucursalDe(qr);
    if (sucursalId == null) {
      return throwError(() => new Error('El código no indica de qué sucursal es el retiro.'));
    }
    return this.retiroService.onFilterRetiro(qr.idOrigen, null, sucursalId, null, null, 0, 1)
      .pipe(map(page => {
        const retiro: Retiro = (page?.getContent || [])[0];
        if (retiro == null) return null;

        if (retiro.movimientoCajaVirtualId != null) {
          throw new Error(`El retiro #${retiro.id} ya ingresó a una caja mayor.`);
        }
        if (retiro.cajaVirtualId != null) {
          throw new Error(`El retiro #${retiro.id} ya fue enviado a una caja mayor; se acredita en unos minutos.`);
        }
        if (retiro.estado === EstadoRetiro.CANCELADO) {
          throw new Error(`El retiro #${retiro.id} está cancelado.`);
        }

        // El retiro se cuenta en tres monedas a la vez; el carrito muestra el guaraní, que
        // es la que siempre tiene valor, y el destino trabaja con el retiro completo.
        const item: QrItemCarrito = {
          tipo: QrTipoSoportado.RETIRO,
          id: retiro.id,
          sucursalId: retiro.sucursalId,
          etiqueta: `Retiro #${retiro.id}`,
          contraparte: retiro.sucursal?.nombre || `Sucursal ${retiro.sucursalId}`,
          // Los retiros no tienen la restricción de "misma contraparte" del pago a
          // proveedor: se pueden ingresar juntos retiros de sucursales distintas.
          contraparteId: null,
          monto: retiro.retiroGs || 0,
          monedaSimbolo: 'Gs.',
          clave: claveItem(QrTipoSoportado.RETIRO, retiro.id, retiro.sucursalId),
          documento: retiro,
        };
        return item;
      }));
  }

  /** Suma el documento al carrito si pasa las reglas de tipo, contraparte y duplicado. */
  private agregar(item: QrItemCarrito, codigo: string) {
    if (this.items.some(i => i.clave === item.clave)) {
      this.rechazar(codigo, `${item.etiqueta} ya está en la lista.`);
      return;
    }
    if (this.tipoCarrito != null && this.tipoCarrito !== item.tipo) {
      this.rechazar(codigo, 'No se pueden pagar documentos de distinto tipo en la misma operación.');
      return;
    }
    if (this.contraparteIdCarrito != null && item.contraparteId != null
        && this.contraparteIdCarrito !== item.contraparteId) {
      this.rechazar(codigo, `Todo el pago tiene que ser de ${this.contraparteCarrito}.`);
      return;
    }

    this.items = [...this.items, item];
    if (this.tipoCarrito == null) {
      this.tipoCarrito = item.tipo;
      this.contraparteCarrito = item.contraparte;
      this.contraparteIdCarrito = item.contraparteId;
      this.monedaSimbolo = item.monedaSimbolo;
    }
    this.recalcular();
    this.beep.beep();
    // Tras cada escaneo aceptado el foco tiene que volver solo: el operador encadena
    // documentos sin tocar el mouse.
    this.enfocar();
  }

  quitar(item: QrItemCarrito) {
    this.items = this.items.filter(i => i.clave !== item.clave);
    // Vaciar el carrito libera el tipo y la contraparte: se puede empezar otra operación
    // sin cerrar y reabrir el diálogo.
    if (this.items.length === 0) {
      this.tipoCarrito = null;
      this.contraparteCarrito = null;
      this.contraparteIdCarrito = null;
      this.monedaSimbolo = '';
    }
    this.recalcular();
    this.enfocar();
  }

  private rechazar(codigo: string, motivo: string) {
    // Solo se guardan los últimos rechazos: la lista es un aviso, no un historial.
    this.rechazos = [{ codigo, motivo }, ...this.rechazos].slice(0, 3);
    this.beep.boop();
    this.enfocar();
  }

  private recalcular() {
    this.total = this.items.reduce((acc, i) => acc + (i.monto || 0), 0);
  }

  private limpiarInput() {
    if (this.lectorInput?.nativeElement) this.lectorInput.nativeElement.value = '';
  }

  onContinuar() {
    if (!this.items.length) return;
    const res: QrLectorResultado = { tipo: this.tipoCarrito, items: this.items };
    this.dialogRef.close(res);
  }

  onCancelar() {
    this.dialogRef.close(null);
  }
}

import { AfterViewInit, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CajaVirtual } from '../../../modules/financiero/caja-virtual/caja-virtual.model';
import { BeepService } from '../../beep/beep.service';
import { Retiro, EstadoRetiro, formatMontosRetiro, PREGUNTA_RETIROS_DE_LA_CAJA } from '../../../modules/financiero/retiro/retiro.model';
import { RetiroService } from '../../../modules/financiero/retiro/retiro.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../services/timeout-link';
import { QrLectorService } from '../qr-lector.service';
import { LectorTecladoDirective } from '../../lector-teclado/lector-teclado.directive';
import { DialogosService } from '../../components/dialogos/dialogos.service';
import { MainService } from '../../../main.service';
import { operaAcotadoCaja } from '../../../modules/financiero/caja-virtual/rol-tesoreria-caja';
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
  @ViewChild(LectorTecladoDirective) lectorTeclado: LectorTecladoDirective;

  items: QrItemCarrito[] = [];
  rechazos: Rechazo[] = [];

  /** Tipo y contraparte que fijó el primer documento del carrito. */
  tipoCarrito: QrTipoSoportado = null;
  contraparteCarrito: string = null;
  private contraparteIdCarrito: number = null;

  resolviendo = false;
  total = 0;
  /** Total por moneda cuando el carrito es de retiros («3.000.000 Gs · 400 R$»); null para los de una sola moneda. */
  totalMontos: string = null;
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
    private dialogosService: DialogosService,
    private mainService: MainService,
  ) {}

  ngAfterViewInit(): void {
    this.enfocar();
  }

  /** El input tiene que estar siempre listo: el operador no debería tener que clickear. */
  enfocar() {
    // Mientras se resuelve puede estar abierta la pregunta de los retiros de la caja: no robarle el foco.
    setTimeout(() => { if (!this.resolviendo) this.lectorInput?.nativeElement?.focus(); }, 100);
  }

  onEnter(valor: string) {
    const codigo = (valor || '').trim();
    // Antes de limpiar: la directiva lee el valor del campo.
    const alternativa = this.lectorTeclado?.alternativa();
    this.limpiarInput();
    if (!codigo) return;

    // Colapsa el doble disparo del lector (mismo código dentro de la ventana de repetición).
    const ahora = Date.now();
    if (codigo === this.ultimoCodigo && ahora - this.ultimoEn < 400) return;
    this.ultimoCodigo = codigo;
    this.ultimoEn = ahora;

    let res = this.qrLector.parse(codigo);
    // El lector manda teclas físicas en distribución EE.UU.: con Windows en español el «-» llega como «'».
    if (!res.ok && alternativa) {
      const alt = this.qrLector.parse(alternativa);
      if (alt.ok) res = alt;
    }
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
      next: items => {
        this.resolviendo = false;
        if (!items?.length) {
          this.rechazar(qr.raw, 'No se encontró el documento de ese código.');
          return;
        }
        // Los de la caja que ya están en la lista se saltean: el rechazo por duplicado queda para el
        // reescaneo del mismo papel (lo resuelve cada handler).
        const nuevos = items.filter(i => !this.items.some(x => x.clave === i.clave));
        if (!nuevos.length) {
          this.rechazar(qr.raw, 'Esos retiros ya están en la lista.');
          return;
        }
        for (const item of nuevos) {
          if (!this.agregar(item, qr.raw)) break;
        }
        this.beep.beep();
        // Tras cada escaneo aceptado el foco tiene que volver solo: el operador encadena
        // documentos sin tocar el mouse.
        this.enfocar();
      },
      error: err => {
        this.resolviendo = false;
        const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo leer el documento.';
        this.rechazar(qr.raw, msg);
      },
    });
  }

  /**
   * Punto de extensión por tipo. Devuelve los ítems a sumar: un retiro trae con él a los demás
   * pendientes de su caja si el operador acepta, y un ticket de cierre trae a todos.
   */
  private resolverDocumento(qr: QrCrudo): Observable<QrItemCarrito[]> {
    switch (qr.tipoEntidad) {
      case QrTipoSoportado.RETIRO:
        return this.resolverRetiro(qr);
      case QrTipoSoportado.PDV_CAJA:
        return this.resolverCaja(qr);
      default:
        return of([]);
    }
  }

  /**
   * Resuelve un retiro de PDV por su PK compuesta (id, sucursalId).
   *
   * El ingreso a la caja mayor lo consuma un poller, no una llamada síncrona, así que hay
   * tres estados y no dos: disponible, ya enviado pero sin acreditar, y ya acreditado. Sin
   * distinguir el del medio, quien escanea un retiro recién enviado leería "ya ingresó" y
   * saldría a buscar un movimiento que todavía no existe.
   *
   * Lo que entra al carrito sale de los pendientes de su caja, no de `filterRetiros`: esa lista
   * trae el detalle por moneda (sin él la verificación abre vacía) y aplica el control de acceso.
   */
  private resolverRetiro(qr: QrCrudo): Observable<QrItemCarrito[]> {
    const sucursalId = this.qrLector.sucursalDe(qr);
    if (sucursalId == null) {
      return throwError(() => new Error('El código no indica de qué sucursal es el retiro.'));
    }
    return this.retiroService.onFilterRetiro(qr.idOrigen, null, sucursalId, null, null, 0, 1, true, PROPAGAR_ERROR_DE_RED,
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true })
      .pipe(
        catchError(() => throwError(() => new Error('No se pudo consultar el retiro: el servidor no responde.'))),
        map(page => {
          // null = error del servidor: no es lo mismo que «no existe ese retiro» (#390).
          if (page == null) { throw new Error('No se pudo consultar el retiro. Intentá de nuevo.'); }
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
          if (this.items.some(i => i.clave === claveItem(QrTipoSoportado.RETIRO, retiro.id, retiro.sucursalId))) {
            throw new Error(`Retiro #${retiro.id} ya está en la lista.`);
          }
          return retiro;
        }),
        switchMap((retiro: Retiro) => retiro == null ? of([]) : this.conLosDeSuCaja(retiro, qr)),
      );
  }

  /** El retiro escaneado, con su detalle, y los demás pendientes de su caja si el operador los quiere. */
  private conLosDeSuCaja(retiro: Retiro, qr: QrCrudo): Observable<QrItemCarrito[]> {
    // Manda la caja que dice el central; la del ticket (posición 6) es el respaldo.
    const cajaId = retiro.cajaSalida?.id || Number(qr.campo6);
    if (!cajaId) {
      return throwError(() => new Error(`No se pudo saber de qué caja es el retiro #${retiro.id}.`));
    }
    return this.pendientesDeCaja(retiro.sucursalId, cajaId).pipe(
      switchMap(pendientes => {
        const escaneado = pendientes.find(r => r.id === retiro.id);
        if (escaneado == null) {
          throw new Error(retiro.estado === EstadoRetiro.EN_PROCESO
            ? `El retiro #${retiro.id} sigue abierto en el PDV.`
            : `El retiro #${retiro.id} no corresponde a esta caja mayor.`);
        }
        const items = [this.itemDeRetiro(escaneado)];
        const otros = pendientes.filter(r => r.id !== retiro.id);
        if (!otros.length) return of(items);
        return this.dialogosService.confirm(
          'Retiros de la misma caja',
          PREGUNTA_RETIROS_DE_LA_CAJA,
          `La caja ${cajaId} tiene ${otros.length} retiro${otros.length === 1 ? '' : 's'} más sin ingresar.`,
          null, true, 'Sí, traerlos', 'No',
        ).pipe(map(res => res === true ? [...items, ...otros.map(r => this.itemDeRetiro(r))] : items));
      }));
  }

  /** Ticket de cierre: todos los retiros pendientes de la caja, sin preguntar. */
  private resolverCaja(qr: QrCrudo): Observable<QrItemCarrito[]> {
    const sucursalId = this.qrLector.sucursalDe(qr);
    if (sucursalId == null) {
      return throwError(() => new Error('El código no indica de qué sucursal es la caja.'));
    }
    return this.pendientesDeCaja(sucursalId, qr.idOrigen).pipe(map(pendientes => {
      if (!pendientes.length) throw new Error(`La caja ${qr.idOrigen} no tiene retiros pendientes de ingresar.`);
      return pendientes.map(r => this.itemDeRetiro(r));
    }));
  }

  /** Pendientes de una caja del PDV. El rol acotado solo ve los de las sucursales que cubre su caja mayor. */
  private pendientesDeCaja(sucursalId: number, cajaId: number): Observable<Retiro[]> {
    const destinoId = operaAcotadoCaja(this.mainService) ? this.data?.cajaVirtual?.id : undefined;
    return this.retiroService.onGetPendientesDeCaja(sucursalId, cajaId, destinoId).pipe(
      catchError(() => throwError(() => new Error('No se pudieron consultar los retiros de la caja: volvé a escanear.'))));
  }

  private itemDeRetiro(retiro: Retiro): QrItemCarrito {
    return {
      tipo: QrTipoSoportado.RETIRO,
      id: retiro.id,
      sucursalId: retiro.sucursalId,
      etiqueta: `Retiro #${retiro.id} · Caja ${retiro.cajaSalida?.id ?? '—'}`,
      contraparte: retiro.sucursal?.nombre || `Sucursal ${retiro.sucursalId}`,
      // Los retiros no tienen la restricción de "misma contraparte" del pago a
      // proveedor: se pueden ingresar juntos retiros de sucursales distintas.
      contraparteId: null,
      monto: retiro.retiroGs || 0,
      monedaSimbolo: 'Gs.',
      montos: formatMontosRetiro(retiro),
      clave: claveItem(QrTipoSoportado.RETIRO, retiro.id, retiro.sucursalId),
      documento: retiro,
    };
  }

  /**
   * Suma el documento al carrito si pasa las reglas de tipo y contraparte. Devuelve false si lo
   * rechazó. El beep y el foco los maneja quien llama: un escaneo puede sumar varios.
   */
  private agregar(item: QrItemCarrito, codigo: string): boolean {
    if (this.tipoCarrito != null && this.tipoCarrito !== item.tipo) {
      this.rechazar(codigo, 'No se pueden pagar documentos de distinto tipo en la misma operación.');
      return false;
    }
    if (this.contraparteIdCarrito != null && item.contraparteId != null
        && this.contraparteIdCarrito !== item.contraparteId) {
      this.rechazar(codigo, `Todo el pago tiene que ser de ${this.contraparteCarrito}.`);
      return false;
    }

    this.items = [...this.items, item];
    if (this.tipoCarrito == null) {
      this.tipoCarrito = item.tipo;
      this.contraparteCarrito = item.contraparte;
      this.contraparteIdCarrito = item.contraparteId;
      this.monedaSimbolo = item.monedaSimbolo;
    }
    this.recalcular();
    return true;
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
    // Un retiro trae tres monedas: sumar solo guaraníes escondía los reales y los dólares.
    const retiros = this.items.filter(i => i.tipo === QrTipoSoportado.RETIRO).map(i => i.documento as Retiro);
    this.totalMontos = retiros.length ? formatMontosRetiro({
      retiroGs: retiros.reduce((a, r) => a + (r?.retiroGs || 0), 0),
      retiroRs: retiros.reduce((a, r) => a + (r?.retiroRs || 0), 0),
      retiroDs: retiros.reduce((a, r) => a + (r?.retiroDs || 0), 0),
    } as Retiro) : null;
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

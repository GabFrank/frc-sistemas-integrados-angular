import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { TerminalPos } from '../../terminal-pos/terminal-pos.model';
import { TerminalPosService } from '../../terminal-pos/terminal-pos.service';
import { textoMotivoNoCompletado, VentaTarjeta } from '../venta-tarjeta.model';
import {
  MotivoNoConciliarDialogComponent,
  MotivoNoConciliarResultado,
} from '../motivo-no-conciliar-dialog/motivo-no-conciliar-dialog.component';
import { VentaTarjetaService } from '../venta-tarjeta.service';
import { RegistrarVentaTarjetaDialogComponent } from '../qr-pos/registrar-venta-tarjeta-dialog/registrar-venta-tarjeta-dialog.component';
import { TipoEntidad } from '../../../../generics/tipo-entidad.enum';
import { descodificarQr } from '../../../../shared/qr-code/qr-code.component';
import { debounceTime, filter, map } from 'rxjs/operators';
import { mensajeDeError } from '../qr-pos/mensaje-error';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../notificacion-snackbar.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { CajaService } from '../../pdv/caja/caja.service';
import { PdvCajaEstado } from '../../pdv/caja/caja.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

export interface VentasTarjetaCajaDialogData {
  cajaId: number;
}

/**
 * Ventas con tarjeta de la caja abierta, para el cajero, desde el PDV (Utilitarios F1).
 *
 * Distinta de `ListVentaTarjetaComponent` a proposito:
 *
 * - **Consulta al FILIAL**, no al central. El PDV tiene que operar sin internet, y `completar()`
 *   corre contra el filial de todas formas.
 * - **El aislamiento sale por construccion**: la query exige `cajaId` y `sucId` del lado del
 *   servidor, asi que no puede devolver datos de otra caja ni de otra sucursal aunque alguien
 *   manipule los filtros.
 * - **Paginada del lado del servidor.** Una caja puede acumular cientos de cobros en un turno;
 *   traerlos todos para mostrar quince seria pagar por datos que nadie mira.
 *
 * La pantalla del sidebar sigue existiendo para auditar la red: son dos necesidades distintas.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ventas-tarjeta-caja-dialog',
  templateUrl: './ventas-tarjeta-caja-dialog.component.html',
  styleUrls: ['./ventas-tarjeta-caja-dialog.component.scss'],
})
export class VentasTarjetaCajaDialogComponent implements OnInit {
  dataSource = new MatTableDataSource<VentaTarjeta>([]);
  // `creadoEn` va segundo y no al final: una caja puede quedar abierta varios dias --la 654 de
  // prueba lleva semanas-- asi que "de cuando es este cobro" es lo primero que se pregunta al
  // mirar la lista, no un dato de cierre.
  // `venta` va junto a la fecha porque es EL identificador que el cajero tiene delante: el numero
  // impreso en el ticket del cliente. El `id` de la tabla es el de venta_tarjeta, que no esta
  // impreso en ninguna parte -- era la unica columna identificadora y la menos util de todas.
  //
  // Y `venta` sola NO alcanza: una venta con dos lineas de tarjeta da dos filas con el mismo
  // numero (medido: las filas 24 y 25 de la base de prueba son las dos de la venta 35512). Lo que
  // las separa ahi es el monto, la terminal y el cajero.
  displayedColumns = ['id', 'creadoEn', 'venta', 'cajero', 'terminal', 'monto', 'escaneado', 'estado', 'acciones'];

  estadoControl = new FormControl(null);
  terminalPosIdControl = new FormControl(null);
  monedaIdControl = new FormControl(null);
  montoDesdeControl = new FormControl(null);
  montoHastaControl = new FormControl(null);
  /**
   * Cajero. Arranca en el usuario actual: lo primero que uno busca son sus propios cobros.
   *
   * <b>Se filtra del lado del SERVIDOR.</b> Esta pantalla pagina contra el filial, asi que filtrar
   * sobre las filas ya traidas solo tocaria la pagina cargada y el total del paginador quedaria
   * mintiendo. Es la misma razon por la que los otros cinco filtros son parametros y no `filter()`.
   *
   * Y arranca elegido pero se puede vaciar: un supervisor que cierra la caja necesita ver todas.
   */
  usuarioIdControl = new FormControl(null);

  /**
   * El QR de la seña impresa. Es un input de LECTOR, no una camara.
   *
   * Existe porque la tabla es ambigua por naturaleza: dos cobros del mismo monto, a la misma hora,
   * en la misma terminal, son indistinguibles a ojo. El papel que el cajero grapo al cupon lleva el
   * `ventaTarjetaId`, que es el unico dato que los separa.
   */
  qrControl = new FormControl(null);
  /** Lo que se le dice al cajero cuando el QR no sirve. null = nada que avisar. */
  avisoQr: string = null;
  buscandoQr = false;

  estados = ['PENDIENTE', 'COMPLETADO', 'NO_COMPLETADO', 'CANCELADO'];
  terminales: TerminalPos[] = [];
  monedas: Moneda[] = [];
  /** Los cajeros que aparecen en lo que ya se trajo. No hay consulta de usuarios de la caja. */
  cajeros: { id: number; nickname: string }[] = [];

  /**
   * Cliente apuntando al CENTRAL: la pantalla se ve, pero no se opera.
   *
   * Con `isLocal: false`, `graphql-connection.service.ts:280` no crea el link local, asi que TODAS
   * las acciones de este modulo --completar, dejar sin conciliar, reabrir, la captura por foto--
   * se resuelven contra el central, que no tiene ninguna de esas mutations. Antes de esto el boton
   * aparecia igual y fallaba con un error de GraphQL que no mencionaba la configuracion: el usuario
   * veia "no se pudo" sin ninguna pista de que lo que faltaba era el servidor de la sucursal.
   *
   * Se lee UNA vez en `ngOnInit`: `isLocal()` pega a localStorage y el template no puede llamar
   * funciones.
   */
  modoLectura = false;

  /**
   * Si la caja de este dialogo sigue abierta. Arranca en `false` --el lado estricto-- y solo pasa
   * a `true` si el filial dice `EN_PROCESO`.
   *
   * <b>Por que se consulta.</b> El gate de «Reabrir» no es el mismo en los dos casos: deshacer el
   * propio error dentro de la caja abierta es del cajero, y tocar un turno que alguien ya cerro es
   * de quien es dueno de las cajas cerradas. El dialogo nunca miraba el estado de la caja --recibe
   * `cajaId` y filtra-- asi que sin esta consulta no hay forma de distinguirlos.
   *
   * Si la consulta falla, queda en `false` y manda el gate estricto. Fallar hacia el lado que pide
   * mas permiso es lo unico honesto: la alternativa es abrir la accion por no haber podido
   * averiguar si correspondia.
   */
  cajaAbierta = false;

  /** Rol para reabrir un cobro de la caja ABIERTA: el mismo que para completar. */
  private puedeReabrirAbierta = false;
  /** Rol para reabrir un cobro de una caja CERRADA: los duenos de las cajas cerradas. */
  private puedeReabrirCerrada = false;

  decimalesPorMoneda: { [id: number]: number } = {};
  selectedPageInfo: PageInfo<VentaTarjeta>;
  pageIndex = 0;
  pageSize = 15;
  cargando = true;
  /** Una acción de fila en vuelo. Los iconos no se deshabilitan, así que la guarda vive acá. */
  accionEnCurso = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VentasTarjetaCajaDialogData,
    public dialogRef: MatDialogRef<VentasTarjetaCajaDialogComponent>,
    private ventaTarjetaService: VentaTarjetaService,
    private monedaService: MonedaService,
    private terminalPosService: TerminalPosService,
    private matDialog: MatDialog,
    private notificacionSnackbar: NotificacionSnackbarService,
    private cajaService: CajaService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.modoLectura = !this.mainService.isLocal();

    const roles = this.mainService.usuarioActual?.roles || [];
    const esAdmin = roles.includes(ROLES.ADMIN);
    // Caja abierta: el cajero deshace su propio error, con el mismo rol con el que completa.
    this.puedeReabrirAbierta = esAdmin || roles.includes(ROLES.VENTA_TARJETA_COMPLETAR);
    // Caja cerrada: es tocar un turno que alguien dio por cerrado. ANALISIS DE CAJA es el rol que
    // YA gobierna las cajas cerradas en esta app --la lista de cajas, los retiros, los gastos, las
    // observaciones de caja cuelgan todas de el--, asi que el permiso no se inventa para esto.
    this.puedeReabrirCerrada = esAdmin || roles.includes(ROLES.ANALISIS_DE_CAJA);

    // Solo hace falta si se va a operar. Y en modo lectura no habria contra quien preguntar: sin
    // link local, esta consulta iria al central.
    if (!this.modoLectura) this.consultarEstadoDeLaCaja();

    // Arranca filtrando por el cajero actual: lo primero que uno busca son sus propios cobros.
    // Se puede vaciar, y "Limpiar filtros" lo vacia.
    const yo = this.mainService.usuarioActual;
    if (yo?.id != null) {
      this.usuarioIdControl.setValue(Number(yo.id));
      this.recordarCajero(Number(yo.id), yo.nickname);
    }

    // Todo contra el filial (`false`): esta pantalla tiene que funcionar sin internet.
    this.monedaService.onGetAll(false).pipe(untilDestroyed(this)).subscribe({
      next: (monedas) => {
        this.monedas = monedas || [];
        this.monedas.forEach((m) => (this.decimalesPorMoneda[Number(m.id)] = m.decimales ?? 0));
        this.onGetData();
      },
      error: () => this.onGetData(),
    });

    this.terminalPosService.onGetAll(null, null, false).pipe(untilDestroyed(this)).subscribe({
      next: (res) => (this.terminales = res || []),
      error: () => (this.terminales = []),
    });

    // El lector dispara solo: manda la cadena y un Enter. El debounce es para que no salte a mitad
    // de la cadena, y el largo minimo evita consultar por cualquier tecla suelta.
    //
    // ⚠️ SIN `distinctUntilChanged`, a diferencia de `scan-terminal-pos-dialog`. Alla el dialogo se
    // cierra al acertar, asi que nunca se vuelve a escanear lo mismo. Aca el dialogo QUEDA ABIERTO:
    // si el cajero escanea una seña, cancela el dialogo de completar y vuelve a escanear la misma,
    // el operador la descartaria por repetida --el reset del input va con `emitEvent: false`, asi
    // que el ultimo valor visto por el stream sigue siendo el anterior-- y el lector quedaria
    // muerto sin ningun aviso. La guarda contra consultas dobles es `buscandoQr`, no esta.
    this.qrControl.valueChanges
      .pipe(
        map((valor: string) => (valor || '').trim()),
        filter((valor: string) => valor.length > 20),
        debounceTime(350),
        untilDestroyed(this)
      )
      .subscribe(() => this.onQrEscaneado());
  }

  /**
   * Pregunta al FILIAL si la caja de este diálogo sigue abierta.
   *
   * Sólo para el gate de «Reabrir»: el resto del diálogo funciona igual con la caja cerrada —lo
   * hace desde siempre, filtra por `cajaId` y nunca miró el estado— y no se le agrega una
   * dependencia nueva a nada de eso. Por lo mismo no bloquea la carga: si tarda o falla, la tabla
   * ya se ve y lo único que queda en el lado estricto es una acción.
   */
  private consultarEstadoDeLaCaja(): void {
    this.cajaService
      .onGetByIdSimp(Number(this.data.cajaId), Number(this.mainService.sucursalActual?.id), true, false)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (caja) => (this.cajaAbierta = caja?.estado === PdvCajaEstado['En proceso']),
        error: () => (this.cajaAbierta = false),
      });
  }

  /**
   * Si esta fila puede reabrirse, y por quién.
   *
   * <b>Dos gates, no uno.</b> Los dos casos que §10.2 nombra no son el mismo acto: el cajero que
   * marcó la fila equivocada de tres del mismo monto está deshaciendo su propio error dentro de su
   * turno, y quien reabre un cobro de una caja ya cerrada está tocando un turno que alguien dio
   * por terminado. Darles el mismo permiso obligaba a elegir entre dejar al cajero llamando a un
   * supervisor para corregirse a sí mismo, o dejar que cualquier cajero con el rol toque el turno
   * cerrado de otro.
   *
   * `cajaAbierta` arranca en `false`, así que mientras la consulta no haya vuelto —o si falló— rige
   * el gate estricto.
   */
  puedeReabrir(item: VentaTarjeta): boolean {
    if (this.modoLectura || this.accionEnCurso) return false;
    if (item?.estado !== 'NO_COMPLETADO') return false;
    return this.cajaAbierta ? this.puedeReabrirAbierta : this.puedeReabrirCerrada;
  }

  /**
   * Devuelve un cobro de NO_COMPLETADO a PENDIENTE.
   *
   * <b>Los dos casos reales</b>, los dos frecuentes: se marcó la fila equivocada, o apareció el
   * cupón —`CUPON_PERDIDO` es literalmente «todavía no lo encontré», y que el papel aparezca al día
   * siguiente es el caso normal, no el raro—. Sin esto la plata quedaba sin conciliar para siempre
   * por una decisión tomada con información incompleta, que es justo lo que el rastro de §8 venía a
   * evitar.
   *
   * Pide confirmación porque el diálogo de marcar avisa que no se puede deshacer: ahora sí se
   * puede, y decirlo en el momento es lo que evita que «sin conciliar» se vuelva reversible de
   * hecho sin que nadie lo note.
   */
  onReabrir(item: VentaTarjeta): void {
    if (!this.puedeReabrir(item)) return;

    const data: ConfirmDialogData = {
      title: 'Reabrir el cobro ' + item.id,
      // Se nombra el motivo con el que se había marcado: es el dato que decide si reabrir tiene
      // sentido, y tenerlo delante evita reabrir la fila equivocada por segunda vez.
      message:
        'Vuelve a quedar PENDIENTE y hay que registrarle el cupón.' +
        (item.motivoTexto ? ' Se había marcado como: ' + item.motivoTexto + '.' : '') +
        ' El motivo y quién lo marcó NO se borran: queda además tu usuario como quien lo reabrió.',
      confirmText: 'Reabrir',
      cancelText: 'Cancelar',
    };

    this.matDialog
      .open(ConfirmDialogComponent, { data, width: '480px' })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (confirmado !== true) return;
        this.accionEnCurso = true;
        this.ventaTarjetaService
          .onReabrir(
            Number(item.id),
            Number(this.mainService.sucursalActual?.id),
            this.mainService.usuarioActual?.id
          )
          .pipe(untilDestroyed(this))
          .subscribe({
            next: () => {
              this.accionEnCurso = false;
              this.notificacionSnackbar.notification$.next({
                color: NotificacionColor.success,
                texto: 'El cobro ' + item.id + ' volvió a PENDIENTE. Ya se le puede registrar el cupón.',
                duracion: 4,
              });
              this.onGetData();
            },
            error: (err) => {
              this.accionEnCurso = false;
              this.notificacionSnackbar.notification$.next({
                color: NotificacionColor.danger,
                texto: mensajeDeError(err, 'No se pudo reabrir el cobro.'),
                duracion: 6,
              });
            },
          });
      });
  }

  /**
   * Un QR de seña escaneado. Decide a qué fila corresponde, o por qué no corresponde a ninguna.
   *
   * El orden de las guardas importa: primero las que se resuelven con el QR en la mano (¿es una
   * seña? ¿de esta sucursal? ¿de esta caja?) y recién después la consulta al servidor. Así un
   * papel de otra caja se rechaza sin ir a buscar nada.
   */
  onQrEscaneado(): void {
    // El lector manda CR al final: sin esta guarda, el Enter dispara una segunda vuelta.
    if (this.modoLectura || this.buscandoQr) return;
    const texto = (this.qrControl.value || '').trim();
    if (!texto) return;

    this.avisoQr = null;
    const qr: any = descodificarQr(texto);

    if (!texto.startsWith('frc-') || String(qr?.tipoEntidad) !== String(TipoEntidad.VENTA_TARJETA)) {
      this.rechazarQr('Ese código no es la seña de un cobro con tarjeta.');
      return;
    }

    // `data` es posicional: cajaId|monto|ventaTarjetaId. Lo arma `onImprimirSena`.
    const partes = String(qr.data || '').split('|');
    const cajaIdQr = Number(partes[0]);
    const ventaTarjetaId = Number(partes[2]);

    if (!ventaTarjetaId) {
      this.rechazarQr('La seña no trae el número de cobro. Buscalo a mano en la lista.');
      return;
    }

    if (Number(qr.sucursalId) !== Number(this.mainService.sucursalActual?.id)) {
      this.rechazarQr('Esa seña es de otra sucursal, no de ésta.');
      return;
    }

    // Tambien cubre la seña vieja: una de otro dia apunta a una caja que ya se cerro, asi que su
    // numero de caja no es el de esta. Decirlo con el numero puesto le dice al cajero que paso.
    if (cajaIdQr && cajaIdQr !== Number(this.data.cajaId)) {
      this.rechazarQr('Esa seña es de la caja ' + cajaIdQr + ', no de esta caja (' + this.data.cajaId + ').');
      return;
    }

    this.buscarFilaYAbrir(ventaTarjetaId);
  }

  /**
   * Trae la fila del cobro y la abre si todavia se puede conciliar.
   *
   * Se consulta al SERVIDOR cuando no esta en pantalla: la tabla trae de a 15 y el filtro de cajero
   * arranca puesto, asi que la fila que el QR nombra puede existir perfectamente y no estar en la
   * pagina cargada. Buscarla solo en memoria diria "no existe" sobre un cobro que si existe.
   */
  private buscarFilaYAbrir(ventaTarjetaId: number): void {
    const enPantalla = this.dataSource.data.find((f) => Number(f.id) === ventaTarjetaId);
    if (enPantalla) {
      this.abrirSiSePuedeConciliar(enPantalla);
      return;
    }

    this.buscandoQr = true;
    this.ventaTarjetaService
      .onGetCompletaPorId(ventaTarjetaId, Number(this.mainService.sucursalActual?.id))
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (fila) => {
          this.buscandoQr = false;
          if (!fila?.id) {
            this.rechazarQr('No se encontró el cobro ' + ventaTarjetaId + ' en esta sucursal.');
            return;
          }
          // El QR podia no traer la caja (senas viejas, o un cobro guardado sin caja). Con la fila
          // en la mano se verifica igual: esta pantalla concilia UNA caja.
          if (fila.cajaId != null && Number(fila.cajaId) !== Number(this.data.cajaId)) {
            this.rechazarQr('El cobro ' + ventaTarjetaId + ' es de la caja ' + fila.cajaId + ', no de esta.');
            return;
          }
          this.abrirSiSePuedeConciliar(this.aFilaConMoneda(fila));
        },
        error: () => {
          this.buscandoQr = false;
          this.rechazarQr('No se pudo consultar el cobro ' + ventaTarjetaId + '. Buscalo a mano en la lista.');
        },
      });
  }

  /**
   * Mismo gate que el boton manual de la fila (`*ngIf="item.estado === 'PENDIENTE'"`).
   *
   * Sin esto, escanear la seña de un cobro ya conciliado reabriria su registro — justo lo que el
   * boton de la tabla no deja hacer.
   */
  private abrirSiSePuedeConciliar(fila: VentaTarjeta): void {
    if (fila.estado !== 'PENDIENTE') {
      this.rechazarQr('El cobro ' + fila.id + ' ya está ' + fila.estado + '. No hay nada que conciliar.');
      return;
    }
    this.limpiarQr();
    this.onCompletar(fila);
  }

  private rechazarQr(motivo: string): void {
    this.avisoQr = motivo;
    this.limpiarQr();
  }

  /** Vacia el input y le devuelve el foco: el cajero escanea el siguiente sin tocar el mouse. */
  private limpiarQr(): void {
    this.qrControl.reset(null, { emitEvent: false });
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('app-ventas-tarjeta-caja-dialog input.input-qr');
      if (input) { input.focus(); }
    });
  }

  onGetData(): void {
    this.cargando = true;
    const params: any = {
      cajaId: this.data.cajaId,
      sucId: Number(this.mainService.sucursalActual?.id),
      page: this.pageIndex,
      size: this.pageSize,
    };
    if (this.estadoControl.value) params.estado = this.estadoControl.value;
    if (this.terminalPosIdControl.value) params.terminalPosId = Number(this.terminalPosIdControl.value);
    if (this.monedaIdControl.value) params.monedaId = Number(this.monedaIdControl.value);
    if (this.montoDesdeControl.value != null && this.montoDesdeControl.value !== '') {
      params.montoDesde = Number(this.montoDesdeControl.value);
    }
    if (this.montoHastaControl.value != null && this.montoHastaControl.value !== '') {
      params.montoHasta = Number(this.montoHastaControl.value);
    }
    if (this.usuarioIdControl.value) params.usuarioId = Number(this.usuarioIdControl.value);

    this.ventaTarjetaService
      .onFiltrarPorCaja(params)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.selectedPageInfo = res;
          const filas = res?.getContent ?? [];
          // La lista de cajeros se arma con lo que aparece, y se ACUMULA: no hay consulta de
          // "usuarios de esta caja". Arranca con el propio, y al poner "Todos" aparecen los demas
          // y quedan disponibles. Acumular y no reemplazar evita que el filtro se vacie a si mismo
          // -- filtrando por un cajero, la pagina solo trae ese.
          filas.forEach((f: any) => this.recordarCajero(Number(f?.usuario?.id), f?.usuario?.nickname));
          this.dataSource.data = filas.map((item) => this.aFilaConMoneda(item));
          this.cargando = false;
        },
        error: () => {
          this.dataSource.data = [];
          this.cargando = false;
        },
      });
  }

  onFilter(): void {
    this.pageIndex = 0;
    this.onGetData();
  }

  onLimpiarFiltros(): void {
    // El cajero tambien se limpia: "limpiar" tiene que dejar ver todo, incluido lo de otros
    // turnos. Dejarlo preseleccionado convertiria el default en un encierro invisible.
    this.usuarioIdControl.setValue(null);
    this.estadoControl.setValue(null);
    this.terminalPosIdControl.setValue(null);
    this.monedaIdControl.setValue(null);
    this.montoDesdeControl.setValue(null);
    this.montoHastaControl.setValue(null);
    this.pageIndex = 0;
    this.onGetData();
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.onGetData();
  }

  /**
   * Apollo congela los resultados, asi que se clona antes de agregar los campos de display.
   * Los decimales dependen de la moneda: Gs. no lleva ninguno y R$ lleva dos, asi que un `1.0-2`
   * fijo mostraba "50 R$" en vez de "50,00 R$".
   */
  /** Suma un cajero a la lista del filtro, sin repetir. */
  private recordarCajero(id: number, nickname: string): void {
    if (!id || this.cajeros.some((c) => c.id === id)) return;
    this.cajeros = [...this.cajeros, { id, nickname: nickname || ('Usuario ' + id) }]
      .sort((a, b) => a.nickname.localeCompare(b.nickname));
  }

  private aFilaConMoneda(item: VentaTarjeta): VentaTarjeta {
    const moneda = item?.moneda ?? item?.terminalPos?.moneda;
    const decimales = moneda?.decimales ?? 0;
    return {
      ...item,
      simboloMoneda: moneda?.simbolo ?? 'Gs.',
      digitosMoneda: `1.${decimales}-${decimales}`,
      // El motivo en palabras se resuelve acá: el template no puede llamar funciones.
      motivoTexto: textoMotivoNoCompletado(item?.noCompletadoMotivo),
    };
  }

  /**
   * Vuelve a imprimir la seña de un cobro pendiente.
   *
   * <b>Para cuando el papel no está</b>: no salió porque la caja no tenía impresora configurada,
   * se mojó, se traspapeló. Sin esto la única salida era buscar la fila a ojo entre cobros del
   * mismo monto, que es justamente lo que la seña existe para evitar.
   *
   * Reimprime con los datos de la fila, así que el QR sale idéntico al original salvo el sello de
   * tiempo, que no se valida.
   */
  onReimprimirSena(item: VentaTarjeta): void {
    // Los iconos de la fila no se deshabilitan solos, asi que la guarda es esta: sin ella un doble
    // clic manda dos impresiones, o dos marcados.
    if (this.modoLectura || item?.estado !== 'PENDIENTE' || this.accionEnCurso) return;
    this.accionEnCurso = true;
    this.ventaTarjetaService
      .onImprimirSena({
        ventaId: Number(item.ventaId),
        ventaTarjetaId: Number(item.id),
        sucursalId: Number(item.sucursalId ?? this.mainService.sucursalActual?.id),
        cajaId: Number(item.cajaId ?? this.data.cajaId),
        cajero: item.usuario?.nickname,
        terminal: item.terminalPos?.descripcion,
        monto: item.monto,
        monedaSimbolo: item.simboloMoneda,
        decimales: (item.moneda ?? item.terminalPos?.moneda)?.decimales ?? 0,
      })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (impreso) => {
          this.accionEnCurso = false;
          this.notificacionSnackbar.notification$.next({
            color: impreso ? NotificacionColor.success : NotificacionColor.warn,
            texto: impreso
              ? 'Comprobante reimpreso.'
              : 'La impresora no respondió. Anotá venta ' + item.ventaId + ' y cobro ' + item.id + '.',
            duracion: impreso ? 3 : 8,
          });
        },
        error: (err) => {
          this.accionEnCurso = false;
          this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.warn,
            texto: mensajeDeError(err, 'No se pudo reimprimir el comprobante.'),
            duracion: 8,
          });
        },
      });
  }

  /**
   * Deja este cobro sin conciliar, con motivo.
   *
   * <b>Es la salida del cobro cuyo cupón no existe</b> —no se imprimió, la terminal falló, el
   * papel se perdió— y la condición para que el cajero pueda cerrar su caja sin depender de un
   * supervisor. Lo que la hace aceptable es el rastro: motivo, usuario y hora quedan en la fila.
   *
   * No se puede deshacer, y por eso el diálogo lo dice antes.
   */
  onNoConciliar(item: VentaTarjeta): void {
    if (this.modoLectura || item?.estado !== 'PENDIENTE' || this.accionEnCurso) return;
    this.matDialog
      .open(MotivoNoConciliarDialogComponent, {
        width: '460px',
        disableClose: true,
        data: { cuantos: 1 },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: MotivoNoConciliarResultado) => {
        if (!res?.motivo) return;
        this.accionEnCurso = true;
        this.ventaTarjetaService
          .onMarcarNoCompletada(
            Number(item.id),
            Number(this.mainService.sucursalActual?.id),
            res.motivo,
            res.observacion,
            this.mainService.usuarioActual?.id
          )
          .pipe(untilDestroyed(this))
          .subscribe({
            next: () => {
              this.accionEnCurso = false;
              this.notificacionSnackbar.notification$.next({
                color: NotificacionColor.success,
                texto: 'El cobro ' + item.id + ' quedó sin conciliar, con tu usuario y el motivo.',
                duracion: 4,
              });
              this.onGetData();
            },
            error: (err) => {
              this.accionEnCurso = false;
              this.notificacionSnackbar.notification$.next({
                color: NotificacionColor.danger,
                texto: mensajeDeError(err, 'No se pudo marcar el cobro.'),
                duracion: 6,
              });
            },
          });
      });
  }

  onCompletar(item: VentaTarjeta): void {
    // Las tres acciones repiten la guarda en el metodo y no solo en el template: el lector de QR
    // llega hasta `onCompletar` sin pasar por ningun *ngIf.
    if (this.modoLectura) return;
    this.matDialog
      .open(RegistrarVentaTarjetaDialogComponent, {
        data: {
          ventaTarjetaId: item.id,
          sucursalId: item.sucursalId,
          ventaId: item.ventaId,
          monto: item.monto,
          monedaSimbolo: item.simboloMoneda,
          terminalDescripcion: [item.terminalPos?.descripcion, item.terminalPos?.codigo]
            .filter(Boolean)
            .join(' - '),
          proveedorServicioId: item.terminalPos?.proveedorServicio?.id,
          // De acá sale qué camino se le ofrece al cajero y cuál se le cierra. Si viene null, el
          // diálogo bloquea con el motivo en vez de ofrecer caminos que no van a funcionar.
          formatoTerminalPos: item.terminalPos?.formatoTerminalPos,
          // La terminal va a la captura: con ella el filial aplica el formato y devuelve
          // los campos ya separados, en vez de texto crudo que el cajero transcribe igual.
          terminalPosId: item.terminalPos?.id,
        // La configuracion por aparato tiene que valer por las DOS puertas: si no, apagar la carga
        // a mano la cierra durante la venta y la deja abierta al completar el pendiente.
        cargaManualPermitida: item.terminalPos?.cargaManualPermitida,
          decimalesPorMoneda: this.decimalesPorMoneda,
          titulo: 'Completar venta con tarjeta',
          segundos: 120,
          // Para la captura por foto: la caja del pendiente, no la abierta ahora. Esta lista
          // viene del FILIAL, que devuelve el escalar; el objeto es lo que devuelve el central.
          cajaId: item.cajaId ?? item.caja?.id,
          usuarioId: this.mainService.usuarioActual?.id,
        },
        disableClose: false,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onGetData());
  }

  cerrar(): void {
    this.dialogRef.close(null);
  }
}

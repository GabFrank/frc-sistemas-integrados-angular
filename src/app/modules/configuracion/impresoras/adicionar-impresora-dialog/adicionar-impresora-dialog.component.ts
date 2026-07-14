import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  inject,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ElectronService, NetworkPrinter, PrinterInfo } from '../../../../commons/core/electron/electron.service';
import { ConfiguracionService } from '../../../../shared/services/configuracion.service';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import {
  DispositivoDetectado,
  Impresora,
  ImpresoraInput,
  PerfilPapel,
  TipoConexion,
  TipoImpresora,
  UsoImpresora,
} from '../impresora.model';
import { ImpresoraService } from '../impresora.service';
import {
  CredencialesCupsDialogComponent,
  CredencialesCupsResult,
} from '../credenciales-cups-dialog/credenciales-cups-dialog.component';

interface Opcion {
  value: string;
  label: string;
}

interface DetectadaVista {
  ref: PrinterInfo;
  nombre: string;
  descripcion: string;
  icono: string;
  esTermica: boolean;
}

interface DispositivoVista {
  ref: DispositivoDetectado;
  nombre: string;
  detalle: string;
  puedeIp: boolean;
  ip: string;
  puerto: number;
}

interface RedVista {
  ref: NetworkPrinter;
  nombre: string;
  detalle: string;
  esTermica: boolean;
}

// Palabras que sugieren que una impresora es termica / de tickets.
const REGEX_TERMICA = /ticket|term|thermal|\btm[-\s]?\d|xprinter|xp[-\s]?\d|pos.?58|pos.?80|58\s?mm|80\s?mm|receipt|bematech|epson\s?tm/i;

// Host del SERVIDOR CENTRAL (sucursalId=0). Es el host donde corre el backend central, no la
// "sucursal central" (que es una sucursal común). El router imprime local aquí para sus impresoras.
const HOST_SERVIDOR_CENTRAL_ID = 0;

@UntilDestroy()
@Component({
  selector: 'app-adicionar-impresora-dialog',
  templateUrl: './adicionar-impresora-dialog.component.html',
  styleUrls: ['./adicionar-impresora-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdicionarImpresoraDialogComponent implements OnInit {

  private sucursalService = inject(SucursalService);
  private impresoraService = inject(ImpresoraService);
  private electronService = inject(ElectronService);
  private configuracionService = inject(ConfiguracionService);
  private notificacion = inject(NotificacionSnackbarService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<AdicionarImpresoraDialogComponent>);

  formGroup: FormGroup;

  nombreControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(true);
  esPredeterminadaControl = new FormControl(false);
  sucursalControl = new FormControl(null, Validators.required);
  tipoControl = new FormControl('TERMICA', Validators.required);
  usoControl = new FormControl('TICKET');
  conexionControl = new FormControl('CUPS', Validators.required);
  colaCupsControl = new FormControl(null);
  ipControl = new FormControl(null);
  puertoControl = new FormControl(9100);
  perfilPapelControl = new FormControl('MM_58');
  columnasControl = new FormControl(32);
  anchoMmControl = new FormControl(null);
  altoMmControl = new FormControl(null);
  marcaControl = new FormControl(null);
  codepageControl = new FormControl(null);
  origenBusquedaControl = new FormControl('LOCAL');

  tipos: Opcion[] = [
    { value: 'TERMICA', label: 'Térmica' },
    { value: 'NORMAL', label: 'Normal (hoja)' },
    { value: 'ETIQUETA', label: 'Etiqueta' },
  ];
  usos: Opcion[] = [
    { value: 'TICKET', label: 'Ticket' },
    { value: 'FACTURA', label: 'Factura' },
    { value: 'REPORTE', label: 'Reporte' },
    { value: 'ETIQUETA', label: 'Etiqueta' },
    { value: 'COMANDA', label: 'Comanda' },
  ];
  conexiones: Opcion[] = [
    { value: 'CUPS', label: 'CUPS / cola del sistema' },
    { value: 'USB', label: 'USB (cola CUPS)' },
    { value: 'RED', label: 'Red / inalámbrica (IP)' },
    { value: 'BLUETOOTH', label: 'Bluetooth (cola CUPS)' },
  ];
  perfiles: Opcion[] = [
    { value: 'MM_48', label: '48 mm' },
    { value: 'MM_58', label: '58 mm' },
    { value: 'MM_72', label: '72 mm' },
    { value: 'MM_80', label: '80 mm' },
    { value: 'A4', label: 'A4' },
    { value: 'CARTA', label: 'Carta' },
    { value: 'CUSTOM', label: 'Personalizado' },
  ];
  origenesBusqueda: Opcion[] = [
    { value: 'LOCAL', label: 'Servidor local / filial' },
    { value: 'CENTRAL', label: 'Servidor central' },
  ];

  sucursales: Sucursal[] = [];
  colasSistema: string[] = [];
  detectadas: DetectadaVista[] = [];
  detectando = false;
  miIp: string = null;
  miUsuario: string = null;
  compartiendo = false;
  dispositivos: DispositivoVista[] = [];
  buscandoDispositivos = false;
  impresorasRed: RedVista[] = [];
  buscandoRed = false;
  instalando = false;
  esConexionRed = false;
  esPapelHoja = false;
  esWindows = false;
  etiquetaCola = 'Cola CUPS';
  titulo = 'Nueva impresora';
  editando = false;
  private impresoraId: number = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { impresora?: Impresora }) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nombre: this.nombreControl,
      activo: this.activoControl,
      esPredeterminada: this.esPredeterminadaControl,
      sucursal: this.sucursalControl,
      tipo: this.tipoControl,
      uso: this.usoControl,
      conexion: this.conexionControl,
      colaCups: this.colaCupsControl,
      ip: this.ipControl,
      puerto: this.puertoControl,
      perfilPapel: this.perfilPapelControl,
      columnas: this.columnasControl,
      anchoMm: this.anchoMmControl,
      altoMm: this.altoMmControl,
      marca: this.marcaControl,
      codepage: this.codepageControl,
    });

    this.conexionControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((valor) => this.actualizarVisibilidadConexion(valor));

    this.perfilPapelControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((valor) => this.actualizarVisibilidadPapel(valor));

    this.detectarPlataforma();
    this.cargarSucursales();
    this.detectarImpresorasLocales();
    this.detectarMiIp();

    if (this.data?.impresora != null) {
      this.editando = true;
      this.titulo = 'Editar impresora';
      this.cargarDatos(this.data.impresora);
    }

    this.actualizarVisibilidadConexion(this.conexionControl.value);
    this.actualizarVisibilidadPapel(this.perfilPapelControl.value);
  }

  private detectarPlataforma(): void {
    const ua = (navigator?.userAgent || '').toLowerCase();
    this.esWindows = ua.includes('windows');
    this.etiquetaCola = this.esWindows ? 'Nombre de impresora (Windows)' : 'Cola CUPS';
    // Impresora local nueva: por defecto CUPS en Linux, USB en Windows.
    if (!this.editando) {
      this.conexionControl.setValue(this.esWindows ? 'USB' : 'CUPS');
    }
  }

  /** Detecta automaticamente las impresoras instaladas en esta maquina (incluye USB). */
  detectarImpresorasLocales(): void {
    this.detectando = true;
    this.cdr.markForCheck();
    this.electronService.getPrinters()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.detectadas = (res ?? []).map((p) => this.mapearDetectada(p));
          this.detectando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.detectadas = [];
          this.detectando = false;
          this.cdr.markForCheck();
        },
      });
  }

  private mapearDetectada(p: PrinterInfo): DetectadaVista {
    const esTermica = this.infiereTermica(p);
    return {
      ref: p,
      nombre: p.displayName || p.name,
      descripcion: p.description || p.name,
      icono: esTermica ? 'receipt_long' : 'print',
      esTermica,
    };
  }

  private infiereTermica(p: PrinterInfo): boolean {
    const texto = `${p.name || ''} ${p.displayName || ''} ${p.description || ''}`;
    return REGEX_TERMICA.test(texto);
  }

  /** Autocompleta el formulario a partir de una impresora detectada del sistema. */
  usarDetectada(d: DetectadaVista): void {
    if (!this.nombreControl.value) {
      this.nombreControl.setValue(d.nombre);
    }
    this.colaCupsControl.setValue(d.ref.name);
    this.conexionControl.setValue(this.esWindows ? 'USB' : 'CUPS');
    this.tipoControl.setValue(d.esTermica ? 'TERMICA' : 'NORMAL');
    this.perfilPapelControl.setValue(d.esTermica ? 'MM_58' : 'A4');
    this.cdr.markForCheck();
  }

  /**
   * Comparte esta impresora local (conectada a esta PC) a un SERVIDOR (central o filial) por la IP
   * de esta PC:
   * 1) Electron habilita el compartir en el CUPS local y devuelve la URI IPP (ipp://<mi-ip>:631/printers/<cola>).
   * 2) El servidor destino instala una cola CUPS apuntando a esa URI (RAW si es térmica) → alcanza
   *    la impresora por la red. El token se elige según el destino (central → token_central).
   * 3) Autocompleta el formulario para registrar la impresora en el host destino.
   */
  compartirAServidor(d: DetectadaVista): void {
    const colaLocal = d.ref?.name;
    if (!colaLocal) {
      this.notificacion.notification$.next({
        texto: 'La impresora detectada no tiene una cola local para compartir.',
        color: NotificacionColor.warn,
        duracion: 5,
      });
      return;
    }
    // Pedimos la contraseña de admin de esta PC (sudo) + el servidor destino (central o filial).
    const config = this.configuracionService.getConfig();
    this.dialog
      .open(CredencialesCupsDialogComponent, {
        autoFocus: true,
        restoreFocus: true,
        data: {
          modo: 'compartir',
          usuario: this.miUsuario,
          // Vacío a propósito: la IP de esta PC se DERIVA de la ruta hacia el servidor destino
          // (no se adivina). Este campo es override manual opcional.
          ip: '',
          cola: colaLocal,
          centralIp: config?.serverCentralIp ?? '',
          centralPort: config?.serverCentralPort ?? '8081',
          filialIp: config?.serverIp ?? '',
          filialPort: config?.serverPort ?? '8082',
          destino: 'CENTRAL',
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((cred: CredencialesCupsResult | undefined) => {
        if (cred == null) {
          return; // canceló
        }
        this.ejecutarCompartir(d, colaLocal, cred);
      });
  }

  private ejecutarCompartir(
    d: DetectadaVista,
    colaLocal: string,
    cred: CredencialesCupsResult,
  ): void {
    if (!cred.servidorIp) {
      this.notificacion.notification$.next({
        texto: 'Ingresá la IP del servidor destino.',
        color: NotificacionColor.warn,
        duracion: 5,
      });
      return;
    }
    this.compartiendo = true;
    this.cdr.markForCheck();
    this.electronService.shareLocalPrinter(colaLocal, cred.password, cred.servidorIp)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (!res || !res.success) {
            this.compartiendo = false;
            this.notificacion.notification$.next({
              texto: res?.error
                ? 'No se pudo compartir la impresora local: ' + res.error
                : 'No se pudo compartir la impresora local (verificá permisos de CUPS).',
              color: NotificacionColor.warn,
              duracion: 6,
            });
            this.cdr.markForCheck();
            return;
          }
          // Aviso no bloqueante si el hardening de firewall no se pudo aplicar.
          if (res.aviso) {
            this.notificacion.notification$.next({
              texto: res.aviso,
              color: NotificacionColor.warn,
              duracion: 7,
            });
          }
          // IP de esta PC que el servidor puede rutear: prioridad al override manual que el usuario
          // escribió; si no, la DERIVADA de la ruta hacia el servidor destino (res.ip). Nunca se
          // adivina por prefijo: si no hay ninguna, se aborta pidiendo la IP a mano.
          const cola = this.sanearCola(d.ref?.name || d.nombre);
          const pcIp = (cred.pcIp || res.ip || '').trim();
          if (!pcIp) {
            this.compartiendo = false;
            this.notificacion.notification$.next({
              texto: 'No se pudo determinar la IP de esta PC hacia el servidor ('
                + (cred.servidorIp || 's/IP') + '). Ingresá la IP de esta PC manualmente en el diálogo.',
              color: NotificacionColor.warn,
              duracion: 9,
            });
            this.cdr.markForCheck();
            return;
          }
          const uri = `ipp://${pcIp}:631/printers/${cola}`;
          this.instalarEnServidorPorIp(d, cola, uri, cred);
        },
        error: () => {
          this.compartiendo = false;
          this.cdr.markForCheck();
        },
      });
  }

  /** Instala en el servidor destino (por IP) una cola CUPS que apunta a la URI IPP de esta PC. */
  private instalarEnServidorPorIp(
    d: DetectadaVista,
    cola: string,
    uri: string,
    cred: CredencialesCupsResult,
  ): void {
    // La térmica se decide por el Tipo que elegís (default Térmica), NO por el nombre: si renombrás
    // la impresora, el regex de nombre ya no la reconoce y el backend instalaría con -m everywhere,
    // que falla en una térmica RAW ("Printer does not support required IPP attributes"). Una térmica
    // debe instalarse siempre RAW (-m raw).
    const esTermica = this.tipoControl.value === 'TERMICA';
    const servidorIp = cred.servidorIp;
    const servidorPort = cred.servidorPort || (cred.esCentral ? '8081' : '8082');
    const destino = cred.esCentral ? 'central' : 'filial';
    this.impresoraService
      .instalarEnServidorPorIp(cola, uri, esTermica, servidorIp, servidorPort, cred.esCentral)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (ok) => {
          this.compartiendo = false;
          if (ok) {
            this.notificacion.notification$.next({
              texto: 'Impresora compartida e instalada en el ' + destino + ' (' + servidorIp + '): ' + cola,
              color: NotificacionColor.success,
              duracion: 4,
            });
            if (!this.nombreControl.value) {
              this.nombreControl.setValue(d.nombre);
            }
            // Routing: la impresora "vive" en el host que instaló la cola. Para el central es la
            // sucursal 0; para una filial no conocemos su sucursalId acá, así que lo elige el usuario.
            if (cred.esCentral) {
              this.sucursalControl.setValue(HOST_SERVIDOR_CENTRAL_ID);
            } else {
              this.notificacion.notification$.next({
                texto: 'Elegí la sucursal de la filial destino antes de guardar (para el ruteo de impresión).',
                color: NotificacionColor.warn,
                duracion: 7,
              });
            }
            this.conexionControl.setValue('CUPS');
            this.colaCupsControl.setValue(cola);
            this.tipoControl.setValue(esTermica ? 'TERMICA' : 'NORMAL');
            this.perfilPapelControl.setValue(esTermica ? 'MM_58' : 'A4');
          } else {
            this.notificacion.notification$.next({
              texto: 'Se compartió la cola local pero el ' + destino + ' (' + servidorIp + ') no pudo instalarla. '
                + 'Verificá permisos de CUPS del backend y que alcance esta PC.',
              color: NotificacionColor.warn,
              duracion: 8,
            });
          }
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.compartiendo = false;
          const detalle = e?.message || (e?.status === 0
            ? 'no se pudo contactar al ' + destino + ' (' + servidorIp + ':' + servidorPort + ')'
            : 'error desconocido');
          this.notificacion.notification$.next({
            texto: 'El ' + destino + ' (' + servidorIp + ') rechazó la instalación: ' + detalle,
            color: NotificacionColor.warn,
            duracion: 10,
          });
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Detecta dispositivos conectados (USB/red) que aún NO tienen cola creada, para
   * instalarlos. Corre en el backend local/filial (donde está físicamente la impresora).
   */
  detectarParaInstalar(): void {
    const enCentral = this.origenBusquedaControl.value === 'CENTRAL';
    this.buscandoDispositivos = true;
    this.cdr.markForCheck();
    this.impresoraService.dispositivos(enCentral)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.dispositivos = (res ?? []).map((d) => this.mapearDispositivo(d));
          this.buscandoDispositivos = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.dispositivos = [];
          this.buscandoDispositivos = false;
          this.cdr.markForCheck();
        },
      });
  }

  private mapearDispositivo(d: DispositivoDetectado): DispositivoVista {
    const vista: DispositivoVista = {
      ref: d,
      nombre: d.nombre,
      detalle: `${d.clase} · ${d.uri}`,
      puedeIp: false,
      ip: null,
      puerto: 9100,
    };
    const uri = d.uri || '';
    const m = uri.match(/^socket:\/\/([^:/?]+)(?::(\d+))?/i);
    if (m) {
      vista.puedeIp = true;
      vista.ip = m[1];
      vista.puerto = m[2] ? parseInt(m[2], 10) : 9100;
    }
    return vista;
  }

  /** Usa el dispositivo de red directo por IP (conexión RED, sin instalar cola CUPS). */
  usarPorIp(v: DispositivoVista): void {
    if (!this.nombreControl.value) {
      this.nombreControl.setValue(v.nombre);
    }
    this.conexionControl.setValue('RED');
    this.ipControl.setValue(v.ip);
    this.puertoControl.setValue(v.puerto);
    this.cdr.markForCheck();
  }

  /**
   * Instala el dispositivo como cola CUPS (RAW si parece térmica). Por defecto lo instala en ESTA
   * PC vía Electron (sin pasar por el servidor). Si el origen de búsqueda es el CENTRAL (el
   * dispositivo está conectado al host central), lo instala el backend central.
   */
  instalarDispositivo(v: DispositivoVista): void {
    if (!this.exigirNombreParaInstalar()) { return; }
    const d = v.ref;
    const enCentral = this.origenBusquedaControl.value === 'CENTRAL';
    // La cola CUPS toma el Nombre que definió el usuario, para identificarla igual en CUPS.
    const cola = this.sanearCola(this.nombreControl.value);
    const esTermica = REGEX_TERMICA.test(`${d.nombre || ''} ${d.descripcion || ''}`);
    const autocompletar = (colaFinal: string) => {
      if (!this.nombreControl.value) {
        this.nombreControl.setValue(d.nombre || colaFinal);
      }
      this.colaCupsControl.setValue(colaFinal);
      this.conexionControl.setValue(this.esWindows ? 'USB' : 'CUPS');
      this.tipoControl.setValue(esTermica ? 'TERMICA' : 'NORMAL');
      this.perfilPapelControl.setValue(esTermica ? 'MM_58' : 'A4');
      this.detectarImpresorasLocales();
      this.detectarParaInstalar();
    };
    if (enCentral) {
      // El dispositivo está conectado al host central → lo instala el backend central.
      this.instalarEnBackend(cola, d.uri, esTermica, true, 'Impresora instalada: ' + cola, autocompletar);
      return;
    }
    // Por defecto: instala en esta PC vía Electron (sin pasar por el servidor).
    this.instalarEnEstaPc(cola, d.uri, esTermica, null, autocompletar);
  }

  /**
   * Instala la impresora en ESTA PC vía Electron (lpadmin en Linux / Add-Printer en Windows), sin
   * pasar por el servidor. Si CUPS necesita permisos de admin, pide la contraseña de sudo y
   * reintenta. onOk recibe el nombre de cola realmente creado.
   */
  private instalarEnEstaPc(
    cola: string,
    uri: string,
    raw: boolean,
    password: string | null,
    onOk: (cola: string) => void,
  ): void {
    this.instalando = true;
    this.cdr.markForCheck();
    this.electronService.installLocalPrinter(cola, uri, raw, password ?? undefined)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.instalando = false;
            this.notificacion.notification$.next({
              texto: 'Impresora instalada en esta PC: ' + (res.cola || cola),
              color: NotificacionColor.success,
              duracion: 3,
            });
            onOk(res.cola || cola);
            this.cdr.markForCheck();
            return;
          }
          // Linux: CUPS necesita permisos de admin → pedimos la contraseña de sudo y reintentamos.
          if (res?.needsPassword && !password) {
            this.instalando = false;
            this.cdr.markForCheck();
            this.dialog
              .open(CredencialesCupsDialogComponent, {
                autoFocus: true,
                restoreFocus: true,
                data: { modo: 'instalar-local', usuario: this.miUsuario, cola },
              })
              .afterClosed()
              .pipe(untilDestroyed(this))
              .subscribe((cred: CredencialesCupsResult | undefined) => {
                if (cred == null) {
                  return; // canceló
                }
                this.instalarEnEstaPc(cola, uri, raw, cred.password, onOk);
              });
            return;
          }
          this.instalando = false;
          this.notificacion.notification$.next({
            texto: 'No se pudo instalar en esta PC: ' + (res?.error || 'verificá permisos de CUPS'),
            color: NotificacionColor.warn,
            duracion: 6,
          });
          this.cdr.markForCheck();
        },
        error: () => {
          this.instalando = false;
          this.cdr.markForCheck();
        },
      });
  }

  /** Instala la cola en el backend (central/filial) vía GraphQL — solo para el host del servidor. */
  private instalarEnBackend(
    cola: string,
    uri: string,
    raw: boolean,
    enCentral: boolean,
    textoOk: string,
    onOk: (cola: string) => void,
  ): void {
    this.instalando = true;
    this.cdr.markForCheck();
    this.impresoraService.instalar(cola, uri, raw, enCentral)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (ok) => {
          this.instalando = false;
          if (ok) {
            this.notificacion.notification$.next({
              texto: textoOk,
              color: NotificacionColor.success,
              duracion: 3,
            });
            onOk(cola);
          } else {
            this.notificacion.notification$.next({
              texto: 'No se pudo instalar (verificá permisos de CUPS del backend).',
              color: NotificacionColor.warn,
              duracion: 5,
            });
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.instalando = false;
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Descubre impresoras de RED (Wi-Fi/Ethernet) por mDNS/DNS-SD desde el frontend (Electron).
   * Independiente de la detección por cable/USB (que sigue corriendo en el backend por lpinfo).
   * Detecta Epson, HP, Brother, Canon, etc. sin instalar nada: la UI decide usarla por IP o
   * instalarla como cola CUPS.
   */
  detectarImpresorasRed(): void {
    this.buscandoRed = true;
    this.cdr.markForCheck();
    this.electronService.detectNetworkPrinters()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.impresorasRed = (res ?? []).map((p) => this.mapearRed(p));
          this.buscandoRed = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.impresorasRed = [];
          this.buscandoRed = false;
          this.cdr.markForCheck();
        },
      });
  }

  private mapearRed(p: NetworkPrinter): RedVista {
    const esTermica = REGEX_TERMICA.test(`${p.nombre || ''} ${p.modelo || ''}`);
    const protocolos = (p.protocolos && p.protocolos.length) ? p.protocolos.join(', ') : 'red';
    const modelo = p.modelo ? ` · ${p.modelo}` : '';
    return {
      ref: p,
      nombre: p.nombre,
      detalle: `${p.ip}:${p.puerto}${modelo} · ${protocolos}`,
      esTermica,
    };
  }

  /** Usa la impresora de red directo por IP (conexión RED, sin instalar cola CUPS). */
  usarPorIpRed(v: RedVista): void {
    if (!this.nombreControl.value) {
      this.nombreControl.setValue(v.nombre);
    }
    this.conexionControl.setValue('RED');
    this.ipControl.setValue(v.ref.ip);
    this.puertoControl.setValue(v.ref.puerto);
    this.tipoControl.setValue(v.esTermica ? 'TERMICA' : 'NORMAL');
    this.perfilPapelControl.setValue(v.esTermica ? 'MM_58' : 'A4');
    this.cdr.markForCheck();
  }

  /**
   * Instala la impresora de red como cola CUPS via el backend existente. La forma de instalar
   * depende del tipo, porque el backend hace `lpadmin -m {raw|everywhere}`:
   *  - Térmica → cola RAW (`-m raw`) sobre `socket://ip:9100` (ESC/POS crudo).
   *  - Normal  → driverless IPP Everywhere (`-m everywhere`) sobre `ipp://ip:631/ipp/print`, que es
   *    la instalación "de forma normal" (imprime documentos con el driver de la impresora). OJO:
   *    `-m everywhere` NO funciona con `socket://`, necesita una URI IPP.
   */
  instalarRed(v: RedVista): void {
    if (!this.exigirNombreParaInstalar()) { return; }
    const enCentral = this.origenBusquedaControl.value === 'CENTRAL';
    // La cola CUPS toma el Nombre que definió el usuario, para identificarla igual en CUPS.
    const cola = this.sanearCola(this.nombreControl.value);
    const { uri, raw } = this.resolverInstalacionRed(v);
    const autocompletar = (colaFinal: string) => {
      if (!this.nombreControl.value) {
        this.nombreControl.setValue(v.nombre || colaFinal);
      }
      this.colaCupsControl.setValue(colaFinal);
      this.conexionControl.setValue(this.esWindows ? 'USB' : 'CUPS');
      this.tipoControl.setValue(v.esTermica ? 'TERMICA' : 'NORMAL');
      this.perfilPapelControl.setValue(v.esTermica ? 'MM_58' : 'A4');
      this.detectarImpresorasLocales();
    };
    if (enCentral) {
      // Instala la cola de red en el host central (el central nunca tiene USB, imprime por red).
      this.instalarEnBackend(cola, uri, raw, true, 'Impresora de red instalada: ' + cola, autocompletar);
      return;
    }
    // Por defecto: instala en esta PC vía Electron (sin pasar por el servidor).
    this.instalarEnEstaPc(cola, uri, raw, null, autocompletar);
  }

  /**
   * URI + modo para instalar una impresora de red como cola del sistema. Se instala como cola RAW
   * (`-m raw`) sobre `socket://ip:9100` — la forma directa "como agrega Linux una impresora de red"
   * sin depender de IPP. Si solo expone LPD (515), usa `lpd://`. Último recurso: la URI del backend.
   */
  private resolverInstalacionRed(v: RedVista): { uri: string; raw: boolean } {
    const p = v.ref;
    const tieneRaw = p.protocolos?.includes('raw:9100');
    const tieneLpd = p.protocolos?.includes('lpd');
    if (tieneRaw) {
      return { uri: `socket://${p.ip}:9100`, raw: true };
    }
    if (tieneLpd) {
      return { uri: `lpd://${p.ip}/queue`, raw: true };
    }
    return { uri: p.uri, raw: true };
  }

  /**
   * Exige que el usuario haya escrito un Nombre antes de instalar: ese Nombre se usa como nombre de
   * la cola CUPS, para que la impresora se identifique con el mismo nombre en la interfaz de CUPS.
   */
  private exigirNombreParaInstalar(): boolean {
    if (!(this.nombreControl.value || '').trim()) {
      this.notificacion.notification$.next({
        texto: 'Escribí primero el Nombre de la impresora: se usará como nombre de la cola en CUPS.',
        color: NotificacionColor.warn,
        duracion: 6,
      });
      return false;
    }
    return true;
  }

  private sanearCola(texto: string): string {
    const limpio = (texto || '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 40);
    return limpio || 'impresora';
  }

  private cargarSucursales(): void {
    this.sucursalService.onGetAllSucursales(true)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        // Incluimos la sucursal central (id 0) para poder registrar impresoras del servidor central.
        this.sucursales = res ?? [];
        this.cdr.markForCheck();
      });
  }

  /** Detecta la IP LAN de esta PC (para compartir la impresora local al servidor central). */
  private detectarMiIp(): void {
    this.electronService.getLocalIp()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (info) => {
          this.miIp = info?.mejor ?? null;
          this.miUsuario = info?.usuario ?? null;
          this.cdr.markForCheck();
        },
        error: () => { /* sin IP detectada: se puede cargar a mano */ },
      });
  }

  private cargarDatos(i: Impresora): void {
    this.impresoraId = i.id;
    this.nombreControl.setValue(i.nombre);
    this.activoControl.setValue(i.activo);
    this.esPredeterminadaControl.setValue(i.esPredeterminada);
    this.sucursalControl.setValue(i.sucursal ? i.sucursal.id : null);
    this.tipoControl.setValue(i.tipo ?? 'TERMICA');
    this.usoControl.setValue(i.uso);
    this.conexionControl.setValue(i.conexion ?? 'CUPS');
    this.colaCupsControl.setValue(i.colaCups);
    this.ipControl.setValue(i.ip);
    this.puertoControl.setValue(i.puerto ?? 9100);
    this.perfilPapelControl.setValue(i.perfilPapel ?? 'MM_58');
    this.columnasControl.setValue(i.columnas);
    this.anchoMmControl.setValue(i.anchoMm);
    this.altoMmControl.setValue(i.altoMm);
    this.marcaControl.setValue(i.marca);
    this.codepageControl.setValue(i.codepage);
    this.cdr.markForCheck();
  }

  private actualizarVisibilidadConexion(conexion: string): void {
    this.esConexionRed = conexion === 'RED';
    this.cdr.markForCheck();
  }

  private actualizarVisibilidadPapel(perfil: string): void {
    this.esPapelHoja = perfil === 'A4' || perfil === 'CARTA' || perfil === 'CUSTOM';
    this.cdr.markForCheck();
  }

  cargarColasSistema(): void {
    const enCentral = this.origenBusquedaControl.value === 'CENTRAL';
    this.impresoraService.delSistema(enCentral)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.colasSistema = res ?? [];
        this.cdr.markForCheck();
      });
  }

  seleccionarCola(cola: string): void {
    this.colaCupsControl.setValue(cola);
  }

  guardar(): void {
    if (!this.formGroup.valid) {
      return;
    }
    const modelo = new Impresora();
    modelo.id = this.impresoraId;
    modelo.nombre = this.nombreControl.value;
    modelo.activo = this.activoControl.value;
    modelo.esPredeterminada = this.esPredeterminadaControl.value;
    modelo.sucursal = this.sucursales.find((s) => s.id === this.sucursalControl.value) ?? null;
    modelo.tipo = this.tipoControl.value as TipoImpresora;
    modelo.uso = this.usoControl.value as UsoImpresora;
    modelo.conexion = this.conexionControl.value as TipoConexion;
    modelo.colaCups = this.colaCupsControl.value;
    modelo.ip = this.ipControl.value;
    modelo.puerto = this.puertoControl.value;
    modelo.perfilPapel = this.perfilPapelControl.value as PerfilPapel;
    modelo.columnas = this.columnasControl.value;
    modelo.anchoMm = this.anchoMmControl.value;
    modelo.altoMm = this.altoMmControl.value;
    modelo.marca = this.marcaControl.value;
    modelo.codepage = this.codepageControl.value;

    const input: ImpresoraInput = modelo.toInput();
    this.impresoraService.guardar(input)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dialogRef.close(res);
        }
      });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}

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
import { ElectronService, PrinterInfo } from '../../../../commons/core/electron/electron.service';
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
   * Comparte esta impresora local (conectada a esta PC) al SERVIDOR CENTRAL por la IP de esta PC:
   * 1) Electron habilita el compartir en el CUPS local y devuelve la URI IPP (ipp://<mi-ip>:631/printers/<cola>).
   * 2) El central instala una cola CUPS apuntando a esa URI (RAW si es térmica) → alcanza la impresora por la red.
   * 3) Autocompleta el formulario para registrar la impresora en el host servidor central (sucursalId=0).
   */
  compartirAlCentral(d: DetectadaVista): void {
    const colaLocal = d.ref?.name;
    if (!colaLocal) {
      this.notificacion.notification$.next({
        texto: 'La impresora detectada no tiene una cola local para compartir.',
        color: NotificacionColor.warn,
        duracion: 5,
      });
      return;
    }
    // Pedimos la contraseña de admin de esta PC (sudo) + la IP del central donde instalar la cola.
    const config = this.configuracionService.getConfig();
    this.dialog
      .open(CredencialesCupsDialogComponent, {
        autoFocus: true,
        restoreFocus: true,
        data: {
          usuario: this.miUsuario,
          ip: this.miIp,
          cola: colaLocal,
          centralIp: config?.serverCentralIp ?? '',
          centralPort: config?.serverCentralPort ?? '8081',
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((cred: CredencialesCupsResult | undefined) => {
        if (cred == null) {
          return; // canceló
        }
        const centralPort = cred.centralPort || config?.serverCentralPort || '8081';
        this.ejecutarCompartir(d, colaLocal, cred, centralPort);
      });
  }

  private ejecutarCompartir(
    d: DetectadaVista,
    colaLocal: string,
    cred: CredencialesCupsResult,
    centralPort: string,
  ): void {
    if (!cred.centralIp) {
      this.notificacion.notification$.next({
        texto: 'Ingresá la IP del servidor central.',
        color: NotificacionColor.warn,
        duracion: 5,
      });
      return;
    }
    this.compartiendo = true;
    this.cdr.markForCheck();
    this.electronService.shareLocalPrinter(colaLocal, cred.password)
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
          // Armamos la URI con la IP de esta PC elegida (puede diferir de la auto-detectada).
          const cola = this.sanearCola(d.ref?.name || d.nombre);
          const pcIp = cred.pcIp || res.ip || this.miIp;
          const uri = `ipp://${pcIp}:631/printers/${cola}`;
          this.instalarEnCentralPorIp(d, cola, uri, cred.centralIp, centralPort);
        },
        error: () => {
          this.compartiendo = false;
          this.cdr.markForCheck();
        },
      });
  }

  /** Instala en el servidor central (por IP) una cola CUPS que apunta a la URI IPP de esta PC. */
  private instalarEnCentralPorIp(
    d: DetectadaVista,
    cola: string,
    uri: string,
    centralIp: string,
    centralPort: string,
  ): void {
    const esTermica = d.esTermica;
    this.impresoraService.instalarEnCentralPorIp(cola, uri, esTermica, centralIp, centralPort)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (ok) => {
          this.compartiendo = false;
          if (ok) {
            this.notificacion.notification$.next({
              texto: 'Impresora compartida e instalada en el central (' + centralIp + '): ' + cola,
              color: NotificacionColor.success,
              duracion: 4,
            });
            if (!this.nombreControl.value) {
              this.nombreControl.setValue(d.nombre);
            }
            this.sucursalControl.setValue(HOST_SERVIDOR_CENTRAL_ID);
            this.conexionControl.setValue('CUPS');
            this.colaCupsControl.setValue(cola);
            this.tipoControl.setValue(esTermica ? 'TERMICA' : 'NORMAL');
            this.perfilPapelControl.setValue(esTermica ? 'MM_58' : 'A4');
          } else {
            this.notificacion.notification$.next({
              texto: 'Se compartió la cola local pero el central (' + centralIp + ') no pudo instalarla. '
                + 'Verificá permisos de CUPS del backend central y que alcance esta PC.',
              color: NotificacionColor.warn,
              duracion: 8,
            });
          }
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.compartiendo = false;
          const detalle = e?.message || (e?.status === 0
            ? 'no se pudo contactar al central (' + centralIp + ':' + centralPort + ')'
            : 'error desconocido');
          this.notificacion.notification$.next({
            texto: 'El central (' + centralIp + ') rechazó la instalación: ' + detalle,
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

  /** Instala el dispositivo como cola CUPS (RAW si parece térmica) y lo deja listo. */
  instalarDispositivo(v: DispositivoVista): void {
    const d = v.ref;
    const enCentral = this.origenBusquedaControl.value === 'CENTRAL';
    const cola = this.sanearCola(d.nombre || d.uri);
    const esTermica = REGEX_TERMICA.test(`${d.nombre || ''} ${d.descripcion || ''}`);
    this.instalando = true;
    this.cdr.markForCheck();
    this.impresoraService.instalar(cola, d.uri, esTermica, enCentral)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (ok) => {
          this.instalando = false;
          if (ok) {
            this.notificacion.notification$.next({
              texto: 'Impresora instalada: ' + cola,
              color: NotificacionColor.success,
              duracion: 3,
            });
            if (!this.nombreControl.value) {
              this.nombreControl.setValue(d.nombre || cola);
            }
            this.colaCupsControl.setValue(cola);
            this.conexionControl.setValue(this.esWindows ? 'USB' : 'CUPS');
            this.tipoControl.setValue(esTermica ? 'TERMICA' : 'NORMAL');
            this.perfilPapelControl.setValue(esTermica ? 'MM_58' : 'A4');
            this.detectarImpresorasLocales();
            this.detectarParaInstalar();
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

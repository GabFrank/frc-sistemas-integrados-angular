import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { ElectronService, LocalDevice, PrinterInfo } from '../../../../commons/core/electron/electron.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ConfiguracionService, ImpresoraLocalConfig, PerfilPapelLocal } from '../../../services/configuracion.service';

/**
 * Detecta una impresora USB conectada a ESTA PC, la instala en el SO (CUPS `-m raw` en Linux,
 * "Generic / Text Only" en Windows), le da un nombre y la prueba imprimiendo desde Electron, sin
 * pasar por ningún backend. También permite elegir una impresora que YA estaba instalada en el SO.
 * Persiste la `ImpresoraLocalConfig` en config-backup.json vía ConfiguracionService.
 */
@Component({
  selector: 'app-impresora-local-dialog',
  templateUrl: './impresora-local-dialog.component.html',
  styleUrls: ['./impresora-local-dialog.component.scss']
})
export class ImpresoraLocalDialogComponent {
  readonly perfiles: { value: PerfilPapelLocal; label: string }[] = [
    { value: 'MM_48', label: '48 mm (32 columnas)' },
    { value: 'MM_58', label: '58 mm (32 columnas)' },
    { value: 'MM_72', label: '72 mm (42 columnas)' },
    { value: 'MM_80', label: '80 mm (48 columnas)' },
  ];

  dispositivos: LocalDevice[] = [];
  dispositivoControl = new FormControl<LocalDevice>(null);
  instaladas: PrinterInfo[] = [];
  instaladaControl = new FormControl<string>(null);
  nombreControl = new FormControl<string>('', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]);
  perfilControl = new FormControl<PerfilPapelLocal>('MM_58', Validators.required);
  passwordControl = new FormControl<string>('');

  detectando = false;
  detectado = false;
  instalando = false;
  probando = false;
  pidePassword = false;
  esElectron: boolean;

  /** Cola efectivamente instalada en el SO (puede diferir del nombre si Windows reusó una por PnP). */
  cola: string = null;
  uri: string = null;
  conexion: 'USB' | 'SISTEMA' = 'USB';

  constructor(
    private dialogRef: MatDialogRef<ImpresoraLocalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: ImpresoraLocalConfig | null,
    private electronService: ElectronService,
    private notificacion: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef,
    private configService: ConfiguracionService,
  ) {
    this.esElectron = electronService.isElectron;
    if (data) {
      this.nombreControl.setValue(data.nombre);
      this.perfilControl.setValue(data.perfil || 'MM_58');
      this.cola = data.cola;
      this.uri = data.uri;
      this.conexion = data.conexion || 'USB';
    }
  }

  onDetectar(): void {
    if (!this.esElectron) {
      return;
    }
    this.detectando = true;
    // Una fuente que falle no tapa a la otra: cada lista cae a [] por su cuenta.
    forkJoin({
      usb: this.electronService.detectLocalDevices().pipe(catchError(() => of([] as LocalDevice[]))),
      sistema: this.electronService.getPrinters().pipe(catchError(() => of([] as PrinterInfo[]))),
    }).pipe(take(1)).subscribe({
      next: ({ usb, sistema }) => {
        // Solo USB: en Linux `lpinfo -v` también lista backends de red/serie que acá no interesan.
        this.dispositivos = (usb || []).filter((d) => /^usb(win)?:\/\//i.test(d.uri));
        this.instaladas = sistema || [];
        if (this.conexion === 'SISTEMA' && this.instaladas.some((p) => p.name === this.cola)) {
          this.instaladaControl.setValue(this.cola, { emitEvent: false });
        }
        this.detectado = true;
        this.detectando = false;
        if (this.dispositivos.length === 1) {
          this.dispositivoControl.setValue(this.dispositivos[0]);
        }
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.detectando = false;
        this.notificacion.openAlgoSalioMal(e?.message || 'No se pudo detectar dispositivos');
        this.cdr.markForCheck();
      },
    });
  }

  onInstalar(): void {
    const dispositivo = this.dispositivoControl.value;
    if (!dispositivo || this.nombreControl.invalid) {
      this.nombreControl.markAsTouched();
      return;
    }
    const nombre = this.nombreControl.value.trim().toUpperCase();
    const password = this.pidePassword ? this.passwordControl.value || undefined : undefined;
    this.instalando = true;
    this.electronService.installLocalPrinter(nombre, dispositivo.uri, true, password).pipe(take(1)).subscribe({
      next: (res) => {
        this.instalando = false;
        if (res?.success) {
          this.cola = res.cola || nombre;
          this.uri = res.uri || dispositivo.uri;
          this.conexion = 'USB';
          this.instaladaControl.setValue(null, { emitEvent: false });
          this.pidePassword = false;
          this.passwordControl.setValue('');
          // Se persiste ya: no hace falta volver a instalar ni configurar al reabrir la app.
          this.configService.guardarImpresoraLocal(this.armarConfig());
          this.notificacion.notification$.next({
            texto: 'Impresora instalada en esta PC: ' + this.cola,
            color: NotificacionColor.success,
            duracion: 3,
          });
        } else if (res?.needsPassword && !password) {
          // Linux: CUPS pide permisos de admin → se muestra el campo de contraseña y se reintenta.
          this.pidePassword = true;
          this.notificacion.openWarn('CUPS necesita permisos de administrador: ingresá tu contraseña y volvé a instalar.', 5);
        } else {
          this.notificacion.openAlgoSalioMal(res?.error || 'No se pudo instalar la impresora', 6);
        }
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.instalando = false;
        this.notificacion.openAlgoSalioMal(e?.message || 'No se pudo instalar la impresora', 6);
        this.cdr.markForCheck();
      },
    });
  }

  /** Usa una cola que ya existía en el SO: no se instala nada, se persiste directo. */
  onUsarInstalada(): void {
    const nombreCola = this.instaladaControl.value;
    if (!nombreCola) {
      return;
    }
    this.cola = nombreCola;
    this.uri = null;
    this.conexion = 'SISTEMA';
    this.dispositivoControl.setValue(null);
    // El nombre visible respeta el mismo patrón que el de una instalación nueva.
    this.nombreControl.setValue(nombreCola.replace(/[^A-Za-z0-9_-]/g, '_').toUpperCase());
    this.configService.guardarImpresoraLocal(this.armarConfig());
    this.notificacion.notification$.next({
      texto: 'Se usará la impresora del sistema: ' + nombreCola,
      color: NotificacionColor.success,
      duracion: 3,
    });
    this.cdr.markForCheck();
  }

  onProbar(): void {
    if (!this.cola) {
      return;
    }
    this.probando = true;
    this.electronService.printTestLocal({
      conexion: this.conexion,
      cola: this.cola,
      nombre: (this.nombreControl.value || this.cola).toUpperCase(),
      perfil: this.perfilControl.value,
    }).pipe(take(1)).subscribe({
      next: (res) => {
        this.probando = false;
        if (res?.success) {
          this.notificacion.notification$.next({
            texto: 'Prueba enviada a ' + this.cola,
            color: NotificacionColor.success,
            duracion: 3,
          });
        } else {
          this.notificacion.openAlgoSalioMal(res?.error || 'No se pudo imprimir la prueba', 6);
        }
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.probando = false;
        this.notificacion.openAlgoSalioMal(e?.message || 'No se pudo imprimir la prueba', 6);
        this.cdr.markForCheck();
      },
    });
  }

  onQuitar(): void {
    // Olvida la impresora en la config de esta PC; la cola sigue instalada en el SO.
    this.configService.guardarImpresoraLocal(null);
    this.dialogRef.close(true);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }

  onGuardar(): void {
    if (!this.cola) {
      return;
    }
    // Guarda cambios hechos después de instalar (ej. el ancho de papel).
    this.configService.guardarImpresoraLocal(this.armarConfig());
    this.dialogRef.close(true);
  }

  private armarConfig(): ImpresoraLocalConfig {
    return {
      nombre: (this.nombreControl.value || this.cola).trim().toUpperCase(),
      cola: this.cola,
      uri: this.uri,
      conexion: this.conexion,
      perfil: this.perfilControl.value || 'MM_58',
    };
  }
}

import { Injectable, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { MainService } from '../../main.service';
import { electronBridge } from '../../commons/core/electron/electron-bridge';
import { esVersionMenorQueMinima, leerVersion } from '../../commons/core/utils/versionUtils';
import { VersionClienteService } from '../../modules/configuracion/version-cliente/version-cliente.service';
import {
  VersionNoHabilitadaData,
  VersionNoHabilitadaDialogComponent
} from '../components/version-no-habilitada-dialog/version-no-habilitada-dialog.component';

/**
 * Control de versión mínima del desktop. En cada login pregunta al central `versionMinimaDesktop`;
 * si la versión que corre (la de Electron, `app.getVersion()`) es menor, abre un diálogo que no se
 * puede cerrar: actualizar o cerrar la sesión.
 *
 * No bloquea nunca por duda: si la consulta falla (un central que no la conoce, la red), si no hay
 * mínima, o si la versión instalada no se puede leer (en un navegador, `ng serve`), sigue de largo.
 *
 * Se instancia desde `AppComponent`, así escucha el login desde el arranque.
 */
@Injectable({ providedIn: 'root' })
export class VersionMinimaDesktopService implements OnDestroy {

  private authSub: Subscription;
  private dialogRef: MatDialogRef<VersionNoHabilitadaDialogComponent> | null = null;
  private consultando = false;

  constructor(
    private mainService: MainService,
    private versionClienteService: VersionClienteService,
    private matDialog: MatDialog,
  ) {
    this.authSub = this.mainService.authenticationSub
      .pipe(filter((auth) => !!auth))
      .subscribe(() => this.verificar());
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  /** La versión que corre; null fuera de Electron. */
  private versionInstalada(): string | null {
    try {
      const v = electronBridge()?.sendSync('get-app-version');
      return leerVersion(v) ? v : null;
    } catch {
      return null;
    }
  }

  private verificar(): void {
    if (this.dialogRef || this.consultando) return;
    const actual = this.versionInstalada();
    if (actual == null) return;
    this.consultando = true;
    this.versionClienteService
      .onGetVersionMinimaEnSegundoPlano()
      .pipe(take(1))
      .subscribe({
        next: (minima) => {
          this.consultando = false;
          if (esVersionMenorQueMinima(actual, minima)) this.bloquear(actual, minima);
        },
        // Un central sin la consulta, o sin red: no hay control.
        error: () => (this.consultando = false),
      });
  }

  private bloquear(versionActual: string, versionMinima: string): void {
    if (this.dialogRef) return;
    const data: VersionNoHabilitadaData = { versionActual, versionMinima };
    this.dialogRef = this.matDialog.open(VersionNoHabilitadaDialogComponent, {
      data,
      disableClose: true,
      width: '480px',
    });
    this.dialogRef.afterClosed().pipe(take(1)).subscribe(() => (this.dialogRef = null));
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { UsuarioService } from '../../../personas/usuarios/usuario.service';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';

export interface GestionarAccesosCajaData {
  cajaVirtual: CajaVirtual;
}

interface AccesoRow {
  id: number;
  usuarioId: number;
  nickname: string;
  nombre: string;
  puedeLeer: boolean;
  puedeEscribir: boolean;
  otorgadoPor: string;
}

/**
 * Lista de usuarios habilitados en una caja.
 *
 * <p>El rol de tesorería habilita la capacidad (ver / mover plata); esta lista delimita sobre
 * qué cajas. El responsable de la caja no figura acá: tiene acceso total implícito y es quien
 * administra la lista — por eso el diálogo solo se le ofrece a él (y a un ADMIN). El backend
 * lo verifica igual; esconder la opción es comodidad, no seguridad.</p>
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-gestionar-accesos-caja-dialog',
  templateUrl: './gestionar-accesos-caja-dialog.component.html',
  styleUrls: ['./gestionar-accesos-caja-dialog.component.scss']
})
export class GestionarAccesosCajaDialogComponent implements OnInit {

  displayedColumns = ['usuario', 'leer', 'escribir', 'otorgadoPor', 'acciones'];
  dataSource = new MatTableDataSource<AccesoRow>([]);
  isLoading = true;
  isSaving = false;

  /** Alta: buscador de usuario + los dos permisos. */
  usuarioControl = new FormControl(null);
  usuariosFiltrados: Usuario[] = [];
  nuevoPuedeEscribir = false;

  responsableNombre = '';

  displayUsuario = (u: Usuario): string =>
    u ? (u.persona?.nombre ? `${u.persona.nombre} (${u.nickname})` : u.nickname) : '';

  constructor(
    private dialogRef: MatDialogRef<GestionarAccesosCajaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionarAccesosCajaData,
    private cajaVirtualService: CajaVirtualService,
    private usuarioService: UsuarioService,
    private dialogos: DialogosService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    const resp = this.data.cajaVirtual?.usuario;
    this.responsableNombre = resp
      ? (resp.persona?.nombre ? `${resp.persona.nombre} (${resp.nickname})` : resp.nickname)
      : '—';

    this.usuarioControl.valueChanges.pipe(untilDestroyed(this)).subscribe(val => {
      if (typeof val === 'string' && val.trim().length >= 2) {
        this.usuarioService.onSearchUsuarioPaginated(val.trim(), 0, 10)
          .pipe(untilDestroyed(this))
          .subscribe(r => this.usuariosFiltrados = (r?.getContent as Usuario[]) || []);
      } else if (typeof val !== 'string') {
        this.usuariosFiltrados = [];
      }
    });

    this.cargar();
  }

  cargar(): void {
    this.isLoading = true;
    this.cajaVirtualService.onGetAccesos(this.data.cajaVirtual.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isLoading = false;
        this.dataSource.data = (res || []).map((a: any) => ({
          id: a.id,
          usuarioId: a.usuario?.id,
          nickname: a.usuario?.nickname || '—',
          nombre: a.usuario?.persona?.nombre || '—',
          puedeLeer: !!a.puedeLeer,
          puedeEscribir: !!a.puedeEscribir,
          otorgadoPor: a.otorgadoPor?.nickname || '—',
        } as AccesoRow));
      });
  }

  /** Alta desde el buscador. El backend rechaza otorgarle acceso al propio responsable. */
  onAgregar(): void {
    const u: any = this.usuarioControl.value;
    if (!u || typeof u === 'string' || !u.id) {
      return this.err('Elegí un usuario de la lista');
    }
    this.guardar(u.id, true, this.nuevoPuedeEscribir, () => {
      this.usuarioControl.setValue(null);
      this.usuariosFiltrados = [];
      this.nuevoPuedeEscribir = false;
    });
  }

  /**
   * Cambia el permiso de escritura de una fila existente.
   *
   * La lectura no se puede apagar: un acceso sin lectura no sirve para nada, y el camino para
   * sacarle el acceso a alguien es revocarlo — que además borra la fila en vez de dejar una
   * inerte.
   */
  onToggleEscritura(row: AccesoRow, valor: boolean): void {
    this.guardar(row.usuarioId, true, valor);
  }

  private guardar(usuarioId: number, puedeLeer: boolean, puedeEscribir: boolean, luego?: () => void): void {
    this.isSaving = true;
    this.cajaVirtualService.onOtorgarAcceso(this.data.cajaVirtual.id, usuarioId, puedeLeer, puedeEscribir)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res != null) {
            this.ok('Acceso actualizado');
            if (luego) luego();
            this.cargar();
          }
        },
        error: e => { this.isSaving = false; this.err(this.mensaje(e)); },
      });
  }

  onRevocar(row: AccesoRow): void {
    this.dialogos.confirm(
      'Quitar acceso',
      `¿Quitarle el acceso a ${row.nombre} sobre esta caja?`,
      row.puedeEscribir ? 'Hoy puede mover plata en la caja.' : null,
      null, true, 'Sí, quitar', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r !== true) return;
      this.isSaving = true;
      this.cajaVirtualService.onRevocarAcceso(this.data.cajaVirtual.id, row.usuarioId)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: () => { this.isSaving = false; this.ok('Acceso quitado'); this.cargar(); },
          error: e => { this.isSaving = false; this.err(this.mensaje(e)); },
        });
    });
  }

  /**
   * Pasa la caja a otro responsable. Es lo que evita que quede huérfana cuando su responsable
   * deja la empresa: sin dueño, nadie puede administrar la lista.
   */
  onTransferirPropiedad(row: AccesoRow): void {
    this.dialogos.confirm(
      'Transferir responsabilidad',
      `¿Pasar la caja a ${row.nombre}?`,
      'Va a poder administrar los accesos, y vos dejás de poder hacerlo.',
      null, true, 'Sí, transferir', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r !== true) return;
      this.isSaving = true;
      this.cajaVirtualService.onTransferirPropiedad(this.data.cajaVirtual.id, row.usuarioId)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: res => {
            this.isSaving = false;
            if (res != null) {
              this.ok('Responsable actualizado');
              this.dialogRef.close(true);
            }
          },
          error: e => { this.isSaving = false; this.err(this.mensaje(e)); },
        });
    });
  }

  private mensaje(e: any): string {
    return e?.graphQLErrors?.[0]?.message || e?.message || 'No se pudo completar la operación';
  }

  private ok(texto: string): void {
    this.notificacion.notification$.next({ texto, color: NotificacionColor.success, duracion: 3 });
  }

  private err(texto: string): void {
    this.notificacion.notification$.next({ texto, color: NotificacionColor.warn, duracion: 5 });
  }

  cerrar(): void { this.dialogRef.close(null); }
}

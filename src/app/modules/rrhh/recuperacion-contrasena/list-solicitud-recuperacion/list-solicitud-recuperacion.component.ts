import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, switchMap } from 'rxjs/operators';
import { PageInfo } from '../../../../app.component';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { MotivoDialogComponent, MotivoDialogData } from '../../../../shared/components/motivo-dialog/motivo-dialog.component';
import { SolicitudRecuperacionContrasena } from '../recuperacion-contrasena.model';
import { SolicitudRecuperacionContrasenaService } from '../solicitud-recuperacion-contrasena.service';

/** Fila con lo que muestra la tabla ya calculado (nada de funciones en el template). */
interface FilaSolicitud {
  solicitud: SolicitudRecuperacionContrasena;
  nickname: string;
  nombre: string;
  documento: string;
  telefonoRegistrado: string;
  /** El teléfono que informó coincide con el registrado (comparando los últimos 9 dígitos). */
  telefonoCoincide: boolean;
  estado: string;
  pendiente: boolean;
  resueltoPor: string;
}

/**
 * Solicitudes de recuperación de contraseña de usuarios sin correo. El usuario la manda por
 * WhatsApp: antes de aprobar hay que confirmar que el mensaje llegó del teléfono registrado (o
 * llamarlo a ese número). Aprobar no le dice la contraseña a nadie: el usuario la elige con el
 * código secreto que solo vio él.
 */
@UntilDestroy()
@Component({
  selector: 'app-list-solicitud-recuperacion',
  templateUrl: './list-solicitud-recuperacion.component.html',
  styleUrls: ['./list-solicitud-recuperacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListSolicitudRecuperacionComponent implements OnInit {

  displayedColumns = ['id', 'creadoEn', 'usuario', 'documento', 'telefono', 'telefonoRegistrado', 'email',
    'estado', 'resueltoPor', 'acciones'];
  dataSource = new MatTableDataSource<FilaSolicitud>([]);

  estadoControl = new FormControl<string>('PENDIENTE');
  estados = [
    { valor: 'PENDIENTE', nombre: 'Pendientes' },
    { valor: 'APROBADA', nombre: 'Aprobadas' },
    { valor: 'RECHAZADA', nombre: 'Rechazadas' },
    { valor: 'COMPLETADA', nombre: 'Completadas' },
    { valor: 'ANULADA', nombre: 'Anuladas' },
    { valor: 'TODAS', nombre: 'Todas' },
  ];

  pageIndex = 0;
  pageSize = 25;
  totalElementos = 0;

  constructor(
    private service: SolicitudRecuperacionContrasenaService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar(): void {
    this.service.onGetPage(this.estadoControl.value, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe((res: PageInfo<SolicitudRecuperacionContrasena>) => {
        if (res == null) return;
        this.totalElementos = res.getTotalElements;
        this.dataSource.data = (res.getContent || []).map((s) => this.aFila(s));
        this.cdr.markForCheck();
      });
  }

  onCambiarEstado(): void {
    this.pageIndex = 0;
    this.onFiltrar();
  }

  onResetFiltro(): void {
    this.estadoControl.setValue('PENDIENTE');
    this.onCambiarEstado();
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onAprobar(fila: FilaSolicitud): void {
    const lista = [
      `Usuario: ${fila.nickname} (${fila.nombre || 'sin nombre'})`,
      `Teléfono informado: ${fila.solicitud.telefono}`,
      `Teléfono registrado: ${fila.telefonoRegistrado || 'no tiene'}`,
    ];
    this.dialogosService.confirmar({
      titulo: `Aprobar solicitud N° ${fila.solicitud.id}`,
      mensaje: fila.telefonoCoincide
        ? 'Confirme que el WhatsApp llegó desde el teléfono registrado del funcionario.'
        : 'El teléfono informado NO coincide con el registrado. Llame al funcionario al teléfono registrado o verifique su identidad en persona antes de aprobar.',
      detalle: 'Al aprobar, el usuario podrá elegir una contraseña nueva durante 24 horas con su código secreto.',
      lista,
      si: 'Aprobar',
      no: 'Volver',
      peligro: !fila.telefonoCoincide,
    }).pipe(
      untilDestroyed(this),
      filter((ok) => ok === true),
      switchMap(() => this.service.onAprobar(fila.solicitud.id)),
    ).subscribe(() => {
      this.notificacion.openSucess(`Solicitud ${fila.solicitud.id} aprobada`);
      this.onFiltrar();
    });
  }

  onRechazar(fila: FilaSolicitud): void {
    const data: MotivoDialogData = {
      titulo: `Rechazar solicitud N° ${fila.solicitud.id}`,
      mensaje: `Usuario ${fila.nickname}. El motivo se le muestra al usuario cuando consulte la solicitud.`,
      botonConfirmar: 'Rechazar',
    };
    this.dialog.open(MotivoDialogComponent, { data, width: '520px', maxWidth: '95vw' }).afterClosed().pipe(
      untilDestroyed(this),
      filter((motivo: string) => !!motivo),
      switchMap((motivo: string) => this.service.onRechazar(fila.solicitud.id, motivo)),
    ).subscribe(() => {
      this.notificacion.openSucess(`Solicitud ${fila.solicitud.id} rechazada`);
      this.onFiltrar();
    });
  }

  private aFila(s: SolicitudRecuperacionContrasena): FilaSolicitud {
    const persona = s.usuario?.persona;
    const registrado = persona?.telefono || null;
    const estado = s.vencida ? 'VENCIDA' : s.estado;
    return {
      solicitud: s,
      nickname: s.usuario?.nickname,
      nombre: persona?.nombre,
      documento: persona?.documento,
      telefonoRegistrado: registrado,
      telefonoCoincide: this.mismoTelefono(s.telefono, registrado),
      estado,
      pendiente: estado === 'PENDIENTE',
      resueltoPor: s.resueltoPor?.nickname || null,
    };
  }

  /** 0981 123 456, +595981123456 y 981123456 son el mismo número. */
  private mismoTelefono(a: string, b: string): boolean {
    const ultimos = (t: string) => (t || '').replace(/\D/g, '').slice(-9);
    const x = ultimos(a);
    return x.length >= 6 && x === ultimos(b);
  }
}

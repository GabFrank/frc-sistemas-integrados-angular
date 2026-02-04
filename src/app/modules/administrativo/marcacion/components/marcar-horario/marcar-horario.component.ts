import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../../notificacion-snackbar.service';
import { MarcacionService } from '../../service/marcacion.service';
import { Marcacion } from '../../models/marcacion.model';
import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { UsuarioSearchGQL } from '../../../../personas/usuarios/graphql/usuarioSearch';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';

@UntilDestroy()
@Component({
  selector: 'marcar-horario',
  templateUrl: './marcar-horario.component.html',
  styleUrls: ['./marcar-horario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarcarHorarioComponent implements OnInit {

  empleadoNombreControl = new FormControl();
  empleadoIdControl = new FormControl();

  usuarioSeleccionado: Usuario = null;
  sucursalActualNombre = '';
  sucursalActualId: number = null;

  marcacionActiva: Marcacion = null;
  horaEntrada: Date = null;
  estaEnJornada = false;
  cargando = false;
  dispositivoInfo = '';

  horaActual: Date = new Date();
  private clockInterval: any;

  constructor(
    public mainService: MainService,
    private marcacionService: MarcacionService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private searchUsuario: UsuarioSearchGQL
  ) { }

  ngOnInit(): void {
    this.sucursalActualNombre = this.mainService.sucursalActual?.nombre || 'Sin sucursal';
    this.sucursalActualId = this.mainService.sucursalActual?.id;
    this.dispositivoInfo = this.obtenerInfoDispositivo();

    this.clockInterval = setInterval(() => {
      this.horaActual = new Date();
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  obtenerInfoDispositivo(): string {
    const navegador = navigator.userAgent;
    const plataforma = navigator.platform;
    return `${plataforma} - ${navegador.substring(0, 50)}`;
  }

  abrirBuscadorEmpleado(): void {
    let data: SearchListtDialogData = {
      titulo: "Buscar Empleado",
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        {
          id: "nombre",
          nombre: "Nombre",
          nested: true,
          nestedId: "persona",
          width: "50%",
        },
        {
          id: "documento",
          nombre: "Documento",
          nested: true,
          nestedId: "persona",
          width: "40%",
        },
      ],
      query: this.searchUsuario,
    };

    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        height: "80vh",
        width: "70vw",
        panelClass: 'search-dialog-dark'
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((usuario: Usuario) => {
        if (usuario) {
          this.seleccionarUsuario(usuario);
        }
      });
  }

  seleccionarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.empleadoNombreControl.setValue(usuario.persona?.nombre);
    this.empleadoIdControl.setValue(usuario.id);
    this.verificarMarcacionActiva();
    this.cdr.markForCheck();
  }

  limpiarEmpleado(): void {
    this.usuarioSeleccionado = null;
    this.empleadoNombreControl.setValue(null);
    this.empleadoIdControl.setValue(null);
    this.marcacionActiva = null;
    this.horaEntrada = null;
    this.estaEnJornada = false;
    this.cdr.markForCheck();
  }

  verificarMarcacionActiva(): void {
    if (!this.usuarioSeleccionado?.id) return;

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

    this.cargando = true;
    this.marcacionService.onGetMarcacionesPorUsuario(
      this.usuarioSeleccionado.id,
      inicioHoy,
      finHoy
    ).pipe(untilDestroyed(this))
      .subscribe(marcaciones => {
        this.cargando = false;

        const marcacionSinSalida = marcaciones?.find(m =>
          m.fechaEntrada && !m.fechaSalida
        );

        if (marcacionSinSalida) {
          this.marcacionActiva = marcacionSinSalida;
          this.horaEntrada = new Date(marcacionSinSalida.fechaEntrada);
          this.estaEnJornada = true;
        } else {
          this.marcacionActiva = null;
          this.horaEntrada = null;
          this.estaEnJornada = false;
        }

        this.cdr.markForCheck();
      });
  }

  registrarEntrada(): void {
    if (!this.usuarioSeleccionado?.id) {
      this.notificacionService.notification$.next({
        texto: 'Debe seleccionar un empleado primero',
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }

    if (!this.sucursalActualId) {
      this.notificacionService.notification$.next({
        texto: 'No se pudo determinar la sucursal actual',
        color: NotificacionColor.danger,
        duracion: 3
      });
      return;
    }

    this.cargando = true;
    this.marcacionService.onRegistrarEntrada(
      this.usuarioSeleccionado.id,
      this.sucursalActualId,
      null,
      null,
      null,
      null,
      null,
      this.dispositivoInfo,
      true
    ).pipe(untilDestroyed(this))
      .subscribe({
        next: (marcacion) => {
          this.cargando = false;
          this.marcacionActiva = marcacion;
          this.horaEntrada = new Date(marcacion.fechaEntrada);
          this.estaEnJornada = true;
          this.cdr.markForCheck();

          this.notificacionService.notification$.next({
            texto: `Entrada registrada exitosamente a las ${this.horaEntrada.toLocaleTimeString()}`,
            color: NotificacionColor.success,
            duracion: 4
          });
        },
        error: () => {
          this.cargando = false;
          this.cdr.markForCheck();
        }
      });
  }

  registrarSalida(): void {
    if (!this.marcacionActiva?.id) {
      this.notificacionService.notification$.next({
        texto: 'No hay una entrada activa para registrar salida',
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }

    if (!this.sucursalActualId) {
      this.notificacionService.notification$.next({
        texto: 'No se pudo determinar la sucursal actual',
        color: NotificacionColor.danger,
        duracion: 3
      });
      return;
    }

    this.cargando = true;
    this.marcacionService.onRegistrarSalida(
      this.marcacionActiva.id,
      this.sucursalActualId,
      null,
      null,
      null,
      null
    ).pipe(untilDestroyed(this))
      .subscribe({
        next: (marcacion) => {
          this.cargando = false;
          const horaSalida = new Date(marcacion.fechaSalida);

          this.notificacionService.notification$.next({
            texto: `Salida registrada exitosamente a las ${horaSalida.toLocaleTimeString()}`,
            color: NotificacionColor.success,
            duracion: 4
          });

          this.marcacionActiva = null;
          this.horaEntrada = null;
          this.estaEnJornada = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.cdr.markForCheck();
        }
      });
  }
}

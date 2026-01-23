import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VehiculoService } from '../../../vehiculos/vehiculo/vehiculo.service';
import { TransferenciaService } from '../transferencia.service';
import { Vehiculo } from '../../../vehiculos/vehiculo/models/vehiculo.model';
import { Persona } from '../../../personas/persona/persona.model';
import { HojaRuta, HojaRutaInput } from '../transferencia.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { BuscarPersonaDialogComponent } from '../../../personas/persona/buscar-persona-dialog/buscar-persona-dialog.component';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { BuscarVehiculoDialogComponent } from '../../../vehiculos/vehiculo/buscar-vehiculo-dialog/buscar-vehiculo-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'ruta-hoja',
  templateUrl: './ruta-hoja.component.html',
  styleUrls: ['./ruta-hoja.component.scss']
})
export class RutaHojaComponent implements OnInit {

  @ViewChild('vehiculoInput', { static: false }) vehiculoInput: ElementRef;

  vehiculoControl = new FormControl(null, Validators.required);
  choferControl = new FormControl(null, Validators.required);
  fechaSalidaControl = new FormControl(new Date());

  vehiculoList: Vehiculo[] = [];
  selectedVehiculo: Vehiculo;
  selectedChofer: Persona;
  selectedHojaRuta: HojaRuta;
  acompanhantes: Persona[] = [];

  dataSource = new MatTableDataSource<Persona>([]);
  displayedColumns = ['id', 'nombre', 'accion'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<RutaHojaComponent>,
    private vehiculoService: VehiculoService,
    private transferenciaService: TransferenciaService,
    private matDialog: MatDialog,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    if (this.data?.hojaRutaId) {
      this.loadHojaRuta(this.data.hojaRutaId);
    }
  }

  loadHojaRuta(id: number) {
    this.transferenciaService.onGetHojaRuta(id).subscribe(res => {
      if (res) {
        this.selectedHojaRuta = res;
        this.selectedVehiculo = res.vehiculo;
        this.selectedChofer = res.chofer;
        this.vehiculoControl.setValue(this.selectedVehiculo);
        this.choferControl.setValue(this.selectedChofer?.nombre);
        if (res.fechaSalida) {
          this.fechaSalidaControl.setValue(new Date(res.fechaSalida));
        }
        this.acompanhantes = res.acompanantes || [];
        this.dataSource.data = this.acompanhantes;
      }
    });
  }

  onBuscarVehiculo() {
    this.matDialog.open(BuscarVehiculoDialogComponent, {
      width: '60%',
      height: '70%'
    }).afterClosed().subscribe(res => {
      if (res) {
        this.selectedVehiculo = res;
        this.vehiculoControl.setValue(res);
      }
    });
  }

  onBuscarChofer() {
    this.matDialog.open(BuscarPersonaDialogComponent, {
      width: '60%',
      height: '70%'
    }).afterClosed().subscribe(res => {
      if (res) {
        this.selectedChofer = res;
        this.choferControl.setValue(res.nombre);
      }
    });
  }

  onAddAcompanhante() {
    this.matDialog.open(BuscarPersonaDialogComponent, {
      width: '60%',
      height: '70%'
    }).afterClosed().subscribe(res => {
      if (res) {
        if (!this.acompanhantes.find(p => p.id === res.id)) {
          this.acompanhantes.push(res);
          this.dataSource.data = [...this.acompanhantes];
        } else {
          this.notificacionService.openWarn('Esta persona ya esta agregada en la lista');
        }
      }
    });
  }

  onRemoveAcompanhante(persona: Persona) {
    this.acompanhantes = this.acompanhantes.filter(p => p.id !== persona.id);
    this.dataSource.data = [...this.acompanhantes];
  }

  onSave() {
    if (this.vehiculoControl.valid && this.choferControl.valid) {
      const input = new HojaRutaInput();
      input.id = this.selectedHojaRuta?.id;
      input.vehiculoId = this.selectedVehiculo.id;
      input.choferId = this.selectedChofer.id;
      input.fechaSalida = dateToString(this.fechaSalidaControl.value);
      input.acompanantesIds = this.acompanhantes.map(p => p.id);

      this.transferenciaService.onSaveHojaRuta(input).subscribe(res => {
        if (res) {
          this.dialogRef.close(res);
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { VentaObservacionService } from '../venta-observacion.service';
import { VentaObservacion } from '../venta-observacion.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { AddVentaObservacionComponent } from '../add-venta-observacion/add-venta-observacion.component';
import { MatTableDataSource } from '@angular/material/table';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { Venta } from '../../venta/venta.model';
import { VentaObservacionInput } from '../venta-observacion-input';
import { FormControl, FormGroup, Validators } from '@angular/forms';


export interface VentaObservacionData {
  ventaObservacion: VentaObservacion;
  ventaId: number;
  venta?: Venta;
  sucursalId: number;
  usuarioId: number;
  subCategoriaObsId: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'venta-observacion-dashboard',
  templateUrl: './venta-observacion-dashboard.component.html',
  styleUrls: ['./venta-observacion-dashboard.component.scss']
})
export class VentaObservacionDashboardComponent implements OnInit {

  selectedVenta: Venta;
  ventaList: Venta[];
  ventaObservacionInput: VentaObservacionInput
  formGroup: FormGroup;
  addVentaObservacionDataSource = new MatTableDataSource<VentaObservacion>([]);

  idControl = new FormControl(null);
  descripcionControl = new FormControl(null, Validators.required);
  subCategoriaObsControl = new FormControl(null, Validators.required);

  isCancelar = true;
  isGuardar = true;
  isEditar = false;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VentaObservacionData, 
    public mainService: MainService,
    private matDialog: MatDialog,
    private dialogRef: MatDialogRef<VentaObservacionDashboardComponent>,
    private ventaObservacionService: VentaObservacionService,
    private notificationBar: NotificacionSnackbarService,
    private tabService: TabService
  ) {     
  }

  ngOnInit(): void {
    if(this.data?.venta) {
      this.selectedVenta = this.data.venta;
      console.log('Venta recibida en dashboard:', this.selectedVenta);
      this.loadObservaciones();
    }
  }

  loadObservaciones() {
    this.ventaObservacionService.onGetByVentaIdAndSucursalId(this.selectedVenta.id, this.selectedVenta.sucursalId)
    .subscribe({
      next:(observaciones: VentaObservacion[]) => {
        console.log('Observaciones  obtenidas', observaciones);
        this.addVentaObservacionDataSource.data = observaciones;
      },
      error: (err) =>  console.error('Error al cargar las observaciones:', err)
    });
  }

  openNewObservacion(venta: Venta) {
    const dialogRef = this.matDialog.open(AddVentaObservacionComponent, {
      width: "950px",
      height: "450px",
      data: { venta: venta }
    });

    dialogRef.afterClosed().subscribe((res: VentaObservacion) => {
      if (res != null) {
        this.loadObservaciones();
      }
    });
  }
  
}

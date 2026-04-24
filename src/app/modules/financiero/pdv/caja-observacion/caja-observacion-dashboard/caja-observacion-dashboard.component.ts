import { Component, Inject, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PdvCaja } from '../../caja/caja.model';
import { CajaObservacion } from '../caja-observacion.model';
import { CajaObservacionInput } from '../caja-observacion-input.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../../main.service';
import { CajaObservacionService } from '../caja-observacion.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { AddCajaObservacionComponent } from '../add-caja-observacion-dialog/add-caja-observacion-dialog.component';

export interface CajaObservacionData {
  cajaObservacion: CajaObservacion;
  cajaId: number;
  caja?: PdvCaja;
  sucursalId: number;
  usuarioId: number;
  subCategoriaObsId: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'caja-observacion-dashboard',
  templateUrl: './caja-observacion-dashboard.component.html',
  styleUrls: ['./caja-observacion-dashboard.component.scss']
})
export class CajaObservacionDashboardComponent implements OnInit{
  selectedCaja: PdvCaja;
  cajaList: PdvCaja[];
  cajaObservacionInput: CajaObservacionInput
  formGroup: FormGroup;
  addCajaObservacionDataSource = new MatTableDataSource<CajaObservacion>([]);

  idControl = new FormControl(null);
  descripcionControl = new FormControl(null, Validators.required);
  subCategoriaObsControl = new FormControl(null, Validators.required);

  isCancelar = true;
  isGuardar = true;
  isEditar = false;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CajaObservacionData, 
    public mainService: MainService,
    private matDialog: MatDialog,
    private dialogRef: MatDialogRef<CajaObservacionDashboardComponent>,
    private cajaObservacionService: CajaObservacionService,
    private notificationBar: NotificacionSnackbarService,
    private tabService: TabService
  ) {     
  }

  ngOnInit(): void {
    if(this.data?.caja) {
      this.selectedCaja = this.data.caja;
      console.log('Caja recibida en dashboard:', this.selectedCaja);
      this.loadObservaciones();
    }
  }

  loadObservaciones() {
    this.cajaObservacionService.onGetByCajaIdAndSucursalId(this.selectedCaja.id, this.selectedCaja.sucursalId)
    .subscribe({
      next:(observaciones: CajaObservacion[]) => {
        console.log('Observaciones  obtenidas', observaciones);
        this.addCajaObservacionDataSource.data = observaciones;
      },
      error: (err) =>  console.error('Error al cargar las observaciones:', err)
    });
  }

  openNewObservacion(caja: PdvCaja) {
    const dialogRef = this.matDialog.open(AddCajaObservacionComponent, {
      width: "950px",
      height: "450px",
      data: { caja: caja }
    });

    dialogRef.afterClosed().subscribe((res: CajaObservacion) => {
      if (res != null) {
        this.loadObservaciones();
      }
    });
  } 
}

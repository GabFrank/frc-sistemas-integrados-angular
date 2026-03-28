import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { GpsService } from './gps.service';
import { Gps } from '../models/gps.model';
import { GpsInput } from '../models/gps-input.model';
import { GpsComponent } from '../dialogs/gps-form/gps.component';
import { GpsConfigDialogComponent } from '../dialogs/gps-config-dialog/gps-config-dialog.component';
import { Vehiculo } from '../../vehiculo/models/vehiculo.model';
import { VehiculoSearchPageGQL } from '../../vehiculo/graphql/vehiculoSearchPage';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class GpsDialogService {
  private gpsService = inject(GpsService);
  private dialog = inject(MatDialog);
  private vehiculoSearchPageGQL = inject(VehiculoSearchPageGQL);

  abrirFormulario(gps?: Gps): Observable<boolean | undefined> {
    const dialogRef = this.dialog.open(GpsComponent, {
      width: '800px',
      data: gps,
      disableClose: true,
      autoFocus: false
    });

    return dialogRef.afterClosed().pipe(
      take(1),
      tap(res => {
        if (res) this.gpsService.refrescar();
      })
    );
  }

  abrirConfiguracion(gps: Gps): void {
    this.dialog.open(GpsConfigDialogComponent, {
      width: '900px',
      data: gps,
      disableClose: false,
      autoFocus: false,
      panelClass: 'modern-dialog'
    });
  }

  onBuscarVehiculo(callback: (vehiculo: Vehiculo) => void): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'Id' },
      { id: 'chapa', nombre: 'Chapa' },
      { id: 'modelo.marca.descripcion', nombre: 'Marca' },
      { id: 'modelo.descripcion', nombre: 'Modelo' }
    ];

    const searchData: SearchListtDialogData = {
      query: this.vehiculoSearchPageGQL,
      tableData,
      titulo: 'Buscar Vehículo',
      search: true,
      inicialSearch: true,
      textHint: 'Buscar por chapa, marca o modelo...',
      paginator: true,
      queryData: { page: 0, size: 15 }
    };

    this.dialog.open(SearchListDialogComponent, {
      data: searchData,
      width: '70%',
      height: '80%'
    }).afterClosed().subscribe((res: Vehiculo) => {
      if (res) {
        callback(res);
      }
    });
  }

  onGuardar(form: any, dialogRef: any): void {
    if (form.valid) {
      const values = form.getRawValue();
      const input: GpsInput = {
        id: values.id,
        imei: values.imei,
        modeloTracker: values.modeloTracker,
        simNumero: values.simNumero,
        vehiculoId: values.vehiculoId,
        activo: values.activo
      };

      this.gpsService.onSave(input).subscribe(res => {
        if (res) {
          dialogRef.close(true);
        }
      });
    }
  }

  onCancelar(dialogRef: any): void {
    dialogRef.close();
  }
}

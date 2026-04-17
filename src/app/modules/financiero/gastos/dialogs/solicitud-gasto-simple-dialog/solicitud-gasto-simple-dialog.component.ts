import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { MainService } from '../../../../../main.service';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { Moneda } from '../../../moneda/moneda.model';
import { MonedaService } from '../../../moneda/moneda.service';
import { ProveedoresSearchByPersonaPageGQL } from '../../../../personas/proveedor/graphql/proveedorSearchByPersonaPage';

export interface SolicitudGastoSimpleData {
  tipoGastoId: number;
  tipoGastoDescripcion: string;
  solicitanteId: number;
  solicitanteNombre: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-solicitud-gasto-simple-dialog',
  templateUrl: './solicitud-gasto-simple-dialog.component.html',
  styleUrls: ['./solicitud-gasto-simple-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudGastoSimpleDialogComponent implements OnInit {
  currencyMask = new CurrencyMask();
  selectedCurrencyOptions = this.currencyMask.currencyOptionsGuarani;
  precisionDisplay = '1.0-0';

  tipoGastoDescripcionControl = new FormControl({ value: '', disabled: true });
  solicitanteNombreControl = new FormControl({ value: '', disabled: true });
  descripcionControl = new FormControl('', Validators.required);
  vencimientoControl = new FormControl(new Date(), Validators.required);
  monedaControl = new FormControl<number | null>(null, Validators.required);
  montoControl = new FormControl<number | null>(null, [Validators.required, Validators.min(1)]);
  sucursalRetiroControl = new FormControl({ value: '', disabled: true });
  beneficiarioControl = new FormControl('', Validators.required);
  proveedorIdControl = new FormControl<number | null>(null, Validators.required);

  listaMonedas: Moneda[] = [];

  constructor(
    private matDialogRef: MatDialogRef<SolicitudGastoSimpleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SolicitudGastoSimpleData,
    private monedaService: MonedaService,
    private mainService: MainService,
    private matDialog: MatDialog,
    private proveedoresSearchByPersonaPageGQL: ProveedoresSearchByPersonaPageGQL,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.tipoGastoDescripcionControl.setValue(this.data.tipoGastoDescripcion);
      this.solicitanteNombreControl.setValue(this.data.solicitanteNombre);
    }

    if (this.mainService.sucursalActual) {
      this.sucursalRetiroControl.setValue(this.mainService.sucursalActual.nombre);
    }

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.listaMonedas = res;
        const guaranies = this.listaMonedas.find(m => m.simbolo === 'G$');
        if (guaranies) {
          this.monedaControl.setValue(guaranies.id);
        }
        this.actualizarCurrencyOptions();
        this.cdr.markForCheck();
      }
    });

    this.monedaControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.actualizarCurrencyOptions();
      this.cdr.markForCheck();
    });
  }

  actualizarCurrencyOptions(): void {
    const monedaSeleccionada = this.listaMonedas.find(m => m.id === this.monedaControl.value);
    if (monedaSeleccionada) {
      if (monedaSeleccionada.simbolo === 'G$') {
        this.selectedCurrencyOptions = this.currencyMask.currencyOptionsGuarani;
        this.precisionDisplay = '1.0-0';
      } else {
        this.selectedCurrencyOptions = this.currencyMask.currencyOptionsNoGuarani;
        this.precisionDisplay = '1.2-2';
      }
    }
  }

  abrirBuscadorProveedor(): void {
    const data = new SearchListtDialogData();
    data.titulo = 'Seleccionar Proveedor';
    data.query = this.proveedoresSearchByPersonaPageGQL;
    data.paginator = true;
    data.searchFieldName = 'texto';
    data.tableData = [
      { id: 'id', nombre: 'ID', width: '50px' },
      { id: 'persona.nombre', nombre: 'Nombre', width: 'auto' },
      { id: 'persona.documento', nombre: 'Documento', width: '150px' },
    ];

    this.matDialog.open(SearchListDialogComponent, {
      data: data,
      width: '80%',
      height: '80%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.proveedorIdControl.setValue(res.id);
        this.beneficiarioControl.setValue(res.persona?.nombre || '');
        this.cdr.markForCheck();
      }
    });
  }

  onCancelar(): void {
    this.matDialogRef.close();
  }

  onAceptar(): void {
    if (
      this.descripcionControl.valid &&
      this.vencimientoControl.valid &&
      this.monedaControl.valid &&
      this.montoControl.valid &&
      this.proveedorIdControl.valid
    ) {
      const resultado = {
        tipoGastoId: this.data.tipoGastoId,
        solicitanteId: this.data.solicitanteId,
        descripcion: this.descripcionControl.value,
        vencimiento: this.vencimientoControl.value,
        monedaId: this.monedaControl.value,
        monto: this.montoControl.value,
        sucursalRetiroId: this.mainService.sucursalActual?.id,
        proveedorId: this.proveedorIdControl.value
      };
      this.matDialogRef.close(resultado);
    }
  }

  esFormularioValido(): boolean {
    return this.descripcionControl.valid &&
           this.vencimientoControl.valid &&
           this.monedaControl.valid &&
           this.montoControl.valid &&
           this.proveedorIdControl.valid;
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CuentaBancaria, TipoCuenta } from '../cuenta-bancaria.model';
import { CuentaBancariaService } from '../cuenta-bancaria.service';
import { Banco } from '../../banco/banco.model';
import { BancoService } from '../../banco/banco.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { Persona } from '../../../personas/persona/persona.model';
import { PersonaSearchGQL } from '../../../personas/persona/graphql/personaSearch';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-cuenta-bancaria-dialog',
  templateUrl: './add-cuenta-bancaria-dialog.component.html',
  styleUrls: ['./add-cuenta-bancaria-dialog.component.scss']
})
export class AddCuentaBancariaDialogComponent implements OnInit {

  formGroup: FormGroup;
  nombreControl = new FormControl('', Validators.required);
  numeroControl = new FormControl('', Validators.required);
  aliasControl = new FormControl('');
  bancoControl = new FormControl(null, Validators.required);
  monedaControl = new FormControl(null, Validators.required);
  tipoCuentaControl = new FormControl(TipoCuenta.CUENTA_CORRIENTE, Validators.required);
  titularControl = new FormControl('');
  activoControl = new FormControl(true);
  disponibleControl = new FormControl(true);
  buscarPersonaControl = new FormControl('');

  bancoList: Banco[] = [];
  monedaList: Moneda[] = [];
  selectedPersona: Persona;

  tipoCuentaList = [
    { label: 'Cuenta Corriente', value: TipoCuenta.CUENTA_CORRIENTE },
    { label: 'Caja de Ahorro', value: TipoCuenta.CAJA_DE_AHORRO },
  ];

  isEditing = false;
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<AddCuentaBancariaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CuentaBancaria,
    private cuentaBancariaService: CuentaBancariaService,
    private bancoService: BancoService,
    private monedaService: MonedaService,
    private personaSearch: PersonaSearchGQL,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nombreControl: this.nombreControl,
      numeroControl: this.numeroControl,
      aliasControl: this.aliasControl,
      bancoControl: this.bancoControl,
      monedaControl: this.monedaControl,
      tipoCuentaControl: this.tipoCuentaControl,
      titularControl: this.titularControl,
      activoControl: this.activoControl,
      disponibleControl: this.disponibleControl,
    });

    this.bancoService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.bancoList = res;
    });

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.monedaList = res;
    });

    if (this.data != null) {
      this.isEditing = true;
      this.nombreControl.setValue(this.data.nombre);
      this.numeroControl.setValue(this.data.numero);
      this.aliasControl.setValue(this.data.alias);
      this.bancoControl.setValue(this.data.banco);
      this.monedaControl.setValue(this.data.moneda);
      this.tipoCuentaControl.setValue(this.data.tipoCuenta);
      this.titularControl.setValue(this.data.titular);
      this.activoControl.setValue(this.data.activo !== false);
      this.disponibleControl.setValue(this.data.disponibleOperacionesFinancieras !== false);
      this.selectedPersona = this.data.persona;
      this.buscarPersonaControl.setValue(this.data.persona?.nombre);
    }
  }

  /** Al elegir una persona (proveedor/cliente), sugerir que NO es operable en tesorería. */
  onPersonaSeleccionada() {
    if (this.selectedPersona) this.disponibleControl.setValue(false);
  }

  limpiarPersona() {
    this.selectedPersona = null;
    this.buscarPersonaControl.setValue('');
  }

  onBuscarPersona() {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'Id' },
      { id: 'nombre', nombre: 'Nombre' },
      { id: 'documento', nombre: 'Documento' },
    ];
    const dialogData: SearchListtDialogData = {
      query: this.personaSearch,
      tableData,
      titulo: 'Buscar titular de la cuenta',
      search: true,
      texto: this.buscarPersonaControl.value,
      inicialSearch: true,
    };
    this.dialog.open(SearchListDialogComponent, {
      data: dialogData,
      width: '60%',
      height: '80%'
    }).afterClosed().subscribe((res: Persona) => {
      if (res != null) {
        this.selectedPersona = new Persona();
        Object.assign(this.selectedPersona, res);
        this.buscarPersonaControl.setValue(this.selectedPersona.nombre);
        this.onPersonaSeleccionada();
      }
    });
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const cuentaBancaria = new CuentaBancaria();
    if (this.isEditing) cuentaBancaria.id = this.data.id;
    cuentaBancaria.nombre = this.nombreControl.value?.toUpperCase();
    cuentaBancaria.numero = this.numeroControl.value?.toUpperCase();
    cuentaBancaria.alias = this.aliasControl.value?.toUpperCase() || null;
    cuentaBancaria.banco = this.bancoControl.value;
    cuentaBancaria.moneda = this.monedaControl.value;
    cuentaBancaria.tipoCuenta = this.tipoCuentaControl.value;
    cuentaBancaria.titular = this.titularControl.value?.toUpperCase() || null;
    cuentaBancaria.activo = this.activoControl.value;
    cuentaBancaria.disponibleOperacionesFinancieras = this.disponibleControl.value;
    cuentaBancaria.persona = this.selectedPersona;

    this.isSaving = true;
    this.cuentaBancariaService.onSave(cuentaBancaria)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res != null) {
            this.notificacion.openSucess('Cuenta bancaria guardada correctamente');
            this.dialogRef.close(res);
          }
        },
        error: () => {
          this.isSaving = false;
          this.notificacion.openAlgoSalioMal('Error al guardar la cuenta bancaria');
        }
      });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}

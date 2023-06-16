import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CurrencyMask } from '../../../../commons/core/utils/numbersUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { PersonaSearchGQL } from '../../persona/graphql/personaSearch';
import { Persona } from '../../persona/persona.model';
import { PersonaService } from '../../persona/persona.service';
import { ROLES } from '../../roles/roles.enum';
import { Cliente, TipoCliente } from '../cliente.model';
import { ClienteService } from '../cliente.service';

export interface AdicionarClienteData {
  ruc?: string;
  persona?: Persona;
  cliente?: Cliente;
}

@UntilDestroy()
@Component({
  selector: 'app-add-cliente-dialog',
  templateUrl: './add-cliente-dialog.component.html',
  styleUrls: ['./add-cliente-dialog.component.scss']
})
export class AddClienteDialogComponent implements OnInit {

  readonly ROLES = ROLES;

  selectedCliente: Cliente;
  selectedPersona: Persona;

  //cliente
  tipoControl = new FormControl(TipoCliente.NORMAL, Validators.required)
  personaControl = new FormControl()
  buscarControl = new FormControl()
  creditoControl = new FormControl(0, Validators.min(0));

  //persona
  nombreControl = new FormControl(null, Validators.required)
  apodoControl = new FormControl(null)
  documentoControl = new FormControl(null, Validators.required)
  telefonoControl = new FormControl(null, Validators.required)
  emailControl = new FormControl(null)
  nacimientoControl = new FormControl(null)
  direccionControl = new FormControl(null)

  tipoClienteList = Object.keys(TipoCliente)

  currency = new CurrencyMask;
  maxDate = new Date()

  formGroup: FormGroup;

  constructor(
    private personaService: PersonaService,
    private clienteService: ClienteService,
    @Inject(MAT_DIALOG_DATA) private data: AdicionarClienteData,
    private dialog: MatDialog,
    private personaSearch: PersonaSearchGQL,
    private notificacionService: NotificacionSnackbarService,
    private dialogRef: MatDialogRef<AddClienteDialogComponent>
  ) { }

  ngOnInit(): void {

    this.formGroup = new FormGroup({
      'tipoControl': this.tipoControl,
      'creditoControl': this.creditoControl,
      'nombreControl': this.nombreControl,
      'documentoControl': this.documentoControl,
      'telefonoControl': this.telefonoControl,
      'direccionControl': this.direccionControl
    })

    this.creditoControl.disable()

    this.tipoControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res: TipoCliente) => {
      if (res === TipoCliente.NORMAL) {
        this.creditoControl.disable()
      } else {
        this.creditoControl.enable()
      }
    })

    if (this.data?.cliente != null) {
      this.selectedCliente = this.data?.cliente;
      this.selectedPersona = this.selectedCliente.persona;
      this.tipoControl.setValue(this.selectedCliente?.tipo)
      this.creditoControl.setValue(this.selectedCliente?.credito)
      this.nombreControl.setValue(this.selectedPersona.nombre)
      this.apodoControl.setValue(this.selectedPersona?.apodo)
      this.documentoControl.setValue(this.selectedPersona?.documento)
      this.telefonoControl.setValue(this.selectedPersona?.telefono)
      this.emailControl.setValue(this.selectedPersona?.email)
      this.nacimientoControl.setValue(new Date(this.selectedPersona?.nacimiento))
      this.direccionControl.setValue(this.selectedPersona?.direccion)
    }

  }

  onBuscarPersona() {
    let tableData: TableData[] = [
      {
        id: 'id',
        nombre: 'Id'
      },
      {
        id: 'nombre',
        nombre: 'Nombre'
      },
      {
        id: 'documento',
        nombre: 'Documento'
      }
    ]
    let data: SearchListtDialogData = {
      query: this.personaSearch,
      tableData: tableData,
      titulo: 'Buscar persona',
      search: true,
      texto: this.nombreControl.value,
      inicialSearch: true
    }
    this.dialog.open(SearchListDialogComponent, {
      data: data,
      width: '60%',
      height: '80%'
    }).afterClosed().subscribe((res: Persona) => {
      if ((res) != null) {
        this.selectedPersona = res;
        if (res?.isCliente == true) {
          this.notificacionService.openWarn('Ya existe un cliente registrado con este documento')
          this.clienteService.onGetByPersonaId(res.id).pipe(untilDestroyed(this)).subscribe((res2: Cliente) => {
            this.selectedCliente = res2;
            this.tipoControl.setValue(this.selectedCliente?.tipo)
            this.creditoControl.setValue(this.selectedCliente?.credito)
          })
        }
        this.nombreControl.setValue(this.selectedPersona.nombre)
        this.apodoControl.setValue(this.selectedPersona?.apodo)
        this.documentoControl.setValue(this.selectedPersona?.documento)
        this.telefonoControl.setValue(this.selectedPersona?.telefono)
        this.emailControl.setValue(this.selectedPersona?.email)
        this.nacimientoControl.setValue(new Date(this.selectedPersona?.nacimiento))
        this.direccionControl.setValue(this.selectedPersona?.direccion)
      }
    })
  }

  onCrearPersona() {

  }

  onFechaNacimienntoChange(e) {

  }

  onCancel() {
    this.dialogRef.close(this.selectedCliente)
  }

  onSave() {
    let newPersona = new Persona()
    if (this.selectedPersona != null) Object.assign(newPersona, this.selectedPersona)
    newPersona.nombre = this.nombreControl.value;
    newPersona.apodo = this.apodoControl.value;
    newPersona.documento = this.documentoControl.value;
    newPersona.direccion = this.direccionControl.value;
    newPersona.nacimiento = this.nacimientoControl.value;
    newPersona.email = this.emailControl.value;
    newPersona.telefono = this.telefonoControl.value;
    this.personaService.onSavePersona(newPersona.toInput()).pipe(untilDestroyed(this)).subscribe((personaRes: Persona) => {
      if (personaRes != null) {
        this.selectedPersona = personaRes;
        let newCliente = new Cliente;
        if (this.selectedCliente != null) Object.assign(newCliente, this.selectedCliente)
        newCliente.persona = this.selectedPersona;
        newCliente.tipo = this.tipoControl.value;
        newCliente.credito = this.creditoControl.value;
        this.clienteService.onSaveCliente(newCliente.toInput()).pipe(untilDestroyed(this)).subscribe((clienteRes: Cliente) => {
          if (clienteRes != null) {
            this.selectedCliente = clienteRes;
          }
        })
      }
    })
  }

}

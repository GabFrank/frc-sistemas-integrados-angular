import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { Funcionario } from '../funcionario.model';

export class AdicionarFuncionarioDialogData {
  funcionario: Funcionario;
}

export interface Marcacion {
  fecha: string;
  sucursal: string;
  tipo: string;
}

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CurrencyMask } from '../../../../commons/core/utils/numbersUtils';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { PersonaSearchGQL } from '../../persona/graphql/personaSearch';
import { Persona } from '../../persona/persona.model';
import { FuncionarioService } from '../funcionario.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { AdicionarPersonaDialogComponent } from '../../persona/adicionar-persona-dialog/adicionar-persona-dialog.component';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { catchError, combineLatest, forkJoin, of } from 'rxjs';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { ClienteService } from '../../clientes/cliente.service';
import { Cliente } from '../../clientes/cliente.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MatSelect } from '@angular/material/select';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-funcionario-dialog',
  templateUrl: './adicionar-funcionario-dialog.component.html',
  styleUrls: ['./adicionar-funcionario-dialog.component.scss']
})
export class AdicionarFuncionarioDialogComponent implements OnInit {

  @ViewChild('sucursalSelect', {read: MatSelect}) sucursalSelect: MatSelect;

  selectedFuncionario: Funcionario;
  selectedPersona: Persona;
  selectedSupervisadoPor: Funcionario;
  selectedCliente: Cliente;

  sucursalControl = new FormControl(null, Validators.required)
  cargoControl = new FormControl(null)
  fechaIngresoControl = new FormControl(null)
  isCreditoControl = new FormControl(true)
  creditoControl = new FormControl(0)
  sueldoControl = new FormControl(null)
  bonus = new FormControl(null)
  fasePruebaControl = new FormControl(true)
  diaristaControl = new FormControl(false)
  supervisadoPorControl = new FormControl(null)
  activoControl = new FormControl(true)

  formGroup: FormGroup;

  monedaList: Moneda[];
  sucursalList: Sucursal[];
  supervisadoPorList: Funcionario[] = []
  cargoList: any[];
  marcacionesDataSource = new MatTableDataSource<Marcacion>([])

  currencyMask = new CurrencyMask();

  constructor(
    private sucursalService: SucursalService,
    private funcionarioService: FuncionarioService,
    @Inject(MAT_DIALOG_DATA) private data: AdicionarFuncionarioDialogData,
    private personaSearch: PersonaSearchGQL,
    private dialog: MatDialog,
    private matDialogRef: MatDialogRef<AdicionarFuncionarioDialogComponent>,
    private dialogoService: DialogosService,
    private monedaService: MonedaService,
    private clienteService: ClienteService
  ) {

  }

  ngOnInit(): void {

    this.formGroup = new FormGroup({
      sucursalControl: this.sucursalControl,
      cargoControl: this.cargoControl,
      fechaIngresoControl: this.fechaIngresoControl,
      creditoControl: this.creditoControl,
      sueldoControl: this.sueldoControl,
      fasePruebaControl: this.fasePruebaControl,
      diaristaControl: this.diaristaControl,
      supervisadoPorControl: this.supervisadoPorControl,
      activoControl: this.activoControl
    })

    setTimeout(() => {

      forkJoin(
        {
          sucResult: this.sucursalService.onGetAllSucursales(),
          monedaResult: this.monedaService.onGetAll()
        }
      ).subscribe((res) => {
        this.sucursalList = res['sucResult'].filter(s => s.deposito == true);
        this.monedaList = res['monedaResult'];

        if (this.data.funcionario == null) {
          this.onBuscarPersona();
        } else {
          this.funcionarioService.onGetFuncionarioById(this.data.funcionario.id)
            .pipe(untilDestroyed(this))
            .subscribe(res => {
              if (res != null) {
                this.onSelectFuncionario(res);
                this.clienteService.onGetByPersonaId(res.persona.id).pipe(untilDestroyed(this)).subscribe(clienteRes => {
                  if (clienteRes != null) {
                    this.selectedCliente = clienteRes;
                  }
                })
              }
            });
        }
      });

      // this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this)).subscribe(res => {
      //   this.sucursalList = res.filter(s => s.deposito == true);
      // })

      // if (this.data.funcionario == null) {
      //   this.onBuscarPersona()
      // } else {
      //   this.funcionarioService.onGetFuncionarioById(this.data.funcionario.id).pipe(untilDestroyed(this)).subscribe(res => {
      //     if (res != null) {
      //       this.onSelectFuncionario(res);
      //     }
      //   })
      // }

      this.cargoList = [
        {
          id: 1,
          descripcion: 'Cajero'
        },
        {
          id: 2,
          descripcion: 'Ayudante de caja'
        }
      ]
    }, 0);
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
      isAdicionar: true
    }
    this.dialog.open(SearchListDialogComponent, {
      data: data,
      width: '60%',
      height: '80%'
    }).afterClosed().subscribe((resPersona: Persona | any) => {
      if ((resPersona) != null && !resPersona?.adicionar) {
        this.funcionarioService.onGetFuncionarioPorPersona(resPersona?.id).pipe(untilDestroyed(this)).subscribe(resFuncionario => {
          if (resFuncionario != null) {
            this.dialogoService.confirm('Atención!!', 'Ya existe un funcionario vinculado a esta persona, desea abrir los datos?').pipe(untilDestroyed(this)).subscribe(resDialogo => {
              if (resDialogo) {
                this.onSelectFuncionario(resFuncionario);
              }
            })
          } else {
            this.selectedPersona = resPersona;
            setTimeout(() => {
              this.sucursalSelect.focus()
            }, 500);
          }
        })
      } else if (resPersona?.adicionar) {
        this.selectedPersona = null;
        this.onEditarPersona()
      } else {
        this.matDialogRef.close()
      }
    })
  }

  onSelectFuncionario(funcionario: Funcionario) {
    if (funcionario != null) {
      this.selectedFuncionario = new Funcionario();
      Object.assign(this.selectedFuncionario, funcionario)
      this.selectedPersona = funcionario.persona;
      this.sucursalControl.setValue(this.sucursalList.find(s => s.id == funcionario?.sucursal?.id))
      this.cargoControl.setValue(funcionario?.cargo)
      this.fechaIngresoControl.setValue(funcionario?.fechaIngreso != null ? new Date(funcionario?.fechaIngreso) : null)
      this.isCreditoControl.setValue(funcionario?.credito != null)
      this.creditoControl.setValue(funcionario?.credito)
      this.sueldoControl.setValue(funcionario?.sueldo)
      this.fasePruebaControl.setValue(funcionario?.fasePrueba)
      this.diaristaControl.setValue(funcionario?.diarista)
      this.supervisadoPorControl.setValue(funcionario?.supervisadoPor)
      this.activoControl.setValue(funcionario?.activo)
    }
  }


  handleCargoSelectionChange(e) {

  }

  handleSupervisadoPorSelectionChange(e) {
    this.selectedSupervisadoPor = e;
  }

  supervisadoPorTimer;
  handleSupervisadoPorInputChange(e) {
    if (e?.length > 0) {
      if (this.supervisadoPorTimer != null) {
        clearTimeout(this.supervisadoPorTimer)
      }
      setTimeout(() => {
        this.funcionarioService.onFuncionarioSearch(e).pipe(untilDestroyed(this)).subscribe(res => {
          if (res != null) {
            this.supervisadoPorList = res;
          }
        })
      }, 500);
    }
  }

  onSave() {
    if(this.selectedFuncionario == null) this.selectedFuncionario = new Funcionario();
    this.selectedFuncionario.activo = this.activoControl.value;
    this.selectedFuncionario.credito = this.creditoControl.value;
    this.selectedFuncionario.diarista = this.diaristaControl.value;
    this.selectedFuncionario.fasePrueba = this.fasePruebaControl.value;
    this.selectedFuncionario.fechaIngreso = this.fechaIngresoControl.value;
    this.selectedFuncionario.sucursal = this.sucursalControl.value;
    this.selectedFuncionario.sueldo = this.sueldoControl.value;
    this.selectedFuncionario.persona = this.selectedPersona;
    this.selectedFuncionario.supervisadoPor = this.supervisadoPorControl.value;
    this.selectedFuncionario.cargo = this.cargoControl.value;
    this.funcionarioService.onSaveFuncionario(this.selectedFuncionario.toInput()).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {

      }
    })
  }

  onCancel(){
    this.matDialogRef.close()
  }

  onEditarPersona() {
    this.dialog.open(AdicionarPersonaDialogComponent, {
      data: {
        persona: this.selectedPersona
      },
      width: '60%',
    }).afterClosed().subscribe(res => {
      if (res?.id != null) this.selectedPersona = res;
      if (this.selectedPersona == null) this.matDialogRef.close(null)
    })
  }
}

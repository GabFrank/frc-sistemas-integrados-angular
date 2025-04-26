import { Component, Inject, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { Ciudad } from "../../../general/ciudad/ciudad.model";
import { CiudadService } from "../../../general/ciudad/ciudad.service";
import { Pais } from "../../../general/pais/pais.model";
import { AdicionarPersonaDialogComponent } from "../../persona/adicionar-persona-dialog/adicionar-persona-dialog.component";
import {
  BuscarPersonaData,
  BuscarPersonaDialogComponent,
} from "../../persona/buscar-persona-dialog/buscar-persona-dialog.component";
import { Persona } from "../../persona/persona.model";
import { PersonaService } from "../../persona/persona.service";
import { Proveedor, ProveedorInput } from "../proveedor.model";
import { ProveedorService } from "../proveedor.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { PersonaSearchGQL } from "../../persona/graphql/personaSearch";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { PersonaInput } from "../../persona/persona/persona-input.model";

export class AdicionarProveedorData {
  proveedor: Proveedor;
}

@Component({
  selector: "app-adicionar-proveedor-dialog",
  templateUrl: "./adicionar-proveedor-dialog.component.html",
  styleUrls: ["./adicionar-proveedor-dialog.component.scss"],
})
export class AdicionarProveedorDialogComponent implements OnInit {
  selectedProveedor: Proveedor;
  selectedPersona: Persona;
  selectedCiudad: Ciudad;
  selectedPais: Pais;
  rucControl = new FormControl(null);

  nombreControl = new FormControl(null);
  creditoControl = new FormControl(false);
  chequeDiasControl = new FormControl(8);
  telefonoControl = new FormControl(null);
  isEditing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarProveedorData,
    private matDialogRef: MatDialogRef<AdicionarProveedorDialogComponent>,
    private personaService: PersonaService,
    private proveedorService: ProveedorService,
    private ciudadService: CiudadService,
    private matDialog: MatDialog,
    private personaSearch: PersonaSearchGQL,
    private dialogoService: DialogosService
  ) {
    if (data?.proveedor != null) {
      this.selectedProveedor = data?.proveedor;
    }
  }

  ngOnInit(): void {
    // this.nombreControl.disable();
    // this.rucControl.disable();
    if (this.data == null) {
      this.isEditing = true;
    }
  }

  onSearchPersona() {
    let tableData: TableData[] = [
      {
        id: "id",
        nombre: "Id",
      },
      {
        id: "nombre",
        nombre: "Nombre",
      },
      {
        id: "documento",
        nombre: "Documento",
      },
    ];
    let data: SearchListtDialogData = {
      query: this.personaSearch,
      tableData: tableData,
      titulo: "Buscar persona",
      search: true,
    };
    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        width: "60%",
        height: "80%",
      })
      .afterClosed()
      .subscribe((res: Persona) => {
        if (res?.id != null) {
          this.selectedPersona = res;
          this.nombreControl.setValue(this.selectedPersona.nombre);
          this.rucControl.setValue(this.selectedPersona.documento);
        }
      });
  }

  onSelectPersona(persona: Persona) {
    this.nombreControl.enable();
    this.nombreControl.setValue(persona?.nombre);
    this.nombreControl.disable();
    this.selectedPersona = persona;
  }

  onAddPersona() {
    this.matDialog
      .open(AdicionarPersonaDialogComponent, {
        width: "80%",
        height: "80%",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.onSelectPersona(res);
        }
      });
  }

  onCancelar() {
    this.matDialogRef.close(null);
  }

  onGuardar() {
    if (this.selectedPersona == null) {
      let persona = new Persona();
      persona.nombre = this.nombreControl.value;
      persona.documento = this.rucControl.value;
      persona.telefono = this.telefonoControl.value;
      this.personaService
        .onSavePersona(persona.toInput())
        .subscribe((personaRes) => {
          this.selectedPersona = personaRes;
          this.onSaveProveedor();
        });
    } else if(this.selectedProveedor == null){
      this.onSaveProveedor();
    } else {
      this.onSaveProveedor(this.selectedProveedor);
    }
  }

  onSaveProveedor(proveedor?: Proveedor){
    let proveedorInput = new ProveedorInput();
    if(proveedor != null){
      proveedorInput.id = proveedor?.id;
      proveedorInput.creadoEn = proveedor.creadoEn;
      proveedorInput.usuarioId = proveedor.usuario.id;
    }
    proveedorInput.chequeDias = this.chequeDiasControl.value;
    proveedorInput.credito = this.creditoControl.value;
    proveedorInput.personaId = this.selectedPersona.id;
    this.proveedorService.onSave(proveedorInput).subscribe((res) => {
      if (res != null) {
        this.matDialogRef.close(res);
      }
    });
  }

  onClearData() {
    this.onSelectPersona(null);
  }

  onRucFocusOut() {
    let ruc: string = this.rucControl.value;

    if (ruc != null && ruc != "") {
      this.personaService.onGetPorDocumento(ruc).subscribe((personaRes) => {
        if (personaRes?.id != null) {
          this.selectedPersona = personaRes;
          this.nombreControl.setValue(this.selectedPersona.nombre);
          this.rucControl.setValue(this.selectedPersona.documento);
          this.telefonoControl.setValue(this.selectedPersona.telefono);
          if (personaRes.isProveedor) {
            this.dialogoService
              .confirm(
                "Atención!!",
                "Este RUC/CI ya esta registrado como proveedor, desea cargar los datos?"
              )
              .subscribe((dialogRes) => {
                if (dialogRes) {
                  this.proveedorService
                    .onGetPorPersona(personaRes.id)
                    .subscribe((proveedorRes) => {
                      this.selectedProveedor = proveedorRes;
                    });
                } else {
                  this.rucControl.setValue(null);
                }
              });
          } else {
            this.dialogoService
              .confirm(
                "Atención!!",
                "Ya existe una persona registrada con este documento, desea cargar los datos?"
              )
              .subscribe((dialogRes) => {
                if (!dialogRes) {
                  this.rucControl.setValue(null);
                }
              });
          }
        }
      });
    }
  }
}

import { Component, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSelectionListChange } from "@angular/material/list";
import { Apollo } from "apollo-angular";
import { Observable } from "rxjs";
import { TabService } from "../../../layouts/tab/tab.service";
import { PersonaService } from "../persona/persona.service";
import { UsuarioInput } from "./usuario-input.model";
import { UsuarioService } from "./usuario.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-usuario",
  templateUrl: "./usuario.component.html",
  styleUrls: ["./usuario.component.css"],
})
export class UsuarioComponent implements OnInit {
  @Input() data;

  usuarioInput: UsuarioInput;
  formGroup: FormGroup;
  personaId = new FormControl(null, Validators.required);
  selectedRoles: string[] = [];
  assigedRoles: string[] = [];
  selectedAssignedRoles: string[] = [];

  personas: any[];
  selectedPersona;
  roles: string[] = [
    "Conceptos",
    "Bancario",
    "Finanzas",
    "Stock",
    "Ventas",
    "RRHH",
  ];

  titleAlert = "Este campo es necesario.";

  filteredOptions: Observable<any[]>;
  options: any[];

  constructor(
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.createForm();
    if (this.data.tabData != undefined) {
      this.formGroup.patchValue(this.data.tabData);
    }

    this.personaId.valueChanges
      // .pipe(
      //   // debounceTime(100),
      //   // distinctUntilChanged(),
      //   filter(value => value.length > 0)
      // )
      .pipe(untilDestroyed(this))
      .subscribe((v) => {
        if (v.toString().length > 0) {
          // this.personaService.searchByText(v.toString() , personasSearch).valueChanges.subscribe(
          //   ({ data }) => {
          //     this.personas = data.data;
          //   });
        } else {
          this.personas = [];
        }
      });
  }

  onPersonaSelected(persona) {
    this.selectedPersona = persona;
  }

  onSelectionChange(e: MatSelectionListChange): void {
    const selected = e.options[0].selected;
    const value = e.options[0].value;
    if (selected) {
      this.selectedRoles.push(value);
    } else {
      const roleIndex = this.selectedRoles.findIndex((x) => {
        return x == value;
      });
      this.selectedRoles.splice(roleIndex, 1);
    }
  }

  onAssignedSelectionChange(e: MatSelectionListChange): void {
    const selected = e.options[0].selected;
    const value = e.options[0].value;
    if (selected) {
      this.selectedAssignedRoles.push(value);
    } else {
      const roleIndex = this.selectedAssignedRoles.findIndex((x) => {
        return x == value;
      });
      this.selectedAssignedRoles.splice(roleIndex, 1);
    }
  }

  addRoles(): void {
    this.selectedRoles.forEach((role) => {
      const roleIndex = this.roles.findIndex((x) => x == role);
      this.roles.splice(roleIndex, 1);
      this.assigedRoles.push(role);
    });
    this.selectedRoles = [];
  }

  removeRoles(): void {
    this.selectedAssignedRoles.forEach((role) => {
      const roleIndex = this.assigedRoles.findIndex((x) => x == role);
      this.assigedRoles.splice(roleIndex, 1);
      this.roles.push(role);
    });
    this.selectedRoles = [];
  }

  createForm(): void {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("personaId", this.personaId);
  }

  onSubmit(): void {
    // this.usuarioInput = this.formGroup.value;
    // if (this.data.tabData != null) {
    //   this.usuarioInput.id = this.data.tabData.id;
    // }
    // this.service.onSave(this.usuarioInput, this.data);
  }
}

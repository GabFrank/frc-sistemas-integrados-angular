import { trigger, state, style, transition, animate } from "@angular/animations";
import { Component, Inject, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { Persona } from "../persona.model";
import { PersonaService } from "../persona.service";

export class BuscarPersonaData {
  persona?: Persona;
}
@Component({
  selector: "app-buscar-persona-dialog",
  templateUrl: "./buscar-persona-dialog.component.html",
  styleUrls: ["./buscar-persona-dialog.component.scss"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class BuscarPersonaDialogComponent implements OnInit {
  buscarControl = new FormControl();
  dataSource = new MatTableDataSource<Persona>();
  selectedRowIndex;
  expandedPersona: Persona;
  isSearching = false;
  onSearchTimer;

  displayedColumns = [
    "id",
    "nombre",
    "apodo",
    "vinculo",
    "documento",
    "telefono",
    "creadoEn",
    "creadoPor",
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BuscarPersonaData,
    private matDialogRef: MatDialogRef<BuscarPersonaDialogComponent>,
    private personaService: PersonaService
  ) {}

  ngOnInit(): void {
    this.buscarControl.valueChanges.subscribe((value) => {
      if (value != null) this.onSearchPersona(value);
    });
  }

  keydownEvent(e) {}

  onSearchPersona(text: string, offset?: number) {
    this.isSearching = true;
    if (this.onSearchTimer != null) {
      clearTimeout(this.onSearchTimer);
    }
    if (text == "" || text == null || text == " ") {
      console.log("text is ", text);
      this.dataSource != undefined ? (this.dataSource.data = []) : null;
      this.isSearching = false;
    } else {
      this.onSearchTimer = setTimeout(() => {
        this.personaService.onSearch(text).subscribe((res) => {
          this.dataSource.data = res;
          this.isSearching = false;
        });
      }, 1000);
    }
  }

  highlight(index: number) {
    console.log(index);
    if (index >= 0 && index <= this.dataSource.data.length - 1) {
      this.selectedRowIndex = index;
      this.expandedPersona = this.dataSource.data[index];
      this.getPersonaDetail(this.expandedPersona, index);
    }
  }

  onSelectRow(row: Persona){
    this.matDialogRef.close(row);
  }

  getPersonaDetail(persona?: Persona, index?) {}
}

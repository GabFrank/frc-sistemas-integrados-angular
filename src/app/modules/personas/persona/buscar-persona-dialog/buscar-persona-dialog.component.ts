import { Component, Inject, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { Persona } from "../persona.model";
import { PersonaSearchGQL } from "../graphql/personaSearch";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export class BuscarPersonaData {
  persona?: Persona;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-buscar-persona-dialog",
  templateUrl: "./buscar-persona-dialog.component.html",
  styleUrls: ["./buscar-persona-dialog.component.scss"],
})
export class BuscarPersonaDialogComponent implements OnInit {
  buscarControl = new FormControl();
  dataSource = new MatTableDataSource<Persona>();
  selectedRow: Persona | null = null;
  isSearching = false;

  displayedColumns = ["id", "nombre", "documento"];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BuscarPersonaData,
    private matDialogRef: MatDialogRef<BuscarPersonaDialogComponent>,
    private personaSearchGQL: PersonaSearchGQL
  ) { }

  ngOnInit(): void {
    this.buscarControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(value => {
        if (!value || value.trim() === '') {
          this.dataSource.data = [];
          this.isSearching = false;
        }
      }),
      filter(value => value && value.trim() !== ''),
      tap(() => this.isSearching = true),
      switchMap(value =>
        this.personaSearchGQL.fetch(
          { texto: value.toUpperCase() },
          { fetchPolicy: 'no-cache', errorPolicy: 'all', context: { clientName: 'servidor' } }
        ).pipe(
          catchError(() => of({ data: { data: [] } }))
        )
      ),
      untilDestroyed(this)
    ).subscribe(res => {
      this.isSearching = false;
      if (res?.data?.['data']) {
        this.dataSource.data = res.data['data'];
      } else {
        this.dataSource.data = [];
      }
    });
  }

  onSearch(): void {
    const text = this.buscarControl.value;
    if (text && text.trim() !== '') {
      this.buscarControl.setValue(text);
    }
  }

  onSelectRow(row: Persona): void {
    this.matDialogRef.close(row);
  }

  onCancelar(): void {
    this.matDialogRef.close();
  }
}
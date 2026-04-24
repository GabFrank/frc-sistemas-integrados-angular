import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LogicalReplicationService } from '../logical-replication.service';
import { LogicalReplication } from '../logical-replication.model';
import { MainToAllTableNamesGQL } from '../graphql/table-names-gql';
import { Observable } from 'rxjs';

export interface EditRemotePublicationDialogData {
  branchSucursalId: number;
  publication?: LogicalReplication;
  isEdit: boolean;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-remote-publication-dialog',
  templateUrl: './edit-remote-publication-dialog.component.html',
  styleUrls: ['./edit-remote-publication-dialog.component.scss']
})
export class EditRemotePublicationDialogComponent implements OnInit {
  
  form: FormGroup;
  isLoading = false;
  isLoadingTables = false;
  errorMessage: string = null;
  
  // Tablas disponibles para incluir en la publicación
  availableTables: string[] = [];

  constructor(
    private dialogRef: MatDialogRef<EditRemotePublicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditRemotePublicationDialogData,
    private formBuilder: FormBuilder,
    private logicalReplicationService: LogicalReplicationService,
    private mainToAllTableNamesGQL: MainToAllTableNamesGQL
  ) { }

  ngOnInit(): void {
    // Initialize form
    this.form = this.formBuilder.group({
      publicationName: ['', Validators.required],
      selectedTables: [[], Validators.required]
    });

    if (this.data.isEdit) {
      // We're editing an existing publication
      this.form.get('publicationName').setValue(this.data.publication.name);
      this.form.get('publicationName').disable(); // Can't change publication name

      if (this.data.publication.tables) {
        this.form.get('selectedTables').setValue(this.data.publication.tables);
      }
    } else {
      // Generate a suggested publication name
      this.logicalReplicationService.generateBranchPublicationName(this.data.branchSucursalId)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (name) => {
            this.form.get('publicationName').setValue(name);
          },
          error: (error) => {
            console.error('Error generating publication name', error);
          }
        });
    }

    // Cargar tablas disponibles desde el backend
    this.loadAvailableTables();
  }

  private loadAvailableTables(): void {
    this.isLoadingTables = true;

    this.mainToAllTableNamesGQL
      .watch()
      .valueChanges
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          const data = result?.data as { data: string[] };
          this.availableTables = data?.data || [];

          // Si es creación y no hay selección previa, seleccionar todas por defecto
          if (!this.data.isEdit && this.availableTables.length > 0) {
            this.form.get('selectedTables')?.setValue([...this.availableTables]);
          }

          this.isLoadingTables = false;
        },
        error: (error) => {
          console.error('Error loading table names', error);
          this.isLoadingTables = false;
          this.errorMessage = 'Error al cargar las tablas disponibles para la publicación';
        }
      });
  }

  onSave(): void {
    if (this.form.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const publicationName = this.data.isEdit ? 
      this.data.publication.name : 
      this.form.get('publicationName').value;
    
    const tables = this.form.get('selectedTables').value;

    const operation: Observable<any> = this.data.isEdit ?
      this.logicalReplicationService.editRemotePublication(this.data.branchSucursalId, publicationName, tables) :
      this.logicalReplicationService.createRemotePublication(this.data.branchSucursalId, publicationName, tables);

    operation.pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result && result.success) {
            this.dialogRef.close(true);
          } else {
            this.errorMessage = result?.message || 'Error desconocido al guardar la publicación';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error?.message || 'Error al comunicarse con el servidor';
          console.error('Error saving publication', error);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  toggleAllTables(): void {
    const selectedTables = this.form.get('selectedTables').value;
    
    if (selectedTables.length === this.availableTables.length) {
      // Deselect all
      this.form.get('selectedTables').setValue([]);
    } else {
      // Select all
      this.form.get('selectedTables').setValue([...this.availableTables]);
    }
  }
} 
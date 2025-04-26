import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LogicalReplicationService } from '../logical-replication.service';
import { LogicalReplication } from '../logical-replication.model';
import { Observable, forkJoin, of } from 'rxjs';

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
  errorMessage: string = null;
  
  // Common database tables that might be included in publications
  commonTables: string[] = [
    'cliente', 'factura', 'factura_detalle', 'producto', 'categoria', 
    'marca', 'inventario', 'movimiento', 'sucursal', 'ciudad',
    'usuario', 'proveedor', 'compra', 'compra_detalle', 'precio'
  ];

  constructor(
    private dialogRef: MatDialogRef<EditRemotePublicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditRemotePublicationDialogData,
    private formBuilder: FormBuilder,
    private logicalReplicationService: LogicalReplicationService
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
    
    if (selectedTables.length === this.commonTables.length) {
      // Deselect all
      this.form.get('selectedTables').setValue([]);
    } else {
      // Select all
      this.form.get('selectedTables').setValue([...this.commonTables]);
    }
  }
} 
import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ReplicationDirection, ReplicationTable } from '../replication-table.model';
import { ReplicationTableService } from '../replication-table.service';

export interface EditReplicationTableDialogData {
  isEdit: boolean;
  table?: ReplicationTable;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-replication-table-dialog',
  templateUrl: './edit-replication-table-dialog.component.html',
  styleUrls: ['./edit-replication-table-dialog.component.scss']
})
export class EditReplicationTableDialogComponent implements OnInit {
  tableForm: FormGroup;
  isLoading = false;
  errorMsg = '';
  
  // Pre-calculated properties to avoid function calls in template
  directionOptions: { value: ReplicationDirection, label: string }[] = [];
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditReplicationTableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditReplicationTableDialogData,
    private replicationTableService: ReplicationTableService,
    private snackBar: MatSnackBar
  ) { 
    // Initialize direction options
    this.directionOptions = this.replicationTableService.getDirectionOptions();
  }

  ngOnInit(): void {
    // Initialize form
    this.tableForm = this.fb.group({
      id: [this.data.table?.id || null],
      tableName: [this.data.table?.tableName || '', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      description: [this.data.table?.description || ''],
      direction: [this.data.table?.direction || ReplicationDirection.MAIN_TO_ALL, Validators.required],
      enabled: [this.data.table?.enabled !== undefined ? this.data.table.enabled : true]
    });
    
    // If editing, lock the table name
    if (this.data.isEdit) {
      this.tableForm.get('tableName').disable();
    }
  }
  
  onSave(): void {
    if (this.tableForm.invalid) {
      // Mark form controls as touched to trigger validation messages
      Object.keys(this.tableForm.controls).forEach(key => {
        const control = this.tableForm.get(key);
        control.markAsTouched();
      });
      return;
    }
    
    this.isLoading = true;
    this.errorMsg = '';
    
    // Enable tableName control to include it in the form value
    if (this.data.isEdit) {
      this.tableForm.get('tableName').enable();
    }
    
    // Convert form value to ReplicationTable
    const replicationTable: ReplicationTable = this.tableForm.value;
    
    // Convert tableName to UPPERCASE as per requirements
    replicationTable.tableName = replicationTable.tableName.toUpperCase();
    
    this.replicationTableService.saveReplicationTable(replicationTable)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (savedTable) => {
          this.isLoading = false;
          
          if (savedTable) {
            this.snackBar.open(
              `Tabla de replicación ${this.data.isEdit ? 'actualizada' : 'creada'} correctamente`, 
              'Cerrar', 
              { duration: 3000 }
            );
            this.dialogRef.close(true);
          } else {
            this.errorMsg = 'No se pudo guardar la tabla de replicación';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving replication table:', error);
          this.errorMsg = error?.message || 'Error al guardar la tabla de replicación';
          
          // If editing, disable tableName again
          if (this.data.isEdit) {
            this.tableForm.get('tableName').disable();
          }
        }
      });
  }
  
  onCancel(): void {
    this.dialogRef.close(false);
  }
  
  // Keep this method for compatibility but don't use it in the template
  getDirectionOptions(): { value: ReplicationDirection, label: string }[] {
    return this.directionOptions;
  }
  
  // Method to get validation error messages
  getErrorMessage(controlName: string): string {
    const control = this.tableForm.get(controlName);
    
    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (control.hasError('pattern')) {
      return 'Solo se permiten letras, números y guiones bajos';
    }
    
    return '';
  }
} 
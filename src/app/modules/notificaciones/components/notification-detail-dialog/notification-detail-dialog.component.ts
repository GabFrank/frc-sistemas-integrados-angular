import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificacionData } from '../../services/notificaciones-tablero.service';

@Component({
  selector: 'app-notification-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './notification-detail-dialog.component.html',
  styles: [`
    .detail-row {
      margin-bottom: 12px;
    }
    .detail-label {
      font-weight: 600;
      font-size: 12px;
      color: rgba(253, 252, 252, 1);
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 14px;
      line-height: 1.5;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-read {
      background-color: #e0f2f1;
      color: #f30b0bff;
    }
    .status-unread {
      background-color: #ffebee;
      color: #c62828;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationDetailDialogComponent {
  public readonly dialogRef = inject(MatDialogRef<NotificationDetailDialogComponent>);
  public readonly data = inject<NotificacionData>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}


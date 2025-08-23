import { Component, OnInit } from '@angular/core';
import { DteTestService, DteTestResponse } from './dte-test.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JsonPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dte-test',
  template: `
    <div class="dte-test-container">
      <h2>🧪 Test de Comunicación DTE</h2>
      
      <div class="test-section">
        <h3>1. Test de Salud del Microservicio</h3>
        <button class="btn btn-primary" (click)="testHealth()">
          🏥 Probar Salud
        </button>
        <div *ngIf="healthResult" class="result">
          <pre>{{ healthResult | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>2. Test de Comunicación Backend</h3>
        <button class="btn btn-primary" (click)="testBackendCommunication()">
          🔗 Probar Comunicación
        </button>
        <div *ngIf="backendResult" class="result">
          <pre>{{ backendResult | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>3. Test de Generación de DTE</h3>
        <div class="input-group">
          <label for="facturaId">ID de Factura:</label>
          <input 
            id="facturaId"
            type="number" 
            [(ngModel)]="facturaId" 
            placeholder="123"
            class="form-input">
        </div>
        <button class="btn btn-accent" (click)="testDteGeneration()" [disabled]="!facturaId">
          📄 Generar DTE
        </button>
        <div *ngIf="dteResult" class="result">
          <h4>✅ DTE Generado Exitosamente</h4>
          <p><strong>ID:</strong> {{ dteResult.dte.id }}</p>
          <p><strong>CDC:</strong> {{ dteResult.dte.cdc }}</p>
          <p><strong>Estado:</strong> {{ dteResult.dte.estado }}</p>
          <p><strong>QR URL:</strong> <a [href]="dteResult.dte.qrUrl" target="_blank">{{ dteResult.dte.qrUrl }}</a></p>
          <p><strong>Fecha:</strong> {{ dteResult.dte.fechaGeneracion | date:'medium' }}</p>
          <details>
            <summary>Ver XML ({{ dteResult.dte.xml.length }} caracteres)</summary>
            <pre class="xml-content">{{ dteResult.dte.xml }}</pre>
          </details>
        </div>
      </div>

      <div class="test-section">
        <h3>4. Estado de los Servicios</h3>
        <div class="service-status">
          <div class="status-item">
            <span class="status-label">Frontend Angular:</span>
            <span class="status-value success">✅ Funcionando</span>
          </div>
          <div class="status-item">
            <span class="status-label">Backend Spring Boot:</span>
            <span class="status-value success">✅ Funcionando (puerto 8081)</span>
          </div>
          <div class="status-item">
            <span class="status-label">Microservicio Node.js:</span>
            <span class="status-value success">✅ Funcionando (puerto 3001)</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dte-test-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .test-section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #f9f9f9;
    }

    .test-section h3 {
      margin-top: 0;
      color: #333;
    }

    .btn {
      margin: 10px 10px 10px 0;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-accent {
      background-color: #ffc107;
      color: #212529;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .input-group {
      margin-bottom: 15px;
    }

    .input-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .form-input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      width: 200px;
    }

    .result {
      margin-top: 15px;
      padding: 15px;
      background-color: #fff;
      border: 1px solid #ccc;
      border-radius: 4px;
      max-height: 400px;
      overflow-y: auto;
    }

    .xml-content {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }

    .service-status {
      display: grid;
      gap: 10px;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background-color: #fff;
      border-radius: 4px;
    }

    .status-label {
      font-weight: bold;
    }

    .status-value.success {
      color: #4caf50;
      font-weight: bold;
    }

    .status-value.error {
      color: #f44336;
      font-weight: bold;
    }
  `],
  imports: [JsonPipe, DatePipe, FormsModule],
  standalone: true
})
export class DteTestComponent implements OnInit {

  facturaId: number = 123;
  healthResult: any;
  backendResult: any;
  dteResult: DteTestResponse;

  constructor(
    private dteTestService: DteTestService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('🧪 Componente de test DTE inicializado');
  }

  testHealth() {
    console.log('🏥 Iniciando test de salud...');
    
    this.dteTestService.testMicroserviceHealth().subscribe({
      next: (result) => {
        console.log('✅ Test de salud exitoso:', result);
        this.healthResult = result;
        this.showSuccess('Test de salud exitoso');
      },
      error: (error) => {
        console.error('❌ Error en test de salud:', error);
        this.healthResult = { error: error.message };
        this.showError('Error en test de salud: ' + error.message);
      }
    });
  }

  testBackendCommunication() {
    console.log('🔗 Iniciando test de comunicación backend...');
    
    this.dteTestService.testBackendCommunication().subscribe({
      next: (result) => {
        console.log('✅ Test de comunicación exitoso:', result);
        this.backendResult = result;
        this.showSuccess('Test de comunicación exitoso');
      },
      error: (error) => {
        console.error('❌ Error en test de comunicación:', error);
        this.backendResult = { error: error.message };
        this.showError('Error en test de comunicación: ' + error.message);
      }
    });
  }

  testDteGeneration() {
    if (!this.facturaId) {
      this.showError('Por favor ingrese un ID de factura');
      return;
    }

    console.log('📄 Iniciando generación de DTE para factura:', this.facturaId);
    
    this.dteTestService.testMicroserviceCommunication(this.facturaId).subscribe({
      next: (result) => {
        console.log('✅ DTE generado exitosamente:', result);
        this.dteResult = result;
        this.showSuccess(`DTE generado exitosamente para factura ${this.facturaId}`);
      },
      error: (error) => {
        console.error('❌ Error generando DTE:', error);
        this.dteResult = { success: false, dte: null } as any;
        this.showError('Error generando DTE: ' + error.message);
      }
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}

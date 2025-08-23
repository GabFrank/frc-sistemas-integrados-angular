import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DteTestResponse {
  success: boolean;
  dte: {
    id: number;
    cdc: string;
    xml: string;
    qrUrl: string;
    estado: string;
    fechaGeneracion: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DteTestService {

  private readonly baseUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) { }

  /**
   * Test de comunicación directa con el microservicio Node.js
   */
  testMicroserviceCommunication(facturaId: number): Observable<DteTestResponse> {
    const url = `${this.baseUrl}/documento/generar`;
    const body = { facturaId };
    
    console.log('🔄 Probando comunicación con microservicio:', { url, body });
    
    return this.http.post<DteTestResponse>(url, body);
  }

  /**
   * Test de salud del microservicio
   */
  testMicroserviceHealth(): Observable<any> {
    const url = `${this.baseUrl}/health`;
    
    console.log('🏥 Probando salud del microservicio:', url);
    
    return this.http.get(url);
  }

  /**
   * Test de endpoint de comunicación
   */
  testBackendCommunication(): Observable<any> {
    const url = `${this.baseUrl}/test-backend-communication`;
    
    console.log('🔗 Probando endpoint de comunicación:', url);
    
    return this.http.get(url);
  }
}

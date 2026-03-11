export class Moneda {
  id: number;
  nombre: string;
  simbolo: string;

  constructor() {
    this.id = 0;
    this.nombre = '';
    this.simbolo = '';
  }

  // Método para convertir a objeto para GraphQL
  toInput(): any {
    return {
      id: this.id || undefined,
      nombre: this.nombre,
      simbolo: this.simbolo
    };
  }
} 
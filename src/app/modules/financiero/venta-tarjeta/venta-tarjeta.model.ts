export interface VentaTarjeta {
  id: number;
  sucursalId: number;
  sucursal?: { id: number; nombre: string; };
  venta?: { id: number; totalGs: number; };
  terminalPos?: { id: number; codigo: string; descripcion: string; moneda?: { id: number; simbolo: string; }; };
  monto: number;
  montoEscaneado?: number;
  estado: string;
  creadoEn: string;
  usuario?: { id: number; nickname: string; };
}

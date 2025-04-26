export class ProductoInput {
  id?: number;
  descripcion: string;
  descripcionFactura: string;
  iva: number;
  unidadPorCaja: number;
  unidadPorCajaSecundaria: number;
  balanza: boolean;
  stock: boolean;
  garantia: boolean;
  tiempoGarantia: boolean;
  cambiable: boolean;
  ingredientes: boolean;
  combo: boolean;
  promocion: boolean;
  vencimiento: boolean;
  diasVencimiento: number;
  usuarioId?: number;
  imagenes?: string;
  tipoConservacion: string;
  subfamiliaId: number;
  isEnvase: boolean;
  envaseId: number;
  activo: boolean
  creadoEn: String
}

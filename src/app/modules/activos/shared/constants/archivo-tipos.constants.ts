import { TipoArchivoEnte } from '../../ente/enums/tipo-archivo-ente.enum';
import { TipoArchivoOpcion } from '../components/ente-archivos-panel/ente-archivos-panel.component';

export const ARCHIVOS_INMUEBLE: TipoArchivoOpcion[] = [
  { tipo: TipoArchivoEnte.CONTRATO_COMPRA, etiqueta: 'Documentos de compra' },
  { tipo: TipoArchivoEnte.CONTRATO_ALQUILER, etiqueta: 'Contrato de alquiler' },
  { tipo: TipoArchivoEnte.DOCUMENTO_TRANSFERENCIA, etiqueta: 'Transferencia' },
  { tipo: TipoArchivoEnte.FOTO_ESTADO_INICIAL, etiqueta: 'Fotos estado inicial' },
  { tipo: TipoArchivoEnte.FACTURA, etiqueta: 'Factura' },
];

export const ARCHIVOS_VEHICULO: TipoArchivoOpcion[] = [
  { tipo: TipoArchivoEnte.CONTRATO_COMPRA, etiqueta: 'Documentos de compra' },
  { tipo: TipoArchivoEnte.DOCUMENTO_TRANSFERENCIA, etiqueta: 'Transferencia' },
  { tipo: TipoArchivoEnte.FOTO_ESTADO_INICIAL, etiqueta: 'Fotos estado inicial' },
];

export const ARCHIVOS_MUEBLE_EQUIPO: TipoArchivoOpcion[] = [
  { tipo: TipoArchivoEnte.CONTRATO_COMPRA, etiqueta: 'Documentos de compra' },
  { tipo: TipoArchivoEnte.CONTRATO_COMODATO, etiqueta: 'Contrato comodato' },
  { tipo: TipoArchivoEnte.FOTO_ESTADO_INICIAL, etiqueta: 'Fotos estado inicial' },
];

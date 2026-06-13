import { FormaPagoEstadistica } from "../forma-pago/interfaces/forma-pago-estadistica.model";
import { GastoCategoriaItem } from "../gasto-categoria/interfaces/gasto-categoria-item.model";
import { IngresoGastoMesAcumulado } from "../venta-mes/interfaces/ingreso-gasto-mes-acumulado.model";
import { ProductoVendidoEstadistica } from "../producto-vendido/interfaces/producto-vendido-estadistica.model";
import { VentaFuncionarioItem } from "../venta-funcionario/interfaces/venta-funcionario-item.model";
import { VentaSucursalItem } from "../venta-sucursal/venta-sucursal-item.model";
import { VentaCiudadItem } from "../venta-ciudad/venta-ciudad-item.model";
import { VentasPorHoraItem } from "../venta-sucursal/ventas-por-hora-item.model";

/** Datos de ejemplo solo para el dashboard de inicio (vista previa). */
export const SUBTITULO_VISTA_PREVIA =
  "Vista previa · datos de ejemplo";

export const MOCK_VENTAS_POR_SUCURSAL: VentaSucursalItem[] = [
  { sucId: 1, nombre: "Canindeyu 1", total: 85_000_000 },
  { sucId: 2, nombre: "Curuguaty 2", total: 72_000_000 },
  { sucId: 3, nombre: "Paloma 2", total: 68_000_000 },
  { sucId: 4, nombre: "Renacer", total: 91_000_000 },
  { sucId: 5, nombre: "KM2", total: 54_000_000 },
  { sucId: 6, nombre: "Fiesta", total: 78_000_000 },
];

export const MOCK_VENTAS_POR_CIUDAD: VentaCiudadItem[] = [
  { ciudadId: 1, nombre: "Katuete", total: 157_000_000 },
  { ciudadId: 2, nombre: "Curuguaty", total: 72_000_000 },
  { ciudadId: 3, nombre: "Paloma", total: 68_000_000 },
  { ciudadId: 4, nombre: "Renacer", total: 91_000_000 },
  { ciudadId: 5, nombre: "Ciudad del Este", total: 132_000_000 },
];

export const MOCK_FORMAS_PAGO: FormaPagoEstadistica[] = [
  {
    formaPagoId: 1,
    descripcion: "Efectivo",
    cantidadTransacciones: 1200,
    totalMonto: 450_000_000,
    porcentaje: 52,
  },
  {
    formaPagoId: 2,
    descripcion: "Tarjeta",
    cantidadTransacciones: 680,
    totalMonto: 180_000_000,
    porcentaje: 21,
  },
  {
    formaPagoId: 3,
    descripcion: "Convenio",
    cantidadTransacciones: 320,
    totalMonto: 95_000_000,
    porcentaje: 11,
  },
  {
    formaPagoId: 4,
    descripcion: "Transferencia",
    cantidadTransacciones: 210,
    totalMonto: 65_000_000,
    porcentaje: 8,
  },
  {
    formaPagoId: 5,
    descripcion: "Cheque",
    cantidadTransacciones: 85,
    totalMonto: 25_000_000,
    porcentaje: 3,
  },
];

export const MOCK_GASTOS_CATEGORIA: GastoCategoriaItem[] = [
  { categoria: "Servicios", total: 42_000_000 },
  { categoria: "Sueldos", total: 88_000_000 },
  { categoria: "Alquiler", total: 35_000_000 },
  { categoria: "Mantenimiento", total: 18_500_000 },
  { categoria: "Impuestos", total: 52_000_000 },
  { categoria: "Otros", total: 12_000_000 },
];

export const MOCK_INGRESOS_MES: IngresoGastoMesAcumulado[] = [
  { mes: 1, total: 480_000_000 },
  { mes: 2, total: 520_000_000 },
  { mes: 3, total: 440_000_000 },
  { mes: 4, total: 490_000_000 },
  { mes: 5, total: 560_000_000 },
  { mes: 6, total: 620_000_000 },
  { mes: 7, total: 510_000_000 },
  { mes: 8, total: 535_000_000 },
  { mes: 9, total: 470_000_000 },
  { mes: 10, total: 590_000_000 },
  { mes: 11, total: 610_000_000 },
  { mes: 12, total: 680_000_000 },
];

export const MOCK_GASTOS_MES: IngresoGastoMesAcumulado[] = [
  { mes: 1, total: 145_000_000 },
  { mes: 2, total: 152_000_000 },
  { mes: 3, total: 138_000_000 },
  { mes: 4, total: 148_000_000 },
  { mes: 5, total: 165_000_000 },
  { mes: 6, total: 178_000_000 },
  { mes: 7, total: 155_000_000 },
  { mes: 8, total: 162_000_000 },
  { mes: 9, total: 149_000_000 },
  { mes: 10, total: 171_000_000 },
  { mes: 11, total: 168_000_000 },
  { mes: 12, total: 185_000_000 },
];

/** Curva típica de ventas por hora (comercio). */
export const MOCK_VENTAS_POR_HORA: VentasPorHoraItem[] = [
  0, 0, 0, 0, 0, 0, 1_200_000, 2_800_000, 4_500_000, 5_200_000, 6_100_000,
  7_400_000, 8_200_000, 6_800_000, 5_900_000, 6_500_000, 7_800_000, 9_100_000,
  8_400_000, 6_200_000, 4_100_000, 2_500_000, 1_100_000, 0,
].map((total, hora) => ({ hora, total }));

export const MOCK_VENTAS_FUNCIONARIO: VentaFuncionarioItem[] = [
  { id: 1, funcionario: "Ana García", total: 125_000_000, cantidad: 340 },
  { id: 2, funcionario: "Carlos López", total: 98_500_000, cantidad: 285 },
  { id: 3, funcionario: "María Fernández", total: 87_200_000, cantidad: 256 },
  { id: 4, funcionario: "Juan Pérez", total: 76_800_000, cantidad: 221 },
  { id: 5, funcionario: "Lucía Martínez", total: 65_400_000, cantidad: 198 },
];

export const MOCK_PRODUCTOS_TOP: ProductoVendidoEstadistica[] = [
  {
    productoId: "1",
    descripcion: "Paracetamol 500mg x20",
    cantidad: 1250,
    totalMonto: 18_750_000,
    porcentaje: 22,
  },
  {
    productoId: "2",
    descripcion: "Ibuprofeno 400mg x30",
    cantidad: 980,
    totalMonto: 14_200_000,
    porcentaje: 17,
  },
  {
    productoId: "3",
    descripcion: "Alcohol en gel 500ml",
    cantidad: 870,
    totalMonto: 8_900_000,
    porcentaje: 12,
  },
  {
    productoId: "4",
    descripcion: "Vitamina C efervescente",
    cantidad: 720,
    totalMonto: 7_100_000,
    porcentaje: 10,
  },
  {
    productoId: "5",
    descripcion: "Jarabe antitusivo",
    cantidad: 650,
    totalMonto: 6_400_000,
    porcentaje: 8,
  },
];

export const MOCK_PRODUCTOS_BAJA_ROTACION: ProductoVendidoEstadistica[] = [
  {
    productoId: "10",
    descripcion: "Suplemento especializado",
    cantidad: 12,
    totalMonto: 480_000,
    porcentaje: 1,
  },
  {
    productoId: "11",
    descripcion: "Crema dermatológica premium",
    cantidad: 18,
    totalMonto: 720_000,
    porcentaje: 1.2,
  },
  {
    productoId: "12",
    descripcion: "Equipo ortopédico talla S",
    cantidad: 9,
    totalMonto: 350_000,
    porcentaje: 0.8,
  },
  {
    productoId: "13",
    descripcion: "Inyectable importado",
    cantidad: 15,
    totalMonto: 890_000,
    porcentaje: 1.1,
  },
  {
    productoId: "14",
    descripcion: "Kit primeros auxilios deluxe",
    cantidad: 22,
    totalMonto: 1_100_000,
    porcentaje: 1.5,
  },
];

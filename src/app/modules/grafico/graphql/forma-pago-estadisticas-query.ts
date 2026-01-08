import gql from 'graphql-tag';

/**
 * Query para obtener estadísticas de formas de pago (todas las sucursales)
 */
export const formaPagoEstadisticasQuery = gql`
  {
    data: formaPagoEstadisticas {
      formaPagoId
      descripcion
      cantidadTransacciones
      totalMonto
      porcentaje
    }
  }
`;

/**
 * Query para obtener estadísticas de formas de pago por sucursal específica
 */
export const formaPagoEstadisticasPorSucursalQuery = gql`
  query formaPagoEstadisticasPorSucursal($sucursalId: ID!) {
    data: formaPagoEstadisticasPorSucursal(sucursalId: $sucursalId) {
      formaPagoId
      descripcion
      cantidadTransacciones
      totalMonto
      porcentaje
    }
  }
`;

/**
 * Query para obtener estadísticas de formas de pago con filtros opcionales
 * @param inicio - Fecha de inicio en formato "yyyy-MM-dd HH:mm:ss" (opcional)
 * @param fin - Fecha de fin en formato "yyyy-MM-dd HH:mm:ss" (opcional)
 * @param sucursalId - ID de la sucursal (opcional)
 */
export const formaPagoEstadisticasConFiltrosQuery = gql`
  query formaPagoEstadisticasConFiltros($inicio: String, $fin: String, $sucursalId: ID) {
    data: formaPagoEstadisticasConFiltros(inicio: $inicio, fin: $fin, sucursalId: $sucursalId) {
      formaPagoId
      descripcion
      cantidadTransacciones
      totalMonto
      porcentaje
    }
  }
`;

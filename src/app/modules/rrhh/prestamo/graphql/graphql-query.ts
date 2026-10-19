import gql from "graphql-tag";

const PRESTAMO_FIELDS = `
  id
  funcionario { id persona { id nombre } }
  descripcion
  montoTotal
  montoPagado
  moneda { id denominacion }
  fechaInicio
  cantidadCuotas
  estado
  observacion
`;

const CUOTA_FIELDS = `id numero fechaVencimiento monto montoPagado estado fechaPago`;

export const prestamosPorFuncionarioQuery = gql`
  query ($funcionarioId: ID!) {
    data: prestamosPorFuncionario(funcionarioId: $funcionarioId) { ${PRESTAMO_FIELDS} }
  }
`;

export const prestamosPageQuery = gql`
  query ($page: Int, $size: Int, $funcionarioId: ID, $estado: PrestamoEstado) {
    data: prestamosPage(page: $page, size: $size, funcionarioId: $funcionarioId, estado: $estado) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${PRESTAMO_FIELDS} }
    }
  }
`;

export const prestamoCuotasQuery = gql`
  query ($prestamoId: ID!) {
    data: prestamoCuotas(prestamoId: $prestamoId) { ${CUOTA_FIELDS} }
  }
`;

// Con y sin `claveIdempotencia`: un central anterior al cambio no conoce el argumento y rechaza el pedido
// entero, así que el servicio cae a la versión sin clave (franco-system-backend-servidor#376).
const crearPrestamo = (conClave: boolean) => gql`
  mutation crearPrestamo($prestamo: PrestamoInput!, $cajaVirtualId: ID!${conClave ? ', $claveIdempotencia: String' : ''}) {
    data: crearPrestamo(prestamo: $prestamo, cajaVirtualId: $cajaVirtualId${conClave ? ', claveIdempotencia: $claveIdempotencia' : ''}) { ${PRESTAMO_FIELDS} }
  }
`;
export const crearPrestamoMutation = crearPrestamo(true);
export const crearPrestamoSinClaveMutation = crearPrestamo(false);

export const cobrarCuotaMutation = gql`
  mutation cobrarCuota($cuotaId: ID!, $cajaVirtualId: ID!, $montoPago: Float, $montoPagadoEsperado: Float) {
    data: cobrarCuota(cuotaId: $cuotaId, cajaVirtualId: $cajaVirtualId, montoPago: $montoPago, montoPagadoEsperado: $montoPagadoEsperado) { ${CUOTA_FIELDS} }
  }
`;

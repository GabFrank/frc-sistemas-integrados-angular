import gql from 'graphql-tag';

// OJO: OperacionFinancieraPage y MovimientoBancarioPage (backend) SOLO exponen
// getTotalElements + getContent — a diferencia del paginado estándar del resto del
// sistema (getTotalPages/isFirst/isLast/hasNext/hasPrevious/getNumberOfElements).
// No pedir esos campos acá: el backend no los tiene y la query fallaría en validación.

const operacionFinancieraFields = `
  id
  tipoOperacion
  categoria {
    id
    nombre
  }
  descripcion
  cajaMayorOrigen {
    id
    nombre
  }
  cuentaBancariaOrigen {
    id
    numero
    banco {
      id
      nombre
    }
  }
  monedaOrigen {
    id
    denominacion
    simbolo
  }
  montoOrigen
  cajaMayorDestino {
    id
    nombre
  }
  cuentaBancariaDestino {
    id
    numero
    banco {
      id
      nombre
    }
  }
  monedaDestino {
    id
    denominacion
    simbolo
  }
  montoDestino
  cotizacion
  numeroComprobante
  diferencia
  diferenciaDestinoTipo
  diferenciaObservacion
  anulado
  creadoEn
`;

export const operacionesFinancierasQuery = gql`
  query ($page: Int, $size: Int) {
    data: operacionesFinancieras(page: $page, size: $size) {
      getTotalElements
      getContent {
        ${operacionFinancieraFields}
      }
    }
  }
`;

export const operacionFinancieraQuery = gql`
  query ($id: ID!) {
    data: operacionFinanciera(id: $id) {
      ${operacionFinancieraFields}
    }
  }
`;

export const operacionFinancieraCategoriasQuery = gql`
  query {
    data: operacionFinancieraCategorias {
      id
      nombre
      icono
      activo
      padre {
        id
        nombre
      }
    }
  }
`;

// Con y sin `claveIdempotencia`: un central anterior al cambio no conoce el argumento y rechaza el pedido
// entero, así que el servicio cae a la versión sin clave (franco-system-backend-servidor#376).
const registrarOperacionFinanciera = (conClave: boolean) => gql`
  mutation registrarOperacionFinanciera($input: OperacionFinancieraInput!${conClave ? ', $claveIdempotencia: String' : ''}) {
    data: registrarOperacionFinanciera(input: $input${conClave ? ', claveIdempotencia: $claveIdempotencia' : ''}) {
      ${operacionFinancieraFields}
    }
  }
`;
export const registrarOperacionFinancieraMutation = registrarOperacionFinanciera(true);
export const registrarOperacionFinancieraSinClaveMutation = registrarOperacionFinanciera(false);

export const anularOperacionFinancieraMutation = gql`
  mutation anularOperacionFinanciera($id: ID!, $motivo: String) {
    data: anularOperacionFinanciera(id: $id, motivo: $motivo) {
      id
      anulado
    }
  }
`;

const movimientoBancarioFields = `
  id
  cuentaBancaria {
    id
    numero
    moneda {
      id
      simbolo
    }
  }
  tipoMovimiento
  monto
  saldoAnterior
  saldoPosterior
  descripcion
  anulado
  creadoEn
  origenTipo
  origenId
  pagoId
  usuario {
    id
    persona {
      id
      nombre
    }
  }
`;

export const movimientosBancariosQuery = gql`
  query ($cuentaBancariaId: ID!, $desde: String, $fin: String, $tipo: String, $soloActivos: Boolean, $page: Int, $size: Int) {
    data: movimientosBancarios(cuentaBancariaId: $cuentaBancariaId, desde: $desde, fin: $fin, tipo: $tipo, soloActivos: $soloActivos, page: $page, size: $size) {
      getTotalElements
      getContent {
        ${movimientoBancarioFields}
      }
    }
  }
`;

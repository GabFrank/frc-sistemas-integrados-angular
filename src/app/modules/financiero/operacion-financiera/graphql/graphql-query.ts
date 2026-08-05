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

export const registrarOperacionFinancieraMutation = gql`
  mutation registrarOperacionFinanciera($input: OperacionFinancieraInput!) {
    data: registrarOperacionFinanciera(input: $input) {
      ${operacionFinancieraFields}
    }
  }
`;

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
  usuario {
    id
    persona {
      id
      nombre
    }
  }
`;

export const movimientosBancariosQuery = gql`
  query ($cuentaBancariaId: ID!, $page: Int, $size: Int) {
    data: movimientosBancarios(cuentaBancariaId: $cuentaBancariaId, page: $page, size: $size) {
      getTotalElements
      getContent {
        ${movimientoBancarioFields}
      }
    }
  }
`;

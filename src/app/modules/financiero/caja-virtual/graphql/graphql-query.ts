import gql from 'graphql-tag';

const cajaVirtualFields = `
  id
  nombre
  tipo
  sucursal {
    id
    nombre
  }
  responsable {
    id
    persona {
      id
      nombre
    }
  }
  usuario {
    id
    persona {
      id
      nombre
    }
  }
  saldoGs
  saldoRs
  saldoDs
  limiteGs
  descripcion
  activo
  creadoEn
`;

export const cajaVirtualesQuery = gql`
  query ($page: Int, $size: Int) {
    data: cajaVirtuales(page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ${cajaVirtualFields}
      }
    }
  }
`;

export const cajaVirtualesFilterQuery = gql`
  query ($nombre: String, $tipo: CajaVirtualTipo, $sucursalId: Int, $activo: Boolean, $page: Int, $size: Int) {
    data: cajaVirtualesFilter(nombre: $nombre, tipo: $tipo, sucursalId: $sucursalId, activo: $activo, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ${cajaVirtualFields}
      }
    }
  }
`;

export const cajaVirtualesPorTipoQuery = gql`
  query ($tipo: CajaVirtualTipo!) {
    data: cajaVirtualesPorTipo(tipo: $tipo) {
      ${cajaVirtualFields}
    }
  }
`;

export const cajaVirtualesActivasQuery = gql`
  query {
    data: cajaVirtualesActivas {
      ${cajaVirtualFields}
    }
  }
`;

export const saveCajaVirtualMutation = gql`
  mutation saveCajaVirtual($input: CajaVirtualInput!) {
    data: saveCajaVirtual(input: $input) {
      ${cajaVirtualFields}
    }
  }
`;

export const deleteCajaVirtualMutation = gql`
  mutation deleteCajaVirtual($id: ID!) {
    data: deleteCajaVirtual(id: $id)
  }
`;

export const cajaVirtualSaldosQuery = gql`
  query ($cajaVirtualId: ID!) {
    data: cajaVirtualSaldos(cajaVirtualId: $cajaVirtualId) {
      saldo
      moneda {
        id
        denominacion
        simbolo
      }
    }
  }
`;

export const cajaVirtualResumenBancarioQuery = gql`
  query ($cajaVirtualId: ID!) {
    data: cajaVirtualResumenBancario(cajaVirtualId: $cajaVirtualId) {
      saldo
      saldoReservado
      saldoFuturo
      cuentaBancaria {
        id
        numero
        banco { id nombre }
        moneda { id denominacion simbolo }
      }
    }
  }
`;

export const cajaVirtualConfiguracionQuery = gql`
  query ($cajaVirtualId: ID!) {
    data: cajaVirtualConfiguracion(cajaVirtualId: $cajaVirtualId) {
      id
      mostrarCuentasPorPagar
      mostrarCuentasPorCobrar
      operacionesFinancierasHabilitado
      cuentasBancariasOrden
      cuentasBancariasVisibles {
        id
        numero
        banco { id nombre }
        moneda { id simbolo }
      }
    }
  }
`;

export const saveCajaVirtualConfiguracionMutation = gql`
  mutation saveCajaVirtualConfiguracion($input: CajaVirtualConfiguracionInput!) {
    data: saveCajaVirtualConfiguracion(input: $input) {
      id
      mostrarCuentasPorPagar
      mostrarCuentasPorCobrar
      operacionesFinancierasHabilitado
      cuentasBancariasOrden
    }
  }
`;

const movimientoFields = `
  id
  cajaVirtual {
    id
    nombre
  }
  tipoMovimiento
  cantidad
  saldoAnterior
  saldoPosterior
  moneda {
    id
    denominacion
    simbolo
  }
  referenciaId
  descripcion
  usuario {
    id
    persona {
      id
      nombre
    }
  }
  cajaOrigen {
    id
    nombre
  }
  cajaDestino {
    id
    nombre
  }
  activo
  creadoEn
`;

export const movimientosCajaVirtualQuery = gql`
  query ($cajaVirtualId: ID!, $page: Int, $size: Int) {
    data: movimientosCajaVirtual(cajaVirtualId: $cajaVirtualId, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ${movimientoFields}
      }
    }
  }
`;

export const movimientosCajaVirtualPorFechaQuery = gql`
  query ($cajaVirtualId: ID!, $inicio: String, $fin: String, $page: Int, $size: Int) {
    data: movimientosCajaVirtualPorFecha(cajaVirtualId: $cajaVirtualId, inicio: $inicio, fin: $fin, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ${movimientoFields}
      }
    }
  }
`;

export const movimientosCajaVirtualFilterQuery = gql`
  query ($cajaVirtualId: ID!, $desde: String, $fin: String, $tipo: CajaVirtualTipoMovimiento, $soloActivos: Boolean, $page: Int, $size: Int) {
    data: movimientosCajaVirtualFilter(cajaVirtualId: $cajaVirtualId, desde: $desde, fin: $fin, tipo: $tipo, soloActivos: $soloActivos, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ${movimientoFields}
      }
    }
  }
`;

export const saveMovimientoCajaVirtualMutation = gql`
  mutation saveMovimientoCajaVirtual($input: MovimientoCajaVirtualInput!) {
    data: saveMovimientoCajaVirtual(input: $input) {
      ${movimientoFields}
    }
  }
`;

export const anularMovimientoCajaVirtualMutation = gql`
  mutation anularMovimientoCajaVirtual($id: ID!, $motivo: String) {
    data: anularMovimientoCajaVirtual(id: $id, motivo: $motivo) {
      ${movimientoFields}
    }
  }
`;

export const realizarTransferenciaQuery = gql`
  mutation realizarTransferenciaCajaVirtual(
    $origenId: ID!
    $destinoId: ID!
    $cantidad: Float!
    $monedaId: ID!
    $descripcion: String
    $usuarioId: ID
  ) {
    data: realizarTransferenciaCajaVirtual(
      origenId: $origenId
      destinoId: $destinoId
      cantidad: $cantidad
      monedaId: $monedaId
      descripcion: $descripcion
      usuarioId: $usuarioId
    )
  }
`;

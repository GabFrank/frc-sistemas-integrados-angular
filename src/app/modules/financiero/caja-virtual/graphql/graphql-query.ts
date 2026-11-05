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
    nickname
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
        decimales
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
        moneda { id denominacion simbolo decimales }
      }
    }
  }
`;

/**
 * Cuentas a las que se puede depositar desde la caja (las visibles de su configuración). Es la que usa
 * el rol acotado TESORERIA CAJA, que no ve el resumen bancario; para ese rol el central no devuelve saldo.
 */
export const cuentasBancariasParaDepositoQuery = gql`
  query ($cajaVirtualId: ID!) {
    data: cuentasBancariasParaDeposito(cajaVirtualId: $cajaVirtualId) {
      id
      numero
      nombre
      banco { id nombre }
      moneda { id denominacion simbolo }
    }
  }
`;

/**
 * Cajas marcadas «recibe envíos»: destinos de una transferencia para quien no tiene acceso sobre ellas.
 * El central devuelve solo nombre y sucursal.
 */
export const cajasVirtualesReceptorasQuery = gql`
  query {
    data: cajasVirtualesReceptoras {
      id
      nombre
      sucursalNombre
    }
  }
`;

/**
 * La marca «recibe envíos» de una caja. Va en una consulta propia y no en los listados: así un central
 * que todavía no conoce el campo solo afecta a la acción de marcarla.
 */
export const cajaVirtualRecibeEnviosQuery = gql`
  query ($id: ID!) {
    data: cajaVirtual(id: $id) {
      id
      recibeEnvios
    }
  }
`;

export const marcarCajaRecibeEnviosMutation = gql`
  mutation ($cajaVirtualId: ID!, $recibe: Boolean!) {
    data: marcarCajaRecibeEnvios(cajaVirtualId: $cajaVirtualId, recibe: $recibe) {
      id
      recibeEnvios
    }
  }
`;

/**
 * Las sucursales que cubre una caja: la propia y las adicionales. Consulta propia, igual que la marca
 * «recibe envíos»: un central que no conoce el campo solo afecta a quien la pide.
 */
export const cajaVirtualSucursalesQuery = gql`
  query ($id: ID!) {
    data: cajaVirtual(id: $id) {
      id
      sucursal {
        id
        nombre
        ciudad {
          id
        }
      }
      sucursalesAdicionales {
        id
        nombre
      }
    }
  }
`;

export const guardarSucursalesDeCajaMutation = gql`
  mutation ($cajaVirtualId: ID!, $sucursalIds: [ID!]!) {
    data: guardarSucursalesDeCaja(cajaVirtualId: $cajaVirtualId, sucursalIds: $sucursalIds) {
      id
      sucursalesAdicionales {
        id
        nombre
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
  origenTipo
  origenId
  origenSucursalId
  esPagoConsolidado
  descripcion
  usuario {
    id
    nickname
    persona {
      id
      nombre
    }
  }
  responsable {
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
  query ($cajaVirtualId: ID!, $desde: String, $fin: String, $tipo: CajaVirtualTipoMovimiento, $monedaId: ID, $soloActivos: Boolean, $page: Int, $size: Int) {
    data: movimientosCajaVirtualFilter(cajaVirtualId: $cajaVirtualId, desde: $desde, fin: $fin, tipo: $tipo, monedaId: $monedaId, soloActivos: $soloActivos, page: $page, size: $size) {
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

// Reportes PDF (base64) de la tabla de movimientos del dashboard, con los mismos filtros.
export const imprimirReporteMovimientosCajaVirtualQuery = gql`
  query ($cajaVirtualId: ID!, $desde: String, $fin: String, $tipo: CajaVirtualTipoMovimiento, $monedaId: ID, $soloActivos: Boolean) {
    data: imprimirReporteMovimientosCajaVirtual(cajaVirtualId: $cajaVirtualId, desde: $desde, fin: $fin, tipo: $tipo, monedaId: $monedaId, soloActivos: $soloActivos)
  }
`;

export const imprimirReporteMovimientosBancariosQuery = gql`
  query ($cajaVirtualId: ID!, $cuentaBancariaId: ID!, $desde: String, $fin: String, $tipo: String, $soloActivos: Boolean) {
    data: imprimirReporteMovimientosBancarios(cajaVirtualId: $cajaVirtualId, cuentaBancariaId: $cuentaBancariaId, desde: $desde, fin: $fin, tipo: $tipo, soloActivos: $soloActivos)
  }
`;

export const saveMovimientoCajaVirtualMutation = gql`
  mutation saveMovimientoCajaVirtual($input: MovimientoCajaVirtualInput!) {
    data: saveMovimientoCajaVirtual(input: $input) {
      ${movimientoFields}
    }
  }
`;

// El desktop manda el saldo que tenía en pantalla y lo contado; la diferencia la calcula el central
// (franco-system-backend-servidor#376).
export const ajustarCajaVirtualPorConteoMutation = gql`
  mutation ajustarCajaVirtualPorConteo($cajaVirtualId: ID!, $monedaId: ID!, $saldoEsperado: Float!, $contado: Float!) {
    data: ajustarCajaVirtualPorConteo(
      cajaVirtualId: $cajaVirtualId, monedaId: $monedaId, saldoEsperado: $saldoEsperado, contado: $contado
    ) {
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

// Un solo pedido con todos los montos: el central registra todo o nada. La clave de idempotencia hace que
// repetirlo no registre de nuevo (franco-system-backend-servidor#376).
export const registrarMovimientosCajaVirtualMutation = gql`
  mutation registrarMovimientosCajaVirtual(
    $cajaVirtualId: ID!
    $tipoMovimiento: CajaVirtualTipoMovimiento!
    $montos: [MontoCajaVirtualInput!]!
    $descripcion: String
    $claveIdempotencia: String
    $responsableId: ID
  ) {
    data: registrarMovimientosCajaVirtual(
      cajaVirtualId: $cajaVirtualId
      tipoMovimiento: $tipoMovimiento
      montos: $montos
      descripcion: $descripcion
      claveIdempotencia: $claveIdempotencia
      responsableId: $responsableId
    )
  }
`;

export const realizarTransferenciasCajaVirtualMutation = gql`
  mutation realizarTransferenciasCajaVirtual(
    $origenId: ID!
    $destinoId: ID!
    $montos: [MontoCajaVirtualInput!]!
    $descripcion: String
    $claveIdempotencia: String
  ) {
    data: realizarTransferenciasCajaVirtual(
      origenId: $origenId
      destinoId: $destinoId
      montos: $montos
      descripcion: $descripcion
      claveIdempotencia: $claveIdempotencia
    )
  }
`;

// ── Acceso por caja (ACL) ──
// El rol habilita la capacidad, estas filas delimitan sobre que cajas. El responsable de la
// caja tiene acceso total implicito y NO aparece en la lista: es quien la administra.
export const cajaVirtualAccesosQuery = gql`
  query ($cajaVirtualId: ID!) {
    data: cajaVirtualAccesos(cajaVirtualId: $cajaVirtualId) {
      id
      puedeLeer
      puedeEscribir
      creadoEn
      usuario { id nickname persona { id nombre } }
      otorgadoPor { id nickname }
    }
  }
`;

export const otorgarAccesoCajaMutation = gql`
  mutation ($cajaVirtualId: ID!, $usuarioId: ID!, $puedeLeer: Boolean, $puedeEscribir: Boolean) {
    data: otorgarAccesoCaja(
      cajaVirtualId: $cajaVirtualId, usuarioId: $usuarioId,
      puedeLeer: $puedeLeer, puedeEscribir: $puedeEscribir
    ) {
      id
      puedeLeer
      puedeEscribir
      usuario { id nickname persona { id nombre } }
    }
  }
`;

export const revocarAccesoCajaMutation = gql`
  mutation ($cajaVirtualId: ID!, $usuarioId: ID!) {
    data: revocarAccesoCaja(cajaVirtualId: $cajaVirtualId, usuarioId: $usuarioId)
  }
`;

export const transferirPropiedadCajaMutation = gql`
  mutation ($cajaVirtualId: ID!, $nuevoPropietarioId: ID!) {
    data: transferirPropiedadCaja(cajaVirtualId: $cajaVirtualId, nuevoPropietarioId: $nuevoPropietarioId) {
      id
      nombre
      usuario { id nickname persona { id nombre } }
    }
  }
`;

// Señal de que cambió el saldo de una caja o de una cuenta: el que la recibe relee la caja con las consultas de siempre.
export const tesoreriaCambioSubQuery = gql`
  subscription {
    data: tesoreriaCambioSub {
      cajaVirtualId
      cuentaBancariaId
    }
  }
`;

// Vuelto de un egreso (efectivo, vario o pago de gasto): lista paginada de egresos con algo pendiente
// de devolver, y el registro del vuelto. devuelto y pendiente vienen en la moneda del egreso.
export const egresosParaVueltoQuery = gql`
  query ($cajaVirtualId: ID!, $texto: String, $page: Int, $size: Int) {
    data: egresosParaVuelto(cajaVirtualId: $cajaVirtualId, texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        devuelto
        pendiente
        movimiento {
          ${movimientoFields}
        }
      }
    }
  }
`;

export const registrarVueltoEgresoMutation = gql`
  mutation ($egresoId: ID!, $monedaId: ID!, $monto: Float!, $descripcion: String, $claveIdempotencia: String) {
    data: registrarVueltoEgreso(egresoId: $egresoId, monedaId: $monedaId, monto: $monto, descripcion: $descripcion, claveIdempotencia: $claveIdempotencia) {
      id
    }
  }
`;

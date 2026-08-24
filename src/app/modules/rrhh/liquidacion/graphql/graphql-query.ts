import gql from "graphql-tag";

const ITEM_FIELDS = `id codigo descripcion monto tipo referenciaTipo manual editado editadoPor { id nickname } editadoEn montoOriginal`;
const LIQ_FIELDS = `
  id funcionario { id persona { id nombre } } periodo fechaInicio fechaFin
  salarioBase totalHaberes totalDescuentos totalNeto
  moneda { id denominacion } estado observacion
`;

export const liquidacionByIdQuery = gql`
  query ($id: ID!) { data: liquidacionSueldo(id: $id) { ${LIQ_FIELDS} } }
`;
export const liquidacionesPorFuncionarioQuery = gql`
  query ($funcionarioId: ID!) { data: liquidacionesPorFuncionario(funcionarioId: $funcionarioId) { ${LIQ_FIELDS} } }
`;
export const liquidacionesPorPeriodoQuery = gql`
  query ($periodo: String!) { data: liquidacionesPorPeriodo(periodo: $periodo) { ${LIQ_FIELDS} } }
`;
export const liquidacionItemsQuery = gql`
  query ($liquidacionId: ID!) { data: liquidacionItems(liquidacionId: $liquidacionId) { ${ITEM_FIELDS} } }
`;
export const liquidacionesPageQuery = gql`
  query ($page: Int, $size: Int, $funcionarioId: ID, $funcionarioNombre: String, $periodo: String, $estado: LiquidacionSueldoEstado) {
    data: liquidacionesPage(page: $page, size: $size, funcionarioId: $funcionarioId, funcionarioNombre: $funcionarioNombre, periodo: $periodo, estado: $estado) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${LIQ_FIELDS} }
    }
  }
`;
export const generarBorradorMutation = gql`
  mutation generarLiquidacionBorrador($funcionarioId: ID!, $periodo: String!, $monedaId: ID) {
    data: generarLiquidacionBorrador(funcionarioId: $funcionarioId, periodo: $periodo, monedaId: $monedaId) { ${LIQ_FIELDS} }
  }
`;
export const generarMesMutation = gql`
  mutation generarLiquidacionesMes($periodo: String!, $monedaId: ID) { data: generarLiquidacionesMes(periodo: $periodo, monedaId: $monedaId) }
`;
export const agregarItemMutation = gql`
  mutation agregarItemLiquidacion($liquidacionId: ID!, $descripcion: String, $monto: Float, $tipo: LiquidacionItemTipo) {
    data: agregarItemLiquidacion(liquidacionId: $liquidacionId, descripcion: $descripcion, monto: $monto, tipo: $tipo) { ${ITEM_FIELDS} }
  }
`;
export const editarItemMutation = gql`
  mutation editarItemLiquidacion($itemId: ID!, $descripcion: String, $monto: Float, $tipo: LiquidacionItemTipo, $usuarioId: ID) {
    data: editarItemLiquidacion(itemId: $itemId, descripcion: $descripcion, monto: $monto, tipo: $tipo, usuarioId: $usuarioId) { ${ITEM_FIELDS} }
  }
`;
export const eliminarItemMutation = gql`
  mutation eliminarItemLiquidacion($itemId: ID!) { data: eliminarItemLiquidacion(itemId: $itemId) }
`;
export const aprobarLiquidacionMutation = gql`
  mutation aprobarLiquidacion($id: ID!, $aprobadoPorId: ID) { data: aprobarLiquidacion(id: $id, aprobadoPorId: $aprobadoPorId) { ${LIQ_FIELDS} } }
`;
export const volverBorradorMutation = gql`
  mutation volverBorradorLiquidacion($id: ID!) { data: volverBorradorLiquidacion(id: $id) { ${LIQ_FIELDS} } }
`;
export const pagarLiquidacionMutation = gql`
  mutation pagarLiquidacion($id: ID!, $cajaVirtualId: ID!) { data: pagarLiquidacion(id: $id, cajaVirtualId: $cajaVirtualId) { ${LIQ_FIELDS} } }
`;
export const anularLiquidacionMutation = gql`
  mutation anularLiquidacion($id: ID!) { data: anularLiquidacion(id: $id) { ${LIQ_FIELDS} } }
`;
export const imprimirReciboLiquidacionQuery = gql`
  query ($id: ID!, $anchoMm: Int, $escpos: Boolean) { data: imprimirReciboLiquidacion(id: $id, anchoMm: $anchoMm, escpos: $escpos) }
`;

export const generarLoteMutation = gql`
  mutation generarLiquidacionesLote($funcionarioIds: [Int], $periodo: String!, $monedaId: ID) {
    data: generarLiquidacionesLote(funcionarioIds: $funcionarioIds, periodo: $periodo, monedaId: $monedaId)
  }
`;

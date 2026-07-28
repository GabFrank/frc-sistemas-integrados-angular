import gql from "graphql-tag";

const ITEM = `id concepto descripcion monto tipo manual editado editadoPor { id nickname } editadoEn montoOriginal`;
const LF = `
  id funcionario { id persona { id nombre } } fechaEgreso motivoEgreso
  antiguedadDias antiguedadMeses antiguedadAnios salarioPromedio
  indemnizacionAplica indemnizacionMonto diasVacacionesNoGozadas montoVacacionesNoGozadas
  aguinaldoProporcional preavisoOtorgado preavisoDias preavisoMonto preavisoEsDescuento
  totalLiquidado moneda { id denominacion } estado observacion
  items { ${ITEM} }
`;

export const liquidacionesFinalesPorFuncionarioQuery = gql`
  query ($funcionarioId: ID!) { data: liquidacionesFinalesPorFuncionario(funcionarioId: $funcionarioId) { ${LF} } }
`;
export const liquidacionFinalItemsQuery = gql`
  query ($liquidacionFinalId: ID!) { data: liquidacionFinalItems(liquidacionFinalId: $liquidacionFinalId) { ${ITEM} } }
`;
export const generarLiquidacionFinalMutation = gql`
  mutation generarLiquidacionFinal($input: LiquidacionFinalGenerarInput!) {
    data: generarLiquidacionFinal(input: $input) { ${LF} }
  }
`;
export const previewLiquidacionFinalQuery = gql`
  query ($funcionarioId: ID!, $fechaEgreso: String) {
    data: previewLiquidacionFinal(funcionarioId: $funcionarioId, fechaEgreso: $fechaEgreso) {
      fechaIngreso antiguedadAnios antiguedadDias salarioPromedio sueldoBase
      diasTrabajadosMes salarioDelMes aguinaldoProporcional
      diasVacacionesNoGozadas preavisoDias ipsBase ipsActivo
    }
  }
`;
export const aprobarLiquidacionFinalMutation = gql`
  mutation aprobarLiquidacionFinal($id: ID!, $aprobadoPorId: ID) { data: aprobarLiquidacionFinal(id: $id, aprobadoPorId: $aprobadoPorId) { ${LF} } }
`;
export const volverBorradorLiquidacionFinalMutation = gql`
  mutation volverBorradorLiquidacionFinal($id: ID!) { data: volverBorradorLiquidacionFinal(id: $id) { ${LF} } }
`;
export const pagarLiquidacionFinalMutation = gql`
  mutation pagarLiquidacionFinal($id: ID!, $cajaVirtualId: ID!) { data: pagarLiquidacionFinal(id: $id, cajaVirtualId: $cajaVirtualId) { ${LF} } }
`;
export const anularLiquidacionFinalMutation = gql`
  mutation anularLiquidacionFinal($id: ID!) { data: anularLiquidacionFinal(id: $id) { ${LF} } }
`;

export const agregarItemLiquidacionFinalMutation = gql`
  mutation agregarItemLiquidacionFinal($liquidacionFinalId: ID!, $descripcion: String, $monto: Float, $tipo: LiquidacionItemTipo) {
    data: agregarItemLiquidacionFinal(liquidacionFinalId: $liquidacionFinalId, descripcion: $descripcion, monto: $monto, tipo: $tipo) { ${ITEM} }
  }
`;
export const editarItemLiquidacionFinalMutation = gql`
  mutation editarItemLiquidacionFinal($itemId: ID!, $descripcion: String, $monto: Float, $tipo: LiquidacionItemTipo, $usuarioId: ID) {
    data: editarItemLiquidacionFinal(itemId: $itemId, descripcion: $descripcion, monto: $monto, tipo: $tipo, usuarioId: $usuarioId) { ${ITEM} }
  }
`;
export const eliminarItemLiquidacionFinalMutation = gql`
  mutation eliminarItemLiquidacionFinal($itemId: ID!) { data: eliminarItemLiquidacionFinal(itemId: $itemId) }
`;

export const imprimirReciboFinalQuery = gql`
  query ($id: ID!, $anchoMm: Int) { data: imprimirReciboFinal(id: $id, anchoMm: $anchoMm) }
`;

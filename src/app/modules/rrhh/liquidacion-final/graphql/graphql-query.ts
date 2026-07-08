import gql from "graphql-tag";

const ITEM = `id concepto descripcion monto`;
const LF = `
  id funcionario { id persona { id nombre } } fechaEgreso motivoEgreso
  antiguedadDias antiguedadMeses antiguedadAnios salarioPromedio
  indemnizacionAplica indemnizacionMonto diasVacacionesNoGozadas montoVacacionesNoGozadas
  aguinaldoProporcional totalLiquidado moneda { id denominacion } estado observacion
  items { ${ITEM} }
`;

export const liquidacionesFinalesPorFuncionarioQuery = gql`
  query ($funcionarioId: ID!) { data: liquidacionesFinalesPorFuncionario(funcionarioId: $funcionarioId) { ${LF} } }
`;
export const liquidacionFinalItemsQuery = gql`
  query ($liquidacionFinalId: ID!) { data: liquidacionFinalItems(liquidacionFinalId: $liquidacionFinalId) { ${ITEM} } }
`;
export const generarLiquidacionFinalMutation = gql`
  mutation generarLiquidacionFinal($funcionarioId: ID!, $motivoEgreso: MotivoEgreso!, $fechaEgreso: String, $monedaId: ID) {
    data: generarLiquidacionFinal(funcionarioId: $funcionarioId, motivoEgreso: $motivoEgreso, fechaEgreso: $fechaEgreso, monedaId: $monedaId) { ${LF} }
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

export const imprimirReciboFinalQuery = gql`
  query ($id: ID!) { data: imprimirReciboFinal(id: $id) }
`;

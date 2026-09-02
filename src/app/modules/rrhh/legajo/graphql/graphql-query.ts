import gql from "graphql-tag";

const FUNC = `funcionario { id persona { id nombre } }`;
const CARGO_HIST = `id ${FUNC} cargo { id nombre } fechaDesde fechaHasta motivo autorizadoPor { id } creadoEn`;
const SALARIO_HIST = `id ${FUNC} salarioAnterior salarioNuevo moneda { id denominacion } fechaVigencia motivo autorizadoPor { id } creadoEn`;
const DOC = `id ${FUNC} tipo nombreArchivo rutaRelativa mimeType tamanoBytes fechaSubida vencimiento observacion anulado creadoEn`;
// Tiene que traer TODOS los campos que la cabecera del legajo pinta: el componente
// reemplaza `funcionario` con lo que devuelven estas mutations, asi que un campo que
// falte acá se ve como si el dato se hubiera borrado hasta recargar la pestaña.
const FUNC_FULL = `id activo sueldo credito fechaIngreso fechaEgreso motivoEgreso diarista cargo { id nombre } persona { id nombre } sucursal { id nombre } moneda { id denominacion }`;

export const cargoHistoricosQuery = gql`
  query ($funcionarioId: ID!) { data: funcionarioCargoHistoricos(funcionarioId: $funcionarioId) { ${CARGO_HIST} } }
`;
export const salarioHistoricosQuery = gql`
  query ($funcionarioId: ID!) { data: funcionarioSalarioHistoricos(funcionarioId: $funcionarioId) { ${SALARIO_HIST} } }
`;
export const documentosQuery = gql`
  query ($funcionarioId: ID!) { data: funcionarioDocumentos(funcionarioId: $funcionarioId) { ${DOC} } }
`;
export const documentoContenidoQuery = gql`
  query ($id: ID!) { data: funcionarioDocumentoContenido(id: $id) }
`;
export const cambiarCargoMutation = gql`
  mutation cambiarCargoFuncionario($input: CambioCargoInput!) {
    data: cambiarCargoFuncionario(input: $input) { ${FUNC_FULL} }
  }
`;
export const cambiarSalarioMutation = gql`
  mutation cambiarSalarioFuncionario($input: CambioSalarioInput!) {
    data: cambiarSalarioFuncionario(input: $input) { ${FUNC_FULL} }
  }
`;
export const egresarFuncionarioMutation = gql`
  mutation egresarFuncionario($funcionarioId: ID!, $fecha: String, $motivo: String) {
    data: egresarFuncionario(funcionarioId: $funcionarioId, fecha: $fecha, motivo: $motivo) { ${FUNC_FULL} }
  }
`;
const EGRESO_SNAP = `id fechaEgreso motivoEgreso creditoAnterior clienteTipoAnterior clienteCreditoAnterior egresadoPor { id nickname }`;
export const egresoVigenteQuery = gql`
  query ($funcionarioId: ID!) { data: egresoVigenteFuncionario(funcionarioId: $funcionarioId) { ${EGRESO_SNAP} } }
`;
export const revertirEgresoFuncionarioMutation = gql`
  mutation revertirEgresoFuncionario($funcionarioId: ID!, $credito: Float, $motivo: String) {
    data: revertirEgresoFuncionario(funcionarioId: $funcionarioId, credito: $credito, motivo: $motivo) { ${FUNC_FULL} }
  }
`;
export const saveDocumentoMutation = gql`
  mutation saveFuncionarioDocumento($input: FuncionarioDocumentoInput!) {
    data: saveFuncionarioDocumento(input: $input) { ${DOC} }
  }
`;
export const anularDocumentoMutation = gql`
  mutation anularFuncionarioDocumento($id: ID!) { data: anularFuncionarioDocumento(id: $id) { id anulado } }
`;

import gql from 'graphql-tag';

const campos = `
  id nombre descripcion montoMinimo modoParticipacion cantidadFija topePorVenta incluyeTarjeta
  fechaDesde fechaHasta fechaSorteo todasSucursales activo creadoEn usuarioNickname tieneParticipaciones
  sucursales { id nombre }
  premios { id orden descripcion cantidad producto { id descripcion } }
`;

export const filterSorteosQuery = gql`
  query filterSorteos($texto: String, $soloVigentes: Boolean, $page: Int, $size: Int) {
    data: filterSorteos(texto: $texto, soloVigentes: $soloVigentes, page: $page, size: $size) {
      getContent { ${campos} }
      getTotalElements
    }
  }
`;

export const sorteoQuery = gql`
  query sorteo($id: Int) {
    data: sorteo(id: $id) { ${campos} }
  }
`;

export const sorteoParticipacionesQuery = gql`
  query sorteoParticipaciones($sorteoId: Int!, $sucursalId: Int, $codigo: String, $page: Int, $size: Int) {
    data: sorteoParticipaciones(sorteoId: $sorteoId, sucursalId: $sucursalId, codigo: $codigo, page: $page, size: $size) {
      getContent { id sucursalId sucursalNombre ventaId codigo cantidad clienteNombre documento anulada creadoEn }
      getTotalElements
    }
  }
`;

export const sorteoResumenQuery = gql`
  query sorteoResumen($sorteoId: Int!) {
    data: sorteoResumen(sorteoId: $sorteoId) { sucursalId sucursalNombre participaciones tickets }
  }
`;

export const saveSorteoMutation = gql`
  mutation saveSorteo($input: SorteoInput!) {
    data: saveSorteo(input: $input) { ${campos} }
  }
`;

export const cortarSorteoMutation = gql`
  mutation cortarSorteo($id: Int!) {
    data: cortarSorteo(id: $id) { ${campos} }
  }
`;

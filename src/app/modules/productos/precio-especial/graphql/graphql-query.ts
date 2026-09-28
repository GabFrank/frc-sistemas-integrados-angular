import gql from 'graphql-tag';

const campos = `
  id precio fechaDesde fechaHasta activo creadoEn usuarioNickname
  sucursal { id nombre }
  precioPorSucursal {
    id precio activo principal
    tipoPrecio { id descripcion }
    presentacion { id descripcion cantidad activo producto { id descripcion } }
  }
`;

export const preciosEspecialesPorPrecioQuery = gql`
  query preciosEspecialesPorPrecio($precioId: Int!) {
    data: preciosEspecialesPorPrecio(precioId: $precioId) { ${campos} }
  }
`;

export const filterPreciosEspecialesQuery = gql`
  query filterPreciosEspeciales($sucursalId: Int, $texto: String, $soloVigentes: Boolean, $page: Int, $size: Int) {
    data: filterPreciosEspeciales(sucursalId: $sucursalId, texto: $texto, soloVigentes: $soloVigentes, page: $page, size: $size) {
      getContent { ${campos} }
      getTotalElements
    }
  }
`;

export const savePreciosEspecialesMutation = gql`
  mutation savePreciosEspeciales($input: PrecioEspecialSucursalInput!) {
    data: savePreciosEspeciales(input: $input) { ${campos} }
  }
`;

export const editarPrecioEspecialMutation = gql`
  mutation editarPrecioEspecial($id: Int!, $precio: Float!, $fechaDesde: String, $fechaHasta: String) {
    data: editarPrecioEspecial(id: $id, precio: $precio, fechaDesde: $fechaDesde, fechaHasta: $fechaHasta) { ${campos} }
  }
`;

export const cortarPrecioEspecialMutation = gql`
  mutation cortarPrecioEspecial($id: Int!) {
    data: cortarPrecioEspecial(id: $id) { ${campos} }
  }
`;

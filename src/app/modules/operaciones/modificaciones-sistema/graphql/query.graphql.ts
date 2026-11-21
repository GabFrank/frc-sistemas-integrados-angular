import gql from 'graphql-tag';

export const historialCambiosQuery = gql`
  query (
    $fechaInicio: String
    $fechaFin: String
    $usuarioId: ID
    $productoId: ID
    $categoria: String
    $page: Int
    $size: Int
  ) {
    data: historialCambios(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      usuarioId: $usuarioId
      productoId: $productoId
      categoria: $categoria
      page: $page
      size: $size
    ) {
      getTotalElements
      getContent {
        id
        fecha
        usuarioId
        usuario
        categoria
        accion
        objeto
        observacion
        productoId
        sinDetalle
        resumen
        cambios {
          campo
          antes
          despues
        }
      }
    }
  }
`;

export const historialCambiosCategoriasQuery = gql`
  query {
    data: historialCambiosCategorias {
      codigo
      nombre
    }
  }
`;

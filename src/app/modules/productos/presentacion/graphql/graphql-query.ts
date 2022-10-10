import gql from "graphql-tag";

export const presentacionQuery = gql`
  query ($id: ID!) {
    data: presentacion(id: $id) {
      id 
      descripcion
      activo
      principal
      tipoPresentacion {
        id
        descripcion
      }
      cantidad
      imagenPrincipal
      codigos{
        id
        codigo
        principal
        activo
      }
      codigoPrincipal {
        codigo
      }
      precioPrincipal {
        precio
      }
      producto {
        id
        descripcion
        descripcionFactura
        balanza
        vencimiento
        costo {
          costoMedio
        }
        envase {
          id
          descripcion
        }
      }
    }
  }
`;

export const presentacionesQuery = gql`
  query {
    data: presentaciones {
      id
      descripcion
      activo
      principal
      tipoPresentacion {
        id
        descripcion
      }
      cantidad
      imagenPrincipal
    }
  }
`;

export const presentacionPorProductoId = gql`
  query ($id: Int) {
    data: presentacionesPorProductoId(id: $id) {
      id
      descripcion
      activo
      principal
      tipoPresentacion {
        id
        descripcion
      }
      cantidad
      imagenPrincipal
      codigos{
        id
        codigo
        principal
        activo
      }
      precios {
        id
        precio
        tipoPrecio {
          id
          descripcion
        }
        principal
        activo
      }
      codigoPrincipal {
        id
        codigo
      }
      precioPrincipal {
        id
        precio
      }
    }
  }
`;

export const savePresentacion = gql`
  mutation savePresentacion($entity: PresentacionInput!) {
    data: savePresentacion(presentacion: $entity) {
      id
      descripcion
      activo
      principal
      tipoPresentacion {
        id
        descripcion
      }
      cantidad
      imagenPrincipal
      codigos{
        id
        codigo
        principal
        activo
      }
    }
  }
`;

export const deletePresentacionQuery = gql`
  mutation deletePresentacion($id: ID!) {
    deletePresentacion(id: $id)
  }
`;

export const saveImagenPresentacionQuery = gql`
  mutation saveImagenPresentacion($image: String!, $filename: String!) {
    saveImagenPresentacion(image: $image, filename: $filename)
  }
`;

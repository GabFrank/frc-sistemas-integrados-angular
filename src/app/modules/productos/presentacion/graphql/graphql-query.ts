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
      producto {
        id
        costo {
          costoMedio
        }
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
    data: saveImagenPresentacion(image: $image, filename: $filename)
  }
`;

export const sugerenciasImagenPresentacionQuery = gql`
  query ($presentacionId: ID!, $codigo: String, $texto: String) {
    data: sugerenciasImagenPresentacion(presentacionId: $presentacionId, codigo: $codigo, texto: $texto) {
      codigo
      codigoDescartado
      texto
      porCodigo { url miniatura ancho alto titulo sitio fuente }
      porDescripcion { url miniatura ancho alto titulo sitio fuente }
      avisos
    }
  }
`;

export const descargarImagenSugeridaQuery = gql`
  query ($url: String!) {
    data: descargarImagenSugerida(url: $url)
  }
`;

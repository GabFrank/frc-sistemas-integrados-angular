import gql from 'graphql-tag';

export const preciosPorSucursalQuery = gql`
  query {
    data: preciosPorSucursal {
      id
      presentacion {
        id
      }
      sucursal {
        id
      }
      tipoPrecio {
        id
      }
      precio
    }
  }
`;

export const precioPorSucursalPorPresentacionId = gql`
  query ($id: Int) {
    data: precioPorSucursalPorPresentacionId(id: $id) {
      id
      tipoPrecio {
        id
        descripcion
      }
      precio
      principal
      activo
    }
  }
`;

export const savePrecioPorSucursal = gql`
  mutation savePrecioPorSucursal($entity: PrecioPorSucursalInput!) {
    data: savePrecioPorSucursal(precioPorSucursal: $entity) {
      id
      presentacion {
        id
      }
      sucursal {
        id
      }
      tipoPrecio {
        id
        descripcion
      }
      precio
      activo
      principal
    }
  }
`;

export const deletePrecioPorSucursalQuery = gql`
  mutation deletePrecioPorSucursal($id: ID!) {
    deletePrecioPorSucursal(id: $id)
  }
`;

export const savePromocionPorSucursalQuery = gql`
  mutation savePromocionPorSucursal($entity: PromocionPorSucursalInput!) {
    data: savePromocionPorSucursal(promocion: $entity) {
      id
      precio {
        id
        precio
        tipoPrecio {
          id
          descripcion
        }
      }
      sucursal {
        id
        nombre
      }
      activo
      esPromocion
      tipoPromocion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const saveBulkPromocionPorSucursalQuery = gql`
  mutation saveBulkPromocionPorSucursal($promociones: [PromocionPorSucursalInput!]!) {
    data: saveBulkPromocionPorSucursal(promociones: $promociones) {
      success
      count
    }
  }
`;

export const getPromocionesPorPresentacionQuery = gql`
  query getPromocionesPorPresentacion($id: ID!) {
    data: promocionesPorPresentacion(presentacionId: $id) {
      id
      precio {
        id
        precio
        tipoPrecio {
          id
          descripcion
        }
      }
      sucursal {
        id
        nombre
      }
      activo
      esPromocion
      tipoPromocion
      creadoEn
    }
  }
`;

export const verificarPromocionesQuery = gql`
    query verificarPromociones($presentacionId: ID!, $sucursalesIds: [ID!]!) {
      verificarPromociones(presentacionId: $presentacionId, sucursalesIds: $sucursalesIds) {
        todasLasSucursalesOk
        promocionesEncontradas {
          id
          sucursal { id nombre }
          activo
          esPromocion
          tipoPromocion
          precio { id precio }
        }
        faltantes
        extras
        sucursalesConPromocion
      }
    }
  `;

export const getPromocionesPorSucursalQuery = gql`
  query getPromocionesPorSucursal($sucursalId: ID!) {
    data: promocionesPorSucursal(sucursalId: $sucursalId) {
      id
      precio {
        id
        precio
        presentacion {
          id
          descripcion
          producto {
            id
            descripcion
          }
        }
        tipoPrecio {
          id
          descripcion
        }
      }
      activo
      esPromocion
      tipoPromocion
      creadoEn
    }
  }
`;

export const getPromocionesPorPrecioIdQuery = gql`
  query promocionesPorPrecioId($precioId: ID!){
    promocionesPorPrecioId(precioId: $precioId){
    id
    precio{
      id
      precio
    }
    sucursal{
      id
      nombre
    }
    activo
      esPromocion
      tipoPromocion
    }
  }
`;

export const deletePromocionPorSucursalQuery = gql`
  mutation deletePromocionPorSucursal($id: ID!) {
    data: deletePromocionPorSucursal(id: $id)
  }
`; 

export const deleteBulkPromocionPorSucursalQuery = gql`
  mutation deleteBulkPromocionPorSucursal($ids: [ID!]!){
    data: deleteBulkPromocionPorSucursal(ids: $ids)
  }
`;
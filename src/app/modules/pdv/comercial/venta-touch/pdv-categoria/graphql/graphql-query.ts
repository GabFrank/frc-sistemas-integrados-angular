import gql from "graphql-tag";

export const pdvCategoriasQuery = gql`
  query {
    data: pdvCategorias {
      id
      descripcion
      activo
      grupos {
        id
        descripcion
        activo
        pdvGruposProductos {
          id
          producto {
            id
            descripcion
            balanza
            garantia
            combo
            promocion
            imagenPrincipal
            presentaciones {
              id
              descripcion
              principal
              activo
              cantidad
              codigos {
                id
                codigo
                principal
                activo
              }
              precios {
                id
                precio
                principal
                activo
                tipoPrecio {
                  id
                  descripcion
                }
              }
              imagenPrincipal
              tipoPresentacion{
                id
                descripcion
              }
            }
          }
          activo
        }
      }
    }
  }
`;

export const pdvCategoriaSearch = gql`
  query ($texto: String) {
    data: pdvCategoriaSearch(texto: $texto) {
      id
      descripcion
      activo
      grupos {
        id
        descripcion
        activo
        pdvGruposProductos {
          id
          producto {
            id
            descripcion
            imagenPrincipal
            balanza
            garantia
            combo
            promocion
            codigos {
              id
              caja
              codigo
              cantidad
              principal
              tipoPrecio {
                id
                descripcion
                autorizacion
                activo
              }
              preciosPorSucursal {
                sucursal {
                  id
                }
                precio
              }
            }
          }
          activo
        }
      }
    }
  }
`;

export const pdvCategoriaQuery = gql`
  query ($id: ID!) {
    data: pdvCategoria(id: $id) {
      id
      descripcion
      activo
      grupos {
        id
        descripcion
        activo
        pdvGruposProductos {
          id
          producto {
            id
            descripcion
            balanza
            garantia
            combo
            promocion
            presentacion {
              id
              descripcion
              principal
              activo
              codigos {
                id
                codigos
                principal
                activo
              }
              precios {
                id
                precio
                principal
                activo
                tipoPrecio {
                  id
                  descripcion
                }
              }
              imagenPrincipal
            }
          }
          activo
        }
      }
    }
  }
`;

export const savePdvCategoria = gql`
  mutation savePdvCategoria($entity: PdvCategoriaInput!) {
    data: savePdvCategoria(pdvCategoria: $entity) {
      id
    }
  }
`;

export const deletePdvCategoriaQuery = gql`
  mutation deletePdvCategoria($id: ID!) {
    deletePdvCategoria(id: $id)
  }
`;

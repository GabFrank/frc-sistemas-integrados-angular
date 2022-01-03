import gql from "graphql-tag";

export const tipoGastosQuery = gql`
  {
    data: tipoGastos {
      id
      isClasificacion
      clasificacionGasto {
        id
        descripcion
      }
      descripcion
      autorizacion
      cargo {
        id
        nombre
      }
      activo
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      subtipoList {
        id
        descripcion
      }
    }
  }
`;

export const rootTipoGastoQuery = gql`
  {
    data: rootTipoGasto {
      id
      descripcion
      subtipoList {
        id
        descripcion
        clasificacionGasto {
          id
          descripcion
        }
        subtipoList {
          id
          descripcion
          clasificacionGasto {
            id
            descripcion
          }
          subtipoList {
            id
            descripcion
            clasificacionGasto {
              id
              descripcion
            }
            subtipoList {
              id
              descripcion
              clasificacionGasto {
                id
                descripcion
              }
              subtipoList {
                id
                descripcion
                clasificacionGasto {
                  id
                  descripcion
                }
                subtipoList {
                  id
                  descripcion
                  clasificacionGasto {
                    id
                    descripcion
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const tipoGastosSearch = gql`
  query ($texto: String) {
    data: tipoGastosSearch(texto: $texto) {
      id
      isClasificacion
      clasificacionGasto {
        id
        descripcion
      }
      descripcion
      autorizacion
      cargo {
        id
        nombre
      }
      activo
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      subtipoList {
        id
        descripcion
      }
    }
  }
`;


export const tipoGastoQuery = gql`
  query ($id: ID!) {
    data: tipoGasto(id: $id) {
      id
      isClasificacion
      clasificacionGasto {
        id
        descripcion
      }
      descripcion
      autorizacion
      cargo {
        id
        nombre
      }
      activo
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      subtipoList {
        id
        descripcion
      }
    }
  }
`;

export const saveTipoGasto = gql`
  mutation saveTipoGasto($entity: TipoGastoInput!) {
    data: saveTipoGasto(tipoGasto: $entity) {
      id
      isClasificacion
      clasificacionGasto {
        id
        descripcion
      }
      descripcion
      autorizacion
      cargo {
        id
        nombre
      }
      activo
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      subtipoList {
        id
        descripcion
      }
    }
  }
`;

export const deleteTipoGastoQuery = gql`
  mutation deleteTipoGasto($id: ID!) {
    deleteTipoGasto(id: $id)
  }
`;

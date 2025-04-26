import gql from "graphql-tag";

export const proveedoresQuery = gql`
  {
    data: proveedores {
      id
      persona {
        id
        nombre
      }
      vendedores {
        id
        persona {
          nombre
        }
      }
      credito
      tipoCredito
      productos {
        id
        descripcion
      }
    }
  }
`;

export const proveedoresSearchByPersona = gql`
  query ($texto: String) {
    data: proveedorSearchByPersona(texto: $texto) {
      id
      persona {
        id
        nombre
        documento
      }
      vendedores {
        id
        persona {
          id
          nombre
          documento
        }
      }
      credito
      chequeDias
      tipoCredito
      productos {
        id
        descripcion
      }
    }
  }
`;

export const proveedorPorPersona = gql`
  query ($personaId: ID!) {
    data: proveedorPorPersona(personaId: $personaId) {
      id
      creadoEn
      usuario {
        id
      }
      persona {
        id
        nombre
        documento
        telefono
      }
      vendedores {
        id
        persona {
          id
          nombre
          documento
        }
      }
      credito
      chequeDias
      tipoCredito
      productos {
        id
        descripcion
      }
    }
  }
`;

export const proveedoresSearchByProveedor = gql`
  query ($texto: String) {
    data: proveedorSearchByProveedor(texto: $texto) {
      id
      persona {
        id
        nombre
      }
      vendedores {
        id
        persona {
          nombre
        }
      }
      credito
      tipoCredito
      productos {
        id
        descripcion
      }
    }
  }
`;

export const proveedoresPorProveedor = gql`
  query ($id: Int) {
    data: proveedorPorVendedor(id: $id) {
      id
      persona {
        id
        nombre
      }
      vendedores {
        id
        persona {
          nombre
        }
      }
      credito
      tipoCredito
      productos {
        id
        descripcion
      }
    }
  }
`;

export const proveedorQuery = gql`
  query ($id: ID!) {
    data: proveedor(id: $id) {
      id
      persona {
        id
        nombre
        documento
      }
      vendedores {
        id
        persona {
          nombre
          documento
        }
      }
      credito
      tipoCredito
      productos {
        id
        descripcion
      }
    }
  }
`;

export const saveProveedor = gql`
  mutation saveProveedor($entity: ProveedorInput!) {
    data: saveProveedor(proveedor: $entity) {
      id
      credito
      chequeDias
      persona {
        id
        nombre
      }
    }
  }
`;

export const deleteProveedorQuery = gql`
  mutation deleteProveedor($id: ID!) {
    deleteProveedor(id: $id)
  }
`;

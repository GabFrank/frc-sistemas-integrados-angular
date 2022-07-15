import gql from "graphql-tag";

export const rolesQuery = gql`
query ($page: Int) {
    data: roles(page: $page) {
      id
      nombre
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const rolesSearch = gql`
  query ($texto: String) {
    data: rolesSearch(texto: $texto) {
      id
      nombre
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const roleQuery = gql`
  query ($id: ID!) {
    data: role(id: $id) {
      id
      nombre
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const saveRole = gql`
  mutation saveRole($entity: RoleInput!) {
    data: saveRole(role: $entity) {
      id
      nombre
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteRoleQuery = gql`
  mutation deleteRole($id: ID!) {
    deleteRole(id: $id)
  }
`;


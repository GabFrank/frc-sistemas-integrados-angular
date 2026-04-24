import gql from 'graphql-tag';

export const REPLICATION_SUBSCRIPTIONS_QUERY = gql`
  query ReplicationSubscriptions($page: Int = 0, $size: Int = 10) {
    data:replicationSubscriptions(page: $page, size: $size) {
      getContent {
        name
        enabled
        sucursal {
          id
          nombre
          localizacion
        }
        tables
      }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
    }
  }
`;

export const REPLICATION_PUBLICATIONS_QUERY = gql`
  query ReplicationPublications($page: Int = 0, $size: Int = 10) {
    data:replicationPublications(page: $page, size: $size) {
      getContent {
        name
        enabled
        sucursal {
          id
          nombre
          localizacion
        }
        tables
      }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
    }
  }
`;

export const SEARCH_REPLICATION_SUBSCRIPTIONS_QUERY = gql`
  query SearchReplicationSubscriptions($query: String, $page: Int = 0, $size: Int = 10) {
    data:searchReplicationSubscriptions(query: $query, page: $page, size: $size) {
      getContent {
        name
        enabled
        sucursal {
          id
          nombre
          localizacion
        }
        tables
      }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
    }
  }
`;

export const REMOTE_REPLICATION_SUBSCRIPTIONS_QUERY = gql`
  query RemoteReplicationSubscriptions($sucursalId: ID!, $page: Int = 0, $size: Int = 10) {
    data:remoteReplicationSubscriptions(sucursalId: $sucursalId, page: $page, size: $size) {
      getContent {
        name
        enabled
        sucursal {
          id
          nombre
          localizacion
        }
        tables
      }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
    }
  }
`;

export const REMOTE_REPLICATION_PUBLICATIONS_QUERY = gql`
  query RemoteReplicationPublications($sucursalId: ID!, $page: Int = 0, $size: Int = 10) {
    data:remoteReplicationPublications(sucursalId: $sucursalId, page: $page, size: $size) {
      getContent {
        name
        enabled
        sucursal {
          id
          nombre
          localizacion
        }
        tables
      }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
    }
  }
`;

export const SEARCH_REMOTE_REPLICATION_SUBSCRIPTIONS_QUERY = gql`
  query SearchRemoteReplicationSubscriptions($sucursalId: ID!, $query: String, $page: Int = 0, $size: Int = 10) {
    data:searchRemoteReplicationSubscriptions(sucursalId: $sucursalId, query: $query, page: $page, size: $size) {
      getContent {
        name
        enabled
        sucursal {
          id
          nombre
          localizacion
        }
        tables
      }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
    }
  }
`;

export const GET_REPLICATION_SETUP_STATE_QUERY = gql`
  query GetReplicationSetupState($sucursalId: ID!) {
    data:getReplicationSetupState(sucursalId: $sucursalId) {
      centralPublicationExists
      centralSubscriptionExists
      filialReachable
      filialPublicationExists
      filialSubscriptionBidiExists
      filialSubscriptionCentralExists
    }
  }
`;

export const GENERATE_CONNECTION_STRING_QUERY = gql`
  query GenerateConnectionString($host: String!, $port: Int!, $dbName: String!, $username: String!, $password: String!) {
    data:generateConnectionString(host: $host, port: $port, dbName: $dbName, username: $username, password: $password)
  }
`;

export const GENERATE_CENTRAL_CONNECTION_STRING_QUERY = gql`
  query GenerateCentralConnectionString {
    data:generateCentralConnectionString
  }
`;

export const GENERATE_BRANCH_PUBLICATION_NAME_QUERY = gql`
  query GenerateBranchPublicationName($sucursalId: ID!) {
    data:generateBranchPublicationName(sucursalId: $sucursalId)
  }
`;

export const GENERATE_BRANCH_SUBSCRIPTION_NAME_QUERY = gql`
  query GenerateBranchSubscriptionName($sucursalId: ID!) {
    data:generateBranchSubscriptionName(sucursalId: $sucursalId)
  }
`;

export const GENERATE_CENTRAL_TO_BRANCH_PUBLICATION_NAME_QUERY = gql`
  query GenerateCentralToBranchPublicationName($sucursalId: ID!) {
    data:generateCentralToBranchPublicationName(sucursalId: $sucursalId)
  }
`;

export const GENERATE_CENTRAL_TO_BRANCH_SUBSCRIPTION_NAME_QUERY = gql`
  query GenerateCentralToBranchSubscriptionName($sucursalId: ID!) {
    data:generateCentralToBranchSubscriptionName(sucursalId: $sucursalId)
  }
`;

export const SETUP_REPLICATION_MUTATION = gql`
  mutation SetupReplication($input: LogicalReplicationInput!) {
    data:setupReplication(input: $input) {
      success
      message
    }
  }
`;

export const SETUP_REPLICATION_ADVANCED_MUTATION = gql`
  mutation SetupReplicationAdvanced($sucursalId: ID!, $target: RemoveTarget!, $scope: RemoveScope!) {
    data:setupReplicationAdvanced(sucursalId: $sucursalId, target: $target, scope: $scope) {
      success
      message
    }
  }
`;

export const SETUP_BRANCH_REPLICATION_MUTATION = gql`
  mutation SetupBranchReplication($sucursalId: ID!) {
    data:setupBranchReplication(sucursalId: $sucursalId) {
      success
      message
    }
  }
`;

export const REMOVE_REPLICATION_MUTATION = gql`
  mutation RemoveReplication($sucursalId: ID!) {
    data:removeReplication(sucursalId: $sucursalId) {
      success
      message
    }
  }
`;

export const REMOVE_BRANCH_REPLICATION_MUTATION = gql`
  mutation RemoveBranchReplication($sucursalId: ID!) {
    data:removeBranchReplication(sucursalId: $sucursalId) {
      success
      message
    }
  }
`;

export const REMOVE_REPLICATION_ADVANCED_MUTATION = gql`
  mutation RemoveReplicationAdvanced($sucursalId: ID!, $target: RemoveTarget!, $scope: RemoveScope!) {
    data:removeReplicationAdvanced(sucursalId: $sucursalId, target: $target, scope: $scope) {
      success
      message
    }
  }
`;

export const TOGGLE_REPLICATION_MUTATION = gql`
  mutation ToggleReplication($sucursalId: ID!, $enabled: Boolean!, $isSubscription: Boolean!) {
    data:toggleReplication(sucursalId: $sucursalId, enabled: $enabled, isSubscription: $isSubscription) {
      success
      message
    }
  }
`;

export const TOGGLE_REMOTE_SUBSCRIPTION_MUTATION = gql`
  mutation ToggleRemoteSubscription($branchSucursalId: ID!, $subscriptionName: String!, $enabled: Boolean!) {
    data:toggleRemoteSubscription(branchSucursalId: $branchSucursalId, subscriptionName: $subscriptionName, enabled: $enabled) {
      success
      message
    }
  }
`;

export const DROP_REMOTE_PUBLICATION_MUTATION = gql`
  mutation DropRemotePublication($branchSucursalId: ID!, $publicationName: String!) {
    data:dropRemotePublication(branchSucursalId: $branchSucursalId, publicationName: $publicationName) {
      success
      message
    }
  }
`;

export const CREATE_REMOTE_PUBLICATION_MUTATION = gql`
  mutation CreateRemotePublication($branchSucursalId: ID!, $publicationName: String!, $tables: [String]!) {
    data:createRemotePublication(branchSucursalId: $branchSucursalId, publicationName: $publicationName, tables: $tables) {
      success
      message
    }
  }
`;

export const CREATE_REMOTE_SUBSCRIPTION_MUTATION = gql`
  mutation CreateRemoteSubscription($branchSucursalId: ID!, $subscriptionName: String!, $connectionString: String!, $publicationName: String!) {
    data:createRemoteSubscription(
      branchSucursalId: $branchSucursalId, 
      subscriptionName: $subscriptionName, 
      connectionString: $connectionString, 
      publicationName: $publicationName
    ) {
      success
      message
    }
  }
`;

export const EDIT_REMOTE_PUBLICATION_MUTATION = gql`
  mutation EditRemotePublication($branchSucursalId: ID!, $publicationName: String!, $tables: [String]!) {
    data:editRemotePublication(branchSucursalId: $branchSucursalId, publicationName: $publicationName, tables: $tables) {
      success
      message
    }
  }
`;

export const EDIT_REMOTE_SUBSCRIPTION_MUTATION = gql`
  mutation EditRemoteSubscription($branchSucursalId: ID!, $subscriptionName: String!, $connectionString: String, $publicationName: String) {
    data:editRemoteSubscription(
      branchSucursalId: $branchSucursalId, 
      subscriptionName: $subscriptionName, 
      connectionString: $connectionString, 
      publicationName: $publicationName
    ) {
      success
      message
    }
  }
`;

export const REPLICATION_TABLES_QUERY = gql`
  query ReplicationTables {
    data:replicationTables {
      id
      tableName
      direction
      enabled
      description
      creadoEn
      branchIds
      replicateCentralToBranchWithFilter
      usuario {
        id
        nickname
      }
    }
  }
`;

export const REPLICATION_TABLE_QUERY = gql`
  query ReplicationTable($id: ID!) {
    data:replicationTable(id: $id) {
      id
      tableName
      direction
      enabled
      description
      creadoEn
      branchIds
      replicateCentralToBranchWithFilter
      usuario {
        id
        nickname
      }
    }
  }
`;

export const REPLICATION_TABLES_WITH_PAGINATION_QUERY = gql`
  query ReplicationTablesWithPagination($page: Int = 0, $size: Int = 10, $search: String) {
    data:replicationTablesWithPagination(page: $page, size: $size, search: $search) {
      getContent {
        id
        tableName
        direction
        enabled
        description
        creadoEn
        branchIds
        replicateCentralToBranchWithFilter
        usuario {
          id
          nickname
        }
      }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
    }
  }
`;

export const REPLICATION_TABLES_BY_DIRECTION_QUERY = gql`
  query ReplicationTablesByDirection($direction: ReplicationDirection!) {
    data:replicationTablesByDirection(direction: $direction) {
      id
      tableName
      direction
      enabled
      description
      creadoEn
      branchIds
      replicateCentralToBranchWithFilter
      usuario {
        id
        nickname
      }
    }
  }
`;

export const ENABLED_REPLICATION_TABLES_QUERY = gql`
  query EnabledReplicationTables {
    data:enabledReplicationTables {
      id
      tableName
      direction
      enabled
      description
      creadoEn
      branchIds
      replicateCentralToBranchWithFilter
      usuario {
        id
        nickname
      }
    }
  }
`;

export const MAIN_TO_ALL_TABLE_NAMES_QUERY = gql`
  query MainToAllTableNames {
    data:mainToAllTableNames
  }
`;

export const MAIN_TO_SPECIFIC_TABLE_NAMES_QUERY = gql`
  query MainToSpecificTableNames {
    data:mainToSpecificTableNames
  }
`;

export const BRANCH_TO_MAIN_TABLE_NAMES_QUERY = gql`
  query BranchToMainTableNames {
    data:branchToMainTableNames
  }
`;

export const SAVE_REPLICATION_TABLE_MUTATION = gql`
  mutation SaveReplicationTable($input: ReplicationTableInput!) {
    data:saveReplicationTable(input: $input) {
      id
      tableName
      direction
      enabled
      description
      creadoEn
      branchIds
      replicateCentralToBranchWithFilter
      usuario {
        id
        nickname
      }
    }
  }
`;

export const DELETE_REPLICATION_TABLE_MUTATION = gql`
  mutation DeleteReplicationTable($id: ID!) {
    data:deleteReplicationTable(id: $id)
  }
`;

export const TOGGLE_REPLICATION_TABLE_ENABLED_MUTATION = gql`
  mutation ToggleReplicationTableEnabled($id: ID!) {
    data:toggleReplicationTableEnabled(id: $id)
  }
`;

export const UPDATE_REPLICATION_SERVICE_TABLES_MUTATION = gql`
  mutation UpdateReplicationServiceTables {
    data:updateReplicationServiceTables
  }
`;

export const REFRESH_SUBSCRIPTION_MUTATION = gql`
  mutation RefreshSubscription($subscriptionName: String!) {
    data:refreshSubscription(subscriptionName: $subscriptionName) {
      success
      message
    }
  }
`;

export const REFRESH_ALL_SUBSCRIPTIONS_MUTATION = gql`
  mutation RefreshAllSubscriptions {
    data:refreshAllSubscriptions {
      success
      message
    }
  }
`;

export const REFRESH_REMOTE_SUBSCRIPTION_MUTATION = gql`
  mutation RefreshRemoteSubscription($branchSucursalId: ID!, $subscriptionName: String!) {
    data:refreshRemoteSubscription(branchSucursalId: $branchSucursalId, subscriptionName: $subscriptionName) {
      success
      message
    }
  }
`;

export const REFRESH_ALL_REMOTE_SUBSCRIPTIONS_MUTATION = gql`
  mutation RefreshAllRemoteSubscriptions($branchSucursalId: ID!) {
    data:refreshAllRemoteSubscriptions(branchSucursalId: $branchSucursalId) {
      success
      message
    }
  }
`;

export const SYNC_PUBLICATIONS_WITH_REPLICATION_TABLE_MUTATION = gql`
  mutation SyncPublicationsWithReplicationTable {
    data:syncPublicationsWithReplicationTable {
      success
      message
    }
  }
`; 
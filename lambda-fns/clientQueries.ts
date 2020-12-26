const gql = require("graphql-tag");

export const clientListActionsFuture = gql`
  query clientListActionsFuture {
    clientListActionsFuture {
      id
      userId
      dateCreatedAt
      item {
        id
        modelNumber
        serialNumber
        inventoryNumber
      }
      endUser {
        id
        name
        email
        emailVerified
        isClientSendEmail
      }
      location {
        id
        name
        city
        street
      }
      dateActionStart
      dateActionEnd
      actionType {
        id
        name
      }
    }
  }
`
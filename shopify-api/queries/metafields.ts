export const metafieldDefinitionsQuery = /* GraphQL */ `
  query metafieldDefinitions($ownerType: MetafieldOwnerType!) {
    metafieldDefinitions(first: 150, ownerType: $ownerType) {
      nodes {
        ownerType
        id
        namespace
        name
        validations {
          name
          type
          value
        }
        key
        type {
          name
          category
        }
      }
    }
  }
`;

export const metaObjectDefinitionsQuery = /* GraphQL */ `
  query metaObjectDefinitions {
    metaobjectDefinitions(first: 100) {
      nodes {
        id
        type
        name
        displayNameKey
        access {
          admin
        }

        fieldDefinitions {
          name
          key
          required
          validations {
            name
            type
            value
          }
          key
          type {
            name
            category
          }
        }
      }
    }
  }
`;

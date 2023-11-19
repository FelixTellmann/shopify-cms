/* eslint-disable */
import * as Types from './types';

export type MetafieldDefinitionsQueryVariables = Types.Exact<{
  ownerType: Types.MetafieldOwnerType;
}>;


export type MetafieldDefinitionsQuery = { metafieldDefinitions: { nodes: Array<{ ownerType: Types.MetafieldOwnerType, id: string, namespace: string, name: string, key: string, validations: Array<{ name: string, type: string, value?: string | null }>, type: { name: string, category: string } }> } };

export type MetaObjectDefinitionsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type MetaObjectDefinitionsQuery = { metaobjectDefinitions: { nodes: Array<{ id: string, type: string, name: string, displayNameKey?: string | null, access: { admin: Types.MetaobjectAdminAccess }, fieldDefinitions: Array<{ name: string, key: string, required: boolean, validations: Array<{ name: string, type: string, value?: string | null }>, type: { name: string, category: string } }> }> } };

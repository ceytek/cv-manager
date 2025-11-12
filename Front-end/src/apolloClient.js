import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP bağlantısı
const httpLink = createHttpLink({
  uri: 'http://localhost:8000/graphql',
});

// Auth middleware - her istekte token ekle
const authLink = setContext((_, { headers }) => {
  // LocalStorage'dan token'ı al
  const token = localStorage.getItem('accessToken');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// WebSocket bağlantısı (subscriptions)
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:8000/graphql',
  connectionParams: async () => {
    const token = localStorage.getItem('accessToken');
    return {
      authorization: token ? `Bearer ${token}` : '',
    };
  },
}));

// HTTP vs WS split
const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  authLink.concat(httpLink)
);

// Apollo Client oluştur
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default client;

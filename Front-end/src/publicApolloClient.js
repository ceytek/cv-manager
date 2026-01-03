import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { GRAPHQL_URL } from './config/api';

// Simple HTTP link for public pages (no auth, no websocket)
const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

// Public Apollo Client - simpler, no authentication required
const publicClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default publicClient;



import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Simple HTTP link for public pages (no auth, no websocket)
const httpLink = createHttpLink({
  uri: 'http://localhost:8000/graphql',
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



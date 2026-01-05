import { ApolloClient, InMemoryCache, createHttpLink, split, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8000/graphql';
const API_URL = GRAPHQL_URL.replace('/graphql', '');

// HTTP bağlantısı
const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
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

// Token refresh function
const refreshToken = async () => {
  const refresh = localStorage.getItem('refreshToken');
  if (!refresh) return null;
  
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('accessToken', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
        return data.access_token;
      }
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
  }
  return null;
};

// Error handling - 401 hatalarında token yenileme
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Check for authentication errors
      if (err.message?.includes('401') || 
          err.message?.includes('token') || 
          err.message?.includes('Geçersiz') ||
          err.extensions?.code === 'UNAUTHENTICATED') {
        
        // Try to refresh token
        return new Promise((resolve) => {
          refreshToken().then((newToken) => {
            if (newToken) {
              // Retry the request with new token
              const oldHeaders = operation.getContext().headers;
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: `Bearer ${newToken}`,
                },
              });
              resolve(forward(operation));
            } else {
              // Refresh failed, redirect to login
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
              resolve(null);
            }
          });
        });
      }
    }
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// WebSocket bağlantısı (subscriptions)
const wsLink = new GraphQLWsLink(createClient({
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/graphql',
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
  from([errorLink, authLink, httpLink])
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

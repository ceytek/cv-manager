// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_GRAPHQL_URL?.replace('/graphql', '') || 'http://localhost:8000';
export const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || `${API_BASE_URL}/graphql`;
export const WS_URL = import.meta.env.VITE_WS_URL || GRAPHQL_URL.replace('http', 'ws');










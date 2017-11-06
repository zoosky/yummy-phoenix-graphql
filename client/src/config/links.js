import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { onError } from 'apollo-link-error';

import ROOT_URL from 'config/rootUrl';
import store from 'config/store';
import { error } from 'actions/flashActions';
import formatErrors from 'utils/errorsUtils';

export const httpLink = new HttpLink({
  uri: `${ROOT_URL}/graphql`,
  credentials: process.env.NODE_ENV === 'development' ? 'include' : 'same-origin'
});

export const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('yummy:token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : null
    }
  };
});

export const errorLink = onError(({ graphQLErrors, networkError }) => {
  store.dispatch(error("Oups, nous sommes désolés, mais quelque chose s'est mal passé"));
});

export const formatErrorsLink = new ApolloLink((operation, forward) => {
  return forward(operation).map(response => {
    const operationName = Object.keys(response.data);
    const payload = response.data[operationName] || null;
    if (payload && payload.messages && payload.messages.length > 0) {
      response.data[operationName].errors = formatErrors(payload.messages);
      const errors = response.data[operationName].errors;
      if (errors.base) {
        store.dispatch(error(errors.base));
      } else {
        store.dispatch(error('Des erreurs ont eu lieu, veuillez vérifier :'));
      }
    }
    return response;
  });
});

// export const processBatchResponseLink = new ApolloLink((operation, forward) => {
//   return forward(operation).map(response => {
//     response.data = response.payload.data;
//     return response;
//   });
// });
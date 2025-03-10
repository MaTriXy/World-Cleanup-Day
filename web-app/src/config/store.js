import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { autoRehydrate } from 'redux-persist';
import thunk from 'redux-thunk';

import {
  trashpileReducer,
  eventsReducer,
  appReducer,
  userReducer,
  adminReducer,
  areaReducer,
  errorReducer,
  teamsReducer,
} from '../reducers';

const rootReducer = combineReducers({
  trashpile: trashpileReducer,
  events: eventsReducer,
  app: appReducer,
  user: userReducer,
  admin: adminReducer,
  areas: areaReducer,
  error: errorReducer,
  teams: teamsReducer,
});

const resetStateOnSignOutReducer = reducer => (state, action) => {
  const userWasSignedOut = action.meta && action.meta.logout;
  if (!userWasSignedOut) {
    return reducer(state, action);
  }
  // Note how we can purge sensitive data without hard reload easily.
  const stateWithoutSensitiveData = {
    app: undefined,
    user: undefined,
    trashpile: undefined,
    events: undefined,
    admin: undefined,
    area: undefined,
    error: undefined,
  };
  return reducer(stateWithoutSensitiveData, action);
};

let composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(
      {
          // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
      },
      )
    : compose;

if (process.env.NODE_ENV === 'production') {
  composeEnhancers = compose;
}

const enhancers = composeEnhancers(applyMiddleware(
  thunk,
), autoRehydrate());

export default createStore(resetStateOnSignOutReducer(rootReducer), enhancers);

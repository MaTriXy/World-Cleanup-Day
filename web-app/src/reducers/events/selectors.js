import { createSelector } from 'reselect';
import get from 'lodash.get';

const stateSel = state => state.events;
const markersSel = createSelector(stateSel, state => state.markers);
const eventsSel = createSelector(stateSel, state => state.events);
const detailsSel = createSelector(stateSel, state => state.details);

export const getEventsList = createSelector(
  eventsSel,
  state => state.events,
);

const getShowEventWindow = createSelector(
  eventsSel,
  state => state.showEventWindow,
);

export const getAllEventMarkers = createSelector(markersSel, state => state.markers);

export const getEventDetails = createSelector(
  detailsSel,
  state => state.event,
);

export const getCurrentMarkerID = createSelector(
  detailsSel,
  state => get(state, 'event.id', 'Unknown ID'),
);

const getCurrentMarkerLocation = createSelector(
 detailsSel,
 state => get(state, 'event.location', null),
);

export const getEventTitle = createSelector(
  detailsSel,
  state => get(state, 'event.name', 'Unknown title'),
);

export default {
  getEventsList,
  getAllEventMarkers,
  getShowEventWindow,
  getEventTitle,
  getCurrentMarkerID,
  getCurrentMarkerLocation,
  getEventDetails,
};

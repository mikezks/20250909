import { patchState, signalStore, type, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { entityConfig, setAllEntities, withEntities } from '@ngrx/signals/entities';
XMLDocument
import { tapResponse } from '@ngrx/operators';
import { Flight, initialFlight } from '../model/flight';
import { computed, inject } from '@angular/core';
import { FlightFilter } from '../model/flight-filter';
import { debounceTime, pipe, switchMap } from 'rxjs';
import { FlightService } from '../data-access/flight.service';

const flightConfig = entityConfig({
  entity: type<Flight>(),
  collection: 'flight',
  // selectId: flight => flight.id
});

interface BookingState {
  filter: FlightFilter;
  basket: Record<number, boolean>;
}

const initialBookingState: BookingState = {
  filter: {
    from: 'Hamburg',
    to: 'Graz',
    urgent: false
  },
  basket: {
    3: true,
    5: true
  }
};

export const BookStore = signalStore(
  { providedIn: 'root' },
  withState(initialBookingState),
  withEntities(flightConfig),
  withProps(store => ({
    flightService: inject(FlightService)
  })),
  withComputed(store => ({
    delayedFlights: computed(
      () => store.flightEntities().filter(flight => flight.delayed)
    )
  })),
  withMethods(store => ({
    setFilter: (filter: FlightFilter) => patchState(store, { filter }),
    setFlights: (flights: Flight[]) => patchState(
      store, setAllEntities(flights, flightConfig),
    )
  })),
  withMethods(store => ({
    loadFlights: rxMethod<FlightFilter>(pipe(
      debounceTime(300),
      switchMap(filter => store.flightService.find(
        filter.from, filter.to, filter.urgent
      )),
      tapResponse({
        next: flights => store.setFlights(flights),
        error: err => console.error(err)
      })
    )),
  }))
);

const flightEntityState = {
  entityMap: {
    3: initialFlight,
    5: initialFlight
  } as Record<number, Flight>,
  ids: [
    5, 3
  ]
}

const flightEntities = flightEntityState.ids.map(
  id => flightEntityState.entityMap[id]
)
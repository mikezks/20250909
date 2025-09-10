import { CommonModule } from '@angular/common';
import { afterRenderEffect, Component, computed, effect, inject, Injector, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Flight, FlightFilter, injectTicketsFacade } from '../../logic-flight';
import { FlightCardComponent, FlightFilterComponent } from '../../ui-flight';
import { ReactiveNode, SIGNAL } from '@angular/core/primitives/signals';


@Component({
  selector: 'app-flight-search',
  imports: [
    CommonModule,
    FormsModule,
    FlightCardComponent,
    FlightFilterComponent
  ],
  templateUrl: './flight-search.component.html',
})
export class FlightSearchComponent {
  private ticketsFacade = injectTicketsFacade();

  protected filter = signal({
    from: 'Paris',
    to: 'New York',
    urgent: false
  });
  protected route = computed(
    () => 'From ' + this.filter().from + ' to ' + this.filter().to + '.' 
  );
  protected basket: Record<number, boolean> = {
    3: true,
    5: true
  };
  protected flights$ = this.ticketsFacade.flights$;

  constructor() {
    let activeConsumer: ReactiveNode | null;

    activeConsumer = effect(() => console.log(this.route()));
    effect(() => {
      this.filter();
      untracked(() => this.search());
    });

    // console.log(this.route[SIGNAL]);

    injectSignalsLogger();
  }

  protected search(): void {
    if (!this.filter().from || !this.filter().to) {
      return;
    }

    this.ticketsFacade.search(this.filter());
  }

  protected delay(flight: Flight): void {
    const oldFlight = flight;
    const oldDate = new Date(oldFlight.date);

    const newDate = new Date(oldDate.getTime() + 1000 * 60 * 5); // Add 5 min
    const newFlight = {
      ...oldFlight,
      date: newDate.toISOString(),
      delayed: true
    };

    this.ticketsFacade.update(newFlight);
  }

  protected reset(): void {
    this.ticketsFacade.reset();
  }
}



export function injectSignalsLogger(): void {
  const injector = inject(Injector);
  const getSignalGraph = () => (window as any).ng.ɵgetSignalGraph(injector);
  const transformToDebugNames = (
    graph: {
      edges: { consumer: number; producer: number; }[],
      nodes: { label: string; kind: string; value: unknown; }[],
    }
  ) => graph.edges.map((edge: { consumer: number, producer: number }) => ({
    consumer: graph.nodes[edge.consumer].label,
    producer: graph.nodes[edge.producer].label
  }));

  afterRenderEffect(() => untracked(() => {
    const graph = getSignalGraph();
    console.table(graph.nodes);
    console.table(transformToDebugNames(graph));
  }));
}

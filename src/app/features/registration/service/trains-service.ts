import { HttpClient, HttpParams } from '@angular/common/http';
import { StationsResponse } from '../models/stations-response.model';
import { Observable } from 'rxjs';
import { Injectable, Query } from '@angular/core';
import { TrainsResponse } from '../models/trains-response.model';

@Injectable({
  providedIn: 'root',
})
export class TrainService {
  private stationsUrl = 'https://trainsapi.stepacademy.ge/api/stations';
  private trainsUrl = 'https://trainsapi.stepacademy.ge/api/trains';
  private searchTrainsUrl = 'https://trainsapi.stepacademy.ge/api/trains/search';
  private filterTrainsUrl = 'https://trainsapi.stepacademy.ge/api/trains/filter';

  constructor(private http: HttpClient) {}

  getStations(): Observable<StationsResponse> {
    return this.http.get<StationsResponse>(this.stationsUrl);
  }

  getTrains(): Observable<TrainsResponse> {
    const params = new HttpParams().set('Take', '5').set('Page', '1');

    return this.http.get<TrainsResponse>(this.trainsUrl, {
      params,
    });
  }
  searchTrains(query: string): Observable<TrainsResponse> {
    const params = new HttpParams().set('query', query);

    return this.http.get<TrainsResponse>(this.searchTrainsUrl, {
      params,
    });
  }

  filterTrains(origin: string, destination: string): Observable<TrainsResponse> {
    let params = new HttpParams();
    if (origin.length > 0) {
      params = params.set('origin', origin);
    }
    if (destination.length > 0) {
      params = params.set('destination', destination);
    }
    return this.http.get<TrainsResponse>(this.filterTrainsUrl, {
      params,
    });
  }
}

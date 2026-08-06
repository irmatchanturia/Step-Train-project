import { HttpClient, HttpParams } from '@angular/common/http';
import { StationsResponse } from '../models/stations-response.model';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { TrainsResponse } from '../models/trains-response.model';
import { CoachesResponse, TrainDetailsResponse } from '../../trains/models/train-details-models';

@Injectable({
  providedIn: 'root',
})
export class TrainService {
  private stationsUrl = 'https://trainsapi.stepacademy.ge/api/stations';
  private trainsUrl = 'https://trainsapi.stepacademy.ge/api/trains';
  private searchTrainsUrl = 'https://trainsapi.stepacademy.ge/api/trains/search';
  private filterTrainsUrl = 'https://trainsapi.stepacademy.ge/api/trains/filter';
  private readonly coachesUrl = 'https://trainsapi.stepacademy.ge/api/coaches';

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

  getTrainById(trainId: number): Observable<TrainDetailsResponse> {
    return this.http.get<TrainDetailsResponse>(`${this.trainsUrl}/${trainId}`);
  }
  getCoachesByTrainId(trainId: number, take = 10, page = 1): Observable<CoachesResponse> {
    const params = new HttpParams().set('Take', take.toString()).set('Page', page.toString());

    return this.http.get<CoachesResponse>(`${this.coachesUrl}/train/${trainId}`, { params });
  }
}

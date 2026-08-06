import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainDetails } from './train-details';

describe('TrainDetails', () => {
  let component: TrainDetails;
  let fixture: ComponentFixture<TrainDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

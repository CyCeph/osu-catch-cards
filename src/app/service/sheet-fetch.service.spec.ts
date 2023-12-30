import { TestBed } from '@angular/core/testing';

import { SheetFetchService } from './sheet-fetch.service';

describe('SheetFetchService', () => {
  let service: SheetFetchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SheetFetchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

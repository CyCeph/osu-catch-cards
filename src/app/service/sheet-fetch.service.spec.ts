import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SheetFetchService } from './sheet-fetch.service';

describe('SheetFetchService', () => {
  let service: SheetFetchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SheetFetchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

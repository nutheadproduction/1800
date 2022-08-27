import { TestBed } from '@angular/core/testing';

import { ModManagerService } from './mod-manager.service';

describe('ModManagerService', () => {
  let service: ModManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

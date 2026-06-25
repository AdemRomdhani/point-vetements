import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, combineLatest, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SplashService {
  private visibleSubject = new BehaviorSubject<boolean>(true);
  private dataReadySubject = new BehaviorSubject<boolean>(false);

  visible$: Observable<boolean> = combineLatest([
    timer(2200),
    this.dataReadySubject
  ]).pipe(
    map(([_, ready]) => {
      if (ready) return false;
      return this.visibleSubject.value;
    })
  );

  hide() {
    this.dataReadySubject.next(true);
    setTimeout(() => this.visibleSubject.next(false), 600);
  }

  get isReady(): boolean {
    return this.dataReadySubject.value;
  }
}

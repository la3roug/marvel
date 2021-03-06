import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input, Inject } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { PageEvent } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { map } from 'rxjs/operators/map';
import { tap } from 'rxjs/operators/tap';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { of } from 'rxjs/observable/of';

import { HeroPreview, CharacterDataWrapper, CharacterDataContainer } from '../../../models/';
import { ENTRIES_PER_PAGE } from '../services/heroes-list.resolver/heroes-list.resolver';
import { HeroesService } from 'app/services/heroes.service/heroes.service';
import { takeUntil } from 'rxjs/operators/takeUntil';

interface ListingResult { total: number, list: HeroPreview[] };

@Component({
  selector: 'app-heroes-list',
  templateUrl: './heroes-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroesListComponent implements OnInit, OnDestroy {
  heroes: Observable<HeroPreview[]>;
  totalItems: Observable<number>;
  favorites: Observable<{ [ id: number ]: boolean }[]>;
  currentPage: Observable<number>;
  loadingHero: Observable<number | null>;
  loadingHeroList = new Subject<boolean>();
  destroy$ = new Subject();

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected heroesService: HeroesService,
    @Inject(ENTRIES_PER_PAGE) public limit: number
  ) {
    this.loadingHero = this.heroesService.loadingHero.asObservable();
  }

  ngOnInit() {
    const result = this.route.data.pipe(
      takeUntil(this.destroy$),
      tap(() => this.loadingHeroList.next(false)),
      map((response: { heroes: CharacterDataWrapper}) => response.heroes.data),
      map((d: CharacterDataContainer) => ({
        total: d.total,
        list: d.results.map(h => ({
          id: h.id,
          name: h.name,
          thumbnail: `${h.thumbnail.path}.${h.thumbnail.extension}`
        }))
      }))
    );

    this.heroes = result.pipe(map((r: ListingResult) => r.list));
    this.totalItems = result.pipe(map((r: ListingResult) => r.total));
    this.currentPage = this.route.params.pipe(map(({ page }) => parseInt(page || '1', 10) - 1));

    this.favorites = combineLatest(this.heroes, this.heroesService.getFavoritesUpdates()).pipe(
      takeUntil(this.destroy$),
      map(([ heroes, favorites ]) => heroes.reduce((a, c) => {
        a[c.id] = favorites.indexOf(c.id) >= 0;
        return a;
      }, {} as any))
    );
  }

  ngOnDestroy() {
    this.destroy$.complete();
  }

  goToHeroDetails(heroId: number) {
    this.router.navigate([ { outlets: { dialog: [ 'hero', heroId ] } } ]);
  }

  changePage(event: PageEvent) {
    this.loadingHeroList.next(true)
    this.router.navigate(['heroes', event.pageIndex + 1 ]);
  }
}

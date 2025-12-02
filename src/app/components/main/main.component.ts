import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import * as sc from 'modern-screenshot';
import { SheetFetchService, User, CountryResponse } from 'src/app/service/sheet-fetch.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.sass'],
})
export class MainComponent {
  // Modern dependency injection
  private readonly fetch = inject(SheetFetchService);

  @ViewChild('usersearch', { read: ElementRef, static: true })
  userSearch!: ElementRef<HTMLInputElement>;

  @ViewChild('screen') screen!: ElementRef<HTMLElement>;
  @ViewChild('downloadLink') downloadLink!: ElementRef<HTMLAnchorElement>;

  public get Users(): User[] {
    return this.fetch.Users;
  }

  public activeUser: User | null = null;
  public userCountry: string = '';
  public loading: boolean = false;
  public searchError: string = '';
  public downloadError: string = '';
  public dataLoading: boolean = true;
  public isShiny: boolean = false;

  // Expose encodeURIComponent to template
  public readonly encodeURIComponent = encodeURIComponent;

  private readonly images: readonly string[] = [
    'Jester.png',
    'Legend.png',
    'Special.png',
    'Advanced.png',
    'Amateur.png',
    'Beginner.png',
    'Expert.png',
    'Grandmaster Candidate.png',
    'Grandmaster.png',
    'Master.png',
    'Untitled.png',
    'Beyond.png',
    'Birmingham.png',
    'Supporter.png',
  ];

  constructor() {
    this.preloadImages();
    this.waitForDataLoad();
  }

  /**
   * Wait for user data to be loaded from the service
   */
  private waitForDataLoad(): void {
    const checkInterval = setInterval(() => {
      if (this.fetch.Users.length > 0) {
        this.dataLoading = false;
        clearInterval(checkInterval);
        console.log(`Loaded ${this.fetch.Users.length} users from database`);
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (this.dataLoading) {
        clearInterval(checkInterval);
        this.dataLoading = false;
        this.searchError = 'Failed to load user database. Please refresh the page.';
      }
    }, 10000);
  }

  /**
   * Preload card images for better performance
   */
  private async preloadImages(): Promise<void> {
    const promises = this.images.map((imageName) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load ${imageName}`));
        img.src = `assets/${imageName}`;
      });
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error preloading images:', error);
    }
  }

  /**
   * Download the generated card as PNG
   */
  public async downloadImage(): Promise<void> {
    if (!this.activeUser || !this.screen) {
      this.downloadError = 'No card to download. Please search for a user first.';
      return;
    }

    try {
      this.downloadError = '';
      const dataUrl = await sc.domToPng(this.screen.nativeElement, {});
      this.downloadLink.nativeElement.href = dataUrl;
      this.downloadLink.nativeElement.download = `${this.activeUser.username}.png`;
      this.downloadLink.nativeElement.click();
    } catch (error) {
      console.error('Error downloading image:', error);
      this.downloadError = 'Failed to download image. Please try again.';
    }
  }

  /**
   * Search for a user and generate their card
   */
  public search(): void {
    const inputValue = this.userSearch.nativeElement.value.trim();

    if (!inputValue) {
      this.searchError = 'Please enter a username';
      return;
    }

    if (this.dataLoading) {
      this.searchError = 'Please wait, loading user database...';
      return;
    }

    if (this.Users.length === 0) {
      this.searchError = 'User database is empty. Please refresh the page.';
      return;
    }

    this.loading = true;
    this.searchError = '';
    this.downloadError = '';

    console.log(`Searching for "${inputValue}" in ${this.Users.length} users`);

    const user = this.Users.find(
      (x) => x.username.toLowerCase() === inputValue.toLowerCase()
    );

    console.log('Found user:', user);

    if (!user) {
      this.loading = false;
      this.searchError = `User "${inputValue}" not found in the database`;
      this.activeUser = null;
      this.userCountry = '';
      return;
    }

    this.activeUser = user;

    // 1% chance for shiny card
    this.isShiny = Math.random() < 0.01;
    if (this.isShiny) {
      console.log('✨ SHINY CARD! ✨');
    }

    this.fetch.getCountryCode(this.activeUser.uId).subscribe({
      next: (data: CountryResponse) => {
        const letters: string = data.country_acronym;

        this.userCountry = letters
          .toUpperCase()
          .split('')
          .map((char) => (127397 + char.charCodeAt(0)).toString(16))
          .join('-');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching country code:', error);
        this.searchError = 'Failed to load user country. Please try again.';
        this.loading = false;
      }
    });
  }

  /**
   * Handle Enter key in search input
   */
  public onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.search();
    }
  }
}

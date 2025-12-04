import { Component, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { SheetFetchService, User, CountryResponse } from 'src/app/service/sheet-fetch.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.sass'],
})
export class MainComponent {
  // Modern dependency injection
  private readonly fetch = inject(SheetFetchService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('usersearch', { read: ElementRef, static: true })
  userSearch!: ElementRef<HTMLInputElement>;

  @ViewChild('cardCanvas') cardCanvas!: ElementRef<HTMLCanvasElement>;
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
    if (!this.activeUser || !this.cardCanvas) {
      this.downloadError = 'No card to download. Please search for a user first.';
      return;
    }

    try {
      this.downloadError = '';
      const canvas = this.cardCanvas.nativeElement;
      const dataUrl = canvas.toDataURL('image/png');
      this.downloadLink.nativeElement.href = dataUrl;
      this.downloadLink.nativeElement.download = `${this.activeUser.username}.png`;
      this.downloadLink.nativeElement.click();
    } catch (error) {
      console.error('Error downloading image:', error);
      this.downloadError = 'Failed to download image. Please try again.';
    }
  }

  /**
   * Render the card on canvas
   */
  private async renderCardToCanvas(): Promise<void> {
    if (!this.activeUser || !this.cardCanvas) {
      console.error('Missing activeUser or cardCanvas');
      return;
    }

    try {
      // Wait for fonts to load
      await document.fonts.ready;

      // Load background from production server via CORS proxy (same as profile/flag)
      const bgImageUrl = `https://cards.cyceph.xyz/assets/${this.activeUser.title}.png`;
      const bgImage = await this.loadImage(
        `https://corsproxy.io/?${encodeURIComponent(bgImageUrl)}`,
        true
      );

      const canvas = this.cardCanvas.nativeElement;
      console.log('[5] Got canvas element');

      canvas.width = bgImage.width;
      canvas.height = bgImage.height;
      console.log('[6] Set canvas dimensions to', canvas.width, 'x', canvas.height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }
      console.log('[7] Got 2d context');

      // Apply filter if shiny
      if (this.isShiny) {
        console.log('[8] Applying invert filter for shiny');
        ctx.filter = 'invert(1)';
      } else {
        console.log('[8] No filter (not shiny)');
      }

      // Draw ONLY background first - test if this works
      console.log('[9] About to draw background image to canvas at 0,0');
      ctx.drawImage(bgImage, 0, 0);
      console.log('[10] drawImage() call completed');

      // Check what was actually drawn
      const imageData = ctx.getImageData(0, 0, 1, 1);
      console.log('[11] Sample pixel at (0,0):', imageData.data);

      ctx.filter = 'none';
      console.log('[12] Reset filter to none');

      // Load profile and flag AFTER background is drawn
      console.log('[13] Loading profile image');
      const profileImage = await this.loadImage(
        `https://corsproxy.io/?${encodeURIComponent('https://ameobea.b-cdn.net/osutrack/Mixins/userImage.php?u=' + this.activeUser.uId)}`,
        true
      );
      console.log('[14] Profile image loaded');

      console.log('[15] Loading flag image');
      const flagImage = await this.loadImage(
        `https://corsproxy.io/?${encodeURIComponent('https://osu.ppy.sh/assets/images/flags/' + this.userCountry + '.svg')}`,
        true
      );
      console.log('[16] Flag image loaded');

      // Draw profile
      const profileWidth = canvas.width * 0.294;
      const profileHeight = profileWidth;
      const profileX = canvas.width * 0.197;
      const profileY = canvas.height * 0.206;
      console.log('[17] Drawing profile at', profileX, profileY);
      ctx.drawImage(profileImage, profileX, profileY, profileWidth, profileHeight);
      console.log('[18] Profile drawn');

      // Draw flag
      const flagSize = canvas.width * 0.095;
      const flagX = canvas.width * 0.53;
      const flagY = canvas.height * 0.249;
      ctx.save();
      ctx.translate(flagX + flagSize / 2, flagY + flagSize / 2);
      ctx.scale(1.3, 1.3);
      console.log('[19] Drawing flag');
      ctx.drawImage(flagImage, -flagSize / 2, -flagSize / 2, flagSize, flagSize);
      ctx.restore();
      console.log('[20] Flag drawn');

      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      const ratingSize = canvas.width * 0.105;
      ctx.font = `800 ${ratingSize}px Nunito, sans-serif`;
      ctx.fillText(this.activeUser.rating.toString(), canvas.width * 0.74, canvas.height * 0.253);

      const isLongUsername = this.activeUser.username.length > 10;
      const usernameSize = isLongUsername ? canvas.width * 0.058 : canvas.width * 0.075;
      ctx.font = `800 ${usernameSize}px Nunito, sans-serif`;
      ctx.fillText(this.activeUser.username, canvas.width * 0.506, canvas.height * 0.485);

      const baseSize = canvas.width * 0.055;
      ctx.font = `700 ${baseSize}px Nunito, sans-serif`;
      ctx.fillText(`WRM: ${this.activeUser.wrm}`, canvas.width * 0.655, canvas.height * 0.35);

      ctx.font = `600 ${baseSize}px Nunito, sans-serif`;
      ctx.fillText(`RFX: ${this.activeUser.rfx}`, canvas.width * 0.342, canvas.height * 0.570);
      ctx.fillText(`STA: ${this.activeUser.sta}`, canvas.width * 0.342, canvas.height * 0.650);
      ctx.fillText(`REA: ${this.activeUser.rea}`, canvas.width * 0.342, canvas.height * 0.730);

      ctx.fillText(`TEN: ${this.activeUser.ten}`, canvas.width * 0.672, canvas.height * 0.570);
      ctx.fillText(`ACC: ${this.activeUser.acc}`, canvas.width * 0.672, canvas.height * 0.650);
      ctx.fillText(`PRE: ${this.activeUser.pre}`, canvas.width * 0.672, canvas.height * 0.730);

      if (this.isShiny) {
        const badgeX = canvas.width * 0.98;
        const badgeY = canvas.height * 0.02;
        const badgeWidth = canvas.width * 0.18;
        const badgeHeight = canvas.height * 0.05;

        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(badgeX - badgeWidth, badgeY, badgeWidth, badgeHeight, 8);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        const badgeTextSize = canvas.width * 0.023;
        ctx.font = `800 ${badgeTextSize}px Nunito, sans-serif`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('✨ SHINY ✨', badgeX - badgeWidth / 2, badgeY + badgeHeight / 3);
      }

      console.log('Canvas rendering complete');
    } catch (error) {
      console.error('Error rendering card to canvas:', error);
      this.searchError = 'Failed to render card. Please try again.';
    }
  }


  /**
   * Load an image and return a promise
   */
  private loadImage(src: string, crossOrigin: boolean = false): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (crossOrigin) {
        img.crossOrigin = 'anonymous';
      }

      // For local assets, ensure complete loading before resolving
      img.onload = () => {
        // Double-check the image is actually loaded
        if (img.complete && img.naturalWidth > 0) {
          resolve(img);
        } else {
          reject(new Error('Image loaded but has no dimensions'));
        }
      };
      img.onerror = (error) => reject(error);

      // Add cache busting for local assets to force fresh load
      // Only for relative paths (not full URLs including proxy URLs)
      if (!src.startsWith('http') && !src.includes('corsproxy')) {
        img.src = src + '?t=' + Date.now();
      } else {
        img.src = src;
      }
    });
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

    const user = this.Users.find(
      (x) => x.username.toLowerCase() === inputValue.toLowerCase()
    );

    if (!user) {
      this.loading = false;
      this.searchError = `User "${inputValue}" not found in the database`;
      this.activeUser = null;
      this.userCountry = '';
      return;
    }

    this.activeUser = user;
    this.isShiny = Math.random() < 0.01;

    this.fetch.getCountryCode(this.activeUser.uId).subscribe({
      next: async (data: CountryResponse) => {
        const letters: string = data.country_acronym;

        this.userCountry = letters
          .toUpperCase()
          .split('')
          .map((char) => (127397 + char.charCodeAt(0)).toString(16))
          .join('-');
        this.loading = false;
        this.cdr.detectChanges();

        requestAnimationFrame(() => {
          requestAnimationFrame(async () => {
            await this.renderCardToCanvas();
          });
        });
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

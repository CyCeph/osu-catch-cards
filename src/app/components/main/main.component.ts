import { Component, ElementRef, ViewChild, inject } from '@angular/core';
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
  public cardFlipped: boolean = false;

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

    const canvas = this.cardCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    try {
      const bgImage = await this.loadImage(`assets/${this.activeUser.title}.png`);

      canvas.width = bgImage.width;
      canvas.height = bgImage.height;

      if (this.isShiny) {
        ctx.filter = 'invert(1)';
      }

      ctx.drawImage(bgImage, 0, 0);
      ctx.filter = 'none';

      const profileImage = await this.loadImage(
        `https://corsproxy.io/?${encodeURIComponent('https://ameobea.b-cdn.net/osutrack/Mixins/userImage.php?u=' + this.activeUser.uId)}`,
        true
      );
      const profileWidth = canvas.width * 0.294;
      const profileHeight = profileWidth;
      const profileX = canvas.width * 0.197;
      const profileY = canvas.height * 0.206;
      ctx.drawImage(profileImage, profileX, profileY, profileWidth, profileHeight);

      const flagImage = await this.loadImage(
        `https://corsproxy.io/?${encodeURIComponent('https://osu.ppy.sh/assets/images/flags/' + this.userCountry + '.svg')}`,
        true
      );
      const flagSize = canvas.width * 0.095;
      const flagX = canvas.width * 0.53;
      const flagY = canvas.height * 0.249;
      ctx.save();
      ctx.translate(flagX + flagSize / 2, flagY + flagSize / 2);
      ctx.scale(1.3, 1.3);
      ctx.drawImage(flagImage, -flagSize / 2, -flagSize / 2, flagSize, flagSize);
      ctx.restore();

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
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
      img.src = src;
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
        this.cardFlipped = false;

        setTimeout(async () => {
          await this.renderCardToCanvas();
          setTimeout(() => {
            this.cardFlipped = true;
          }, 100);
        }, 0);
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

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
    console.log('renderCardToCanvas called');
    console.log('activeUser:', this.activeUser);
    console.log('cardCanvas:', this.cardCanvas);

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

    console.log('Canvas element:', canvas);
    console.log('Loading background image:', `assets/${this.activeUser.title}.png`);

    try {
      // Load background image
      const bgImage = await this.loadImage(`assets/${this.activeUser.title}.png`);
      console.log('Background image loaded:', bgImage.width, 'x', bgImage.height);

      // Set canvas size to match background image
      canvas.width = bgImage.width;
      canvas.height = bgImage.height;

      // Apply shiny effect if needed
      if (this.isShiny) {
        ctx.filter = 'invert(1)';
      }

      // Draw background
      ctx.drawImage(bgImage, 0, 0);
      ctx.filter = 'none';
      console.log('Background drawn, canvas size set to:', canvas.width, 'x', canvas.height);

      // Load and draw profile picture
      const profileImage = await this.loadImage(
        `https://corsproxy.io/?${encodeURIComponent('https://ameobea.b-cdn.net/osutrack/Mixins/userImage.php?u=' + this.activeUser.uId)}`,
        true
      );
      // Profile was 267px, make it slightly smaller
      const profileWidth = canvas.width * 0.294; // Slightly smaller than 0.327
      const profileHeight = profileWidth; // Square
      const profileX = canvas.width * 0.197;
      const profileY = canvas.height * 0.206;
      console.log('Drawing profile at:', profileX, profileY, 'size:', profileWidth, 'x', profileHeight);
      ctx.drawImage(profileImage, profileX, profileY, profileWidth, profileHeight);

      // Load and draw country flag
      const flagImage = await this.loadImage(
        `https://corsproxy.io/?${encodeURIComponent('https://osu.ppy.sh/assets/images/flags/' + this.userCountry + '.svg')}`,
        true
      );
      // Flag - make it slightly smaller
      const flagSize = canvas.width * 0.095; // Smaller than 0.11
      const flagX = canvas.width * 0.53;
      const flagY = canvas.height * 0.249;
      ctx.save();
      ctx.translate(flagX + flagSize / 2, flagY + flagSize / 2);
      ctx.scale(1.3, 1.3);
      ctx.drawImage(flagImage, -flagSize / 2, -flagSize / 2, flagSize, flagSize);
      ctx.restore();
      console.log('Drawing flag at:', flagX, flagY, 'size:', flagSize);

      // Set up text rendering
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Draw rating (large white text) - make smaller
      const ratingSize = canvas.width * 0.105; // Smaller than 0.1176
      ctx.font = `800 ${ratingSize}px Nunito, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(this.activeUser.rating.toString(), canvas.width * 0.74, canvas.height * 0.253);
      console.log('Drawing rating:', this.activeUser.rating, 'size:', ratingSize, 'at:', canvas.width * 0.74, canvas.height * 0.253);

      // Draw username - make smaller
      const isLongUsername = this.activeUser.username.length > 10;
      const usernameSize = isLongUsername ? canvas.width * 0.058 : canvas.width * 0.075; // Smaller
      const usernameY = isLongUsername ? canvas.height * 0.485 : canvas.height * 0.485;
      ctx.font = `800 ${usernameSize}px Nunito, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(this.activeUser.username, canvas.width * 0.506, usernameY); // Shifted right about 5 pixels

      // Draw WRM - make smaller and shift right
      const baseSize = canvas.width * 0.055; // Smaller than 0.0613
      ctx.font = `700 ${baseSize}px Nunito, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`WRM: ${this.activeUser.wrm}`, canvas.width * 0.655, canvas.height * 0.35); // Shifted from 0.548 to 0.58

      // Draw stats - shift right
      ctx.font = `600 ${baseSize}px Nunito, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';

      // Left column stats - adjusted position
      ctx.fillText(`RFX: ${this.activeUser.rfx}`, canvas.width * 0.342, canvas.height * 0.570); // Adjusted left slightly
      ctx.fillText(`STA: ${this.activeUser.sta}`, canvas.width * 0.342, canvas.height * 0.650);
      ctx.fillText(`REA: ${this.activeUser.rea}`, canvas.width * 0.342, canvas.height * 0.730);

      // Right column stats - adjusted position
      ctx.fillText(`TEN: ${this.activeUser.ten}`, canvas.width * 0.672, canvas.height * 0.570); // Adjusted left slightly
      ctx.fillText(`ACC: ${this.activeUser.acc}`, canvas.width * 0.672, canvas.height * 0.650);
      ctx.fillText(`PRE: ${this.activeUser.pre}`, canvas.width * 0.672, canvas.height * 0.730);

      // Draw shiny badge if needed
      if (this.isShiny) {
        const badgeX = canvas.width * 0.98;
        const badgeY = canvas.height * 0.02;
        const badgeWidth = canvas.width * 0.18;
        const badgeHeight = canvas.height * 0.05;

        // Draw badge background
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        const radius = 8;
        ctx.beginPath();
        ctx.roundRect(badgeX - badgeWidth, badgeY, badgeWidth, badgeHeight, radius);
        ctx.fill();
        ctx.stroke();

        // Draw badge text
        ctx.shadowBlur = 0;
        // Original was 1.2rem = ~19px at 900px width
        const badgeTextSize = canvas.width * 0.023; // 19/816
        ctx.font = `800 ${badgeTextSize}px Nunito, sans-serif`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('✨ SHINY ✨', badgeX - badgeWidth / 2, badgeY + badgeHeight / 3);
      }

      console.log('Card rendering complete!');
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
      next: async (data: CountryResponse) => {
        const letters: string = data.country_acronym;

        this.userCountry = letters
          .toUpperCase()
          .split('')
          .map((char) => (127397 + char.charCodeAt(0)).toString(16))
          .join('-');
        this.loading = false;

        // Wait for the canvas to be rendered in the DOM
        setTimeout(async () => {
          await this.renderCardToCanvas();
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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Papa } from 'ngx-papaparse';
import { Observable } from 'rxjs';

export interface User {
  username: string;
  uId: string;
  pp: number;
  accPercentage: string;
  starRating: number;
  cs: number;
  ar: number;
  length: string;
  rating: number;
  country: string;
  sr: number;
  rfx: number;
  ten: number;
  sta: number;
  acc: number;
  rea: number;
  pre: number;
  wrm: number;
  title: string;
}

export interface CountryResponse {
  country_acronym: string;
}

@Injectable({
  providedIn: 'root',
})
export class SheetFetchService {
  private readonly SKILL_RATING_LINK =
    'https://docs.google.com/spreadsheets/d/1s-ItBZwDzWb_taDPD2L2jrUbNzl4pxjSgXcE5dza4tc/export?format=csv&id=1s-ItBZwDzWb_taDPD2L2jrUbNzl4pxjSgXcE5dza4tc&gid=64960459';

  public Users: User[] = [];

  constructor(
    private readonly httpClient: HttpClient,
    private readonly papa: Papa
  ) {
    this.getData();
  }

  /**
   * Fetch and parse user data from Google Sheets
   */
  private getData(): void {
    this.httpClient
      .get(this.SKILL_RATING_LINK, { responseType: 'text' })
      .subscribe({
        next: (csvData) => {
          this.papa.parse(csvData, {
            complete: (result) => {
              this.parseUserData(result.data);
            },
            error: (error) => {
              console.error('Error parsing CSV data:', error);
            },
          });
        },
        error: (error) => {
          console.error('Error fetching user data:', error);
        },
      });
  }

  /**
   * Parse CSV data and calculate user ratings
   */
  private parseUserData(data: any[]): void {
    console.log('Raw CSV data rows:', data.length);
    console.log('First few rows:', data.slice(0, 3));

    const validRows = data.filter((row) => row && row.length > 20 && row[2]);
    console.log('Valid rows after filter:', validRows.length);

    if (validRows.length > 0) {
      console.log('Sample valid row:', validRows[0]);
    }

    this.Users = validRows.map((row) => {
        const skills = [
          parseFloat(row[13]),
          parseFloat(row[14]),
          parseFloat(row[15]),
          parseFloat(row[16]),
          parseFloat(row[17]),
          parseFloat(row[18]),
        ];

        const rating = this.calculateRating(skills);

        return {
          username: row[2],
          uId: row[3],
          pp: parseFloat(row[4]),
          accPercentage: row[5],
          starRating: parseFloat(row[6]),
          cs: parseFloat(row[8]),
          ar: parseFloat(row[7]),
          length: row[10],
          rating: Math.round(rating),
          country: row[11],
          sr: parseFloat(row[12]),
          rfx: Math.round(parseFloat(row[13])),
          ten: Math.round(parseFloat(row[14])),
          sta: Math.round(parseFloat(row[15])),
          acc: Math.round(parseFloat(row[16])),
          rea: Math.round(parseFloat(row[17])),
          pre: Math.round(parseFloat(row[18])),
          wrm: Math.round(parseFloat(row[19]) * 10) / 10,
          title: row[20],
        };
      });

    console.log('Total users loaded:', this.Users.length);
    if (this.Users.length > 0) {
      console.log('Sample users:', this.Users.slice(0, 3).map(u => u.username));
    }
  }

  /**
   * Calculate overall rating based on top 3 and bottom 3 skills
   * Top 3 skills are weighted at 100%, bottom 3 at 50%
   */
  private calculateRating(skills: number[]): number {
    const sortedSkills = [...skills].sort((a, b) => b - a);

    const top3 = sortedSkills.slice(0, 3);
    const bottom3 = sortedSkills.slice(3);

    const top3Avg = top3.reduce((sum, val) => sum + val, 0) / top3.length;
    const bottom3Avg = bottom3.reduce((sum, val) => sum + val, 0) / bottom3.length;

    return (top3Avg + bottom3Avg * 0.5) / 1.5;
  }

  public getCountryCode(id: string): Observable<CountryResponse> {
    return this.httpClient.get<CountryResponse>(
      `https://osupepe.com/api/users/userstats?userId=${id}`
    );
  }
}

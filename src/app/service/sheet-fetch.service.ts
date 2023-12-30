import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Papa } from 'ngx-papaparse';

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
  sr: number;
  rfx: number;
  ten: number;
  sta: number;
  acc: number;
  rea: number;
  pre: number;
  wrm: number;
  title: string;
  prevSr: number;
  prevUpdate: string;
  prevRfx: number;
  prevTen: number;
  prevSta: number;
  prevAcc: number;
  prevRea: number;
  prevPre: number;
  diffRfx: number;
  diffTen: number;
  diffSta: number;
  diffAcc: number;
  diffRea: number;
  diffPre: number;
  diffSr: number;
}

@Injectable({
  providedIn: 'root',
})
export class SheetFetchService {
  private SkillRatingLink: string =
    'https://docs.google.com/spreadsheets/d/1s-ItBZwDzWb_taDPD2L2jrUbNzl4pxjSgXcE5dza4tc/export?format=csv&id=1s-ItBZwDzWb_taDPD2L2jrUbNzl4pxjSgXcE5dza4tc&gid=1043073592';

  public Users: User[] = [];
  constructor(private httpClient: HttpClient, private papa: Papa) {
    this.getData();
  }

  private getData(): void {
    const data = this.httpClient.get(this.SkillRatingLink, {
      responseType: 'text',
    });

    data.subscribe((data) => {
      this.papa.parse(data, {
        complete: (result) => {
          const output = result.data;
          console.log(output);

          output.map((user: any) => {
            if (true) {
              let average =
                (parseFloat(user[9]) +
                  parseFloat(user[10]) +
                  parseFloat(user[11]) +
                  parseFloat(user[12]) +
                  parseFloat(user[13]) +
                  parseFloat(user[14])) /
                6;

              if (user[0] == 'CyCeph') {
                console.log(average);
              }

              let sr = Math.pow(parseFloat(user[8]) / 5000, 0.5);

              let score = (100 * sr + average) / 2;

              this.Users.push({
                username: user[0],
                uId: user[1],
                pp: user[2],
                accPercentage: user[3],
                starRating: user[4],
                cs: user[5],
                ar: user[6],
                length: user[7],
                rating: Math.round(score),
                sr: user[8],
                rfx: Math.round(user[9]),
                ten: Math.round(user[10]),
                sta: Math.round(user[11]),
                acc: Math.round(user[12]),
                rea: Math.round(user[13]),
                pre: Math.round(user[14]),
                wrm: Math.round(user[15] * 10) / 10,
                title: user[16],
                prevSr: user[18],
                prevUpdate: user[19],
                prevRfx: user[20],
                prevTen: user[21],
                prevSta: user[22],
                prevAcc: user[23],
                prevRea: user[24],
                prevPre: user[25],
                diffRfx: user[26],
                diffTen: user[27],
                diffSta: user[28],
                diffAcc: user[29],
                diffRea: user[30],
                diffPre: user[31],
                diffSr: user[32],
              });
            }
          });
        },
      });
    });
  }

  public getCountryCode(id: string) {
    return this.httpClient.get(
      `https://osupepe.com/api/users/userstats?userId=${id}`
    );
  }
}

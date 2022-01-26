/* eslint-disable no-control-regex */
import * as core from '@actions/core';
import levenshtein from 'js-levenshtein';

export interface IIssueData {
  title?: string;
  body?: string;
  labels?: string[];
}

export interface IParameter extends IDefaultArea {
  area: string;
  keywords: string[];
}

export interface IDefaultArea {
  labels?: string[];
  assignees?: string[];
}

export class Issue {
  private titleIssueWords?: string[];
  private bodyIssueWords?: string[];
  public parameters: IParameter[];
  public defaultArea?: IDefaultArea;
  private similarity: number;
  private bodyValue: number;
  private areaIsKeyword: boolean;
  private labels: string[] | undefined;

  constructor(content: IIssueData) {
    this.labels = content.labels;
    this.parameters = JSON.parse(core.getInput('parameters', {required: true}));
    this.similarity = +core.getInput('similarity', {required: false});
    this.bodyValue = +core.getInput('body-value', {required: false});

    const areaIsKeywordInput: string = core.getInput('area-is-keyword', {
      required: false,
    });
    areaIsKeywordInput.toLowerCase() === 'true'
      ? (this.areaIsKeyword = true)
      : (this.areaIsKeyword = false);

    const excluded: string[] = core
      .getInput('excluded-expressions', {required: false})
      .replace(/\[|\]/gi, '')
      .split('|');

    const title = content.title;
    if (title) {
      excluded.forEach(ex => {
        title.replace(ex, '');
      });
      this.titleIssueWords = title.split(/ |\(|\)|\./);
    }

    const body = content.body;
    if (body) {
      excluded.forEach(ex => {
        body.replace(ex, '');
      });
      this.bodyIssueWords = body.split(/ |\(|\)|\./);
    }

    const defaultAreaInput = core.getInput('default-area', {required: false});
    if (defaultAreaInput) {
      this.defaultArea = JSON.parse(defaultAreaInput);
    }
  }

  public verifyIssueLabels(
    includedLabels: string[],
    excludedLabels: string[]
  ): boolean {
    let containsIncludedLabel = false;
    let containsExcludedLabel = false;
    let hasIncludedLabels = true;

    console.log(includedLabels[0]);

    if (includedLabels[0] === '') {
      hasIncludedLabels = false;
    }

    if (this.labels) {
      for (const label of this.labels) {
        if (hasIncludedLabels) {
          if (includedLabels.includes(label)) containsIncludedLabel = true;
        } else {
          containsIncludedLabel = true;
        }

        if (excludedLabels[0]) {
          if (excludedLabels.includes(label)) {
            containsExcludedLabel = true;
            core.info(`This issue contains the excluded label ${label}`);
          }
        }
      }
    } else {
      if (!hasIncludedLabels) {
        containsIncludedLabel = true;
      }
    }

    if (!containsIncludedLabel) {
      core.info('This issue contains no required labels');
    }

    if (!containsIncludedLabel || containsExcludedLabel) {
      return false;
    } else {
      return true;
    }
  }

  public determineArea(): string {
    let titleValue = 1;
    let x = 1;
    let potentialAreas: Map<string, number> = new Map();

    const weightedTitle: (n: number) => number = (n: number) => {
      return 2 / (1 + n);
    };

    // For each word in the title, check if it matches any keywords. If it does, add decreasing score based on inverse function to the area keyword is in.
    if (this.titleIssueWords) {
      this.titleIssueWords.forEach(content => {
        potentialAreas = this.scoreArea(content, potentialAreas, titleValue);
        ++x;
        titleValue = weightedTitle(x);
      });
    }

    // Add static value to area keyword is in if keyword is found in body
    if (this.bodyIssueWords) {
      this.bodyIssueWords.forEach(content => {
        potentialAreas = this.scoreArea(
          content,
          potentialAreas,
          this.bodyValue
        );
      });
    }

    if (potentialAreas.size > 0)
      console.log('Area scores: ', ...potentialAreas);

    const winningArea = this.decideWinner(potentialAreas);
    if (winningArea) core.info('Winning area: ' + winningArea);

    return winningArea;
  }

  public getWinningAreaData(winningArea: string): IParameter {
    let winningAreaData: IParameter = {
      area: '',
      keywords: [],
      labels: [],
      assignees: [],
    };

    for (const obj of this.parameters) {
      if (winningArea === obj.area) {
        winningAreaData = obj;
      }
    }

    return winningAreaData;
  }

  private scoreArea(
    content: string,
    potentialAreas: Map<string, number>,
    value
  ): Map<string, number> {
    this.parameters.forEach(obj => {
      if (this.areaIsKeyword) {
        if (this.similarStrings(content, obj.area)) {
          potentialAreas.has(obj.area)
            ? potentialAreas.set(obj.area, potentialAreas.get(obj.area) + value)
            : potentialAreas.set(obj.area, value);
        }
      }
      obj.keywords.forEach(keyword => {
        if (this.similarStrings(content, keyword)) {
          potentialAreas.has(obj.area)
            ? potentialAreas.set(obj.area, potentialAreas.get(obj.area) + value)
            : potentialAreas.set(obj.area, value);
        }
      });
    });
    return potentialAreas;
  }

  private decideWinner(potentialAreas: Map<string, number>): string {
    let winningArea = '';
    let winners: Map<string, number> = new Map();
    for (const area of potentialAreas.entries()) {
      if (winners.size === 0) {
        winners.set(area[0], area[1]);
      } else if (area[1] > winners.values().next().value) {
        winners = new Map();
        winners.set(area[0], area[1]);
      } else if (area[1] === winners.values().next().value) {
        winners.set(area[0], area[1]);
      }
    }
    // tiebreaker goes to the area with more *exact* keyword matches
    if (winners.size > 1 && this.similarity !== 0) {
      this.similarity = 0;
      winningArea = this.determineArea();
    } else if (winners.size > 0) {
      winningArea = winners.keys().next().value;
    }
    return winningArea;
  }

  private isSimilar(str1: string, str2: string): number {
    return ((str1.length + str2.length) / 2) * this.similarity;
  }

  private similarStrings(str1: string, str2: string): boolean {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();

    // Regex for removing punctuation and replacing with empty string
    str1 = str1.replace(/ |_|-|\(|\)|:|`|\[|\]|	|\./gi, '');
    str2 = str2.replace(/ |_|-|\(|\)|:|`|\[|\]|	|\./gi, '');

    // levenshtein returns a value between 0 and the length of the strings being compared. This
    // represents the number of character differences between compared strings. We compare this
    // with a set percentage of the average length of said strings
    if (levenshtein(str1, str2) <= this.isSimilar(str1, str2)) return true;
    else return false;
  }
}

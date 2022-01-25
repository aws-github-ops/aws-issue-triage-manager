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
export declare class Issue {
    private titleIssueWords?;
    private bodyIssueWords?;
    parameters: IParameter[];
    defaultArea?: IDefaultArea;
    private similarity;
    private bodyValue;
    private areaIsKeyword;
    private labels;
    constructor(content: IIssueData);
    verifyIssueLabels(includedLabels: string[], excludedLabels: string[]): boolean;
    determineArea(): string;
    getWinningAreaData(winningArea: string): IParameter;
    private scoreArea;
    private decideWinner;
    private isSimilar;
    private similarStrings;
}

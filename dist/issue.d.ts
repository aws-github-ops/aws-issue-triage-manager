export interface IIssueData {
    title?: string;
    body?: string;
    labels?: string[];
    isValidIssueType?: boolean;
}
export interface IParameter extends IDefaultArea {
    area: string;
    keywords: string[];
    affixes?: IAffix;
    enableGlobalAffixes?: boolean;
    areaIsKeyword?: boolean;
}
export interface IDefaultArea {
    labels?: string[];
    assignees?: string[];
}
export interface IAffix {
    prefixes?: string[];
    suffixes?: string[];
}
export declare class Issue {
    private titleIssueWords?;
    private bodyIssueWords?;
    readonly parameters: IParameter[];
    defaultArea?: IDefaultArea;
    private similarity;
    private bodyValue;
    private labels;
    private globalAffixes?;
    constructor(content: IIssueData);
    verifyIssueLabels(includedLabels: string[], excludedLabels: string[]): boolean;
    determineArea(): string;
    getWinningAreaData(winningArea: string): IParameter;
    private scoreArea;
    private decideWinner;
    private isSimilar;
    private similarStrings;
    private addAreaToKeywords;
    private attachAffixes;
}

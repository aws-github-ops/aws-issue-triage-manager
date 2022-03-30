import { IDefaultArea, IIssueData, IssueType } from './issue';
export interface IRepo {
    owner: string;
    repo: string;
}
export interface IReviewers {
    reviewers?: string[];
    teamReviewers?: string[];
}
export declare class GithubApi {
    private octokit;
    private repo;
    private issueNumber;
    constructor(token: string);
    triage(area: IDefaultArea): Promise<void>;
    setIssueAssignees(assignees: string[]): Promise<void>;
    setIssueLabels(labels: string[]): Promise<void>;
    setReviewers(reviewers: IReviewers): Promise<void>;
    getIssueContent(): Promise<IIssueData>;
    getIssueType(data: any): IssueType;
    verifyIssueType(data: any, issueType: any): boolean;
}

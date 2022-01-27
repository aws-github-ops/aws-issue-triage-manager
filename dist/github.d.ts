import { IIssueData } from './issue';
export interface IRepo {
    owner: string;
    repo: string;
}
export declare class GithubApi {
    private octokit;
    private repo;
    private issueNumber;
    constructor(token: string);
    setIssueAssignees(assignees: string[]): Promise<void>;
    setIssueLabels(labels: string[]): Promise<void>;
    getIssueContent(): Promise<IIssueData>;
    verifyIssueType(data: any): boolean;
}

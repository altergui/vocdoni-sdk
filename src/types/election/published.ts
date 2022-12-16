import { Election, IElectionParameters } from './election';

export interface IPublishedElectionParameters extends IElectionParameters {
  id: string;
  status: string;
  voteCount: number;
  finalResults: boolean;
  results: Array<Array<string>>;
  electionCount: number;
  creationTime: string;
  metadataURL: string;
  raw: object;
}

/**
 * Represents a published election
 */
export class PublishedElection extends Election {
  private readonly _id: string;
  private readonly _status: string;
  private readonly _voteCount: number;
  private readonly _finalResults: boolean;
  private readonly _results: Array<Array<string>>;
  private readonly _electionCount: number;
  private readonly _creationTime: Date;
  private readonly _metadataURL: string;
  private readonly _raw: object;

  /**
   * Constructs a published election
   *
   * @param params Election parameters
   */
  public constructor(params: IPublishedElectionParameters) {
    super({
      title: params.title,
      description: params.description,
      header: params.header,
      streamUri: params.streamUri,
      startDate: params.startDate,
      endDate: params.endDate,
      electionType: params.electionType,
      voteType: params.voteType,
      questions: params.questions,
      census: params.census,
    });
    this._id = params.id;
    this._status = params.status;
    this._voteCount = params.voteCount;
    this._finalResults = params.finalResults;
    this._results = params.results;
    this._electionCount = params.electionCount;
    this._creationTime = new Date(params.creationTime);
    this._metadataURL = params.metadataURL;
    this._raw = params.raw;
  }

  /**
   * Returns a published election object
   *
   * @param params Published election parameters
   */
  public static build(params: IPublishedElectionParameters) {
    return new PublishedElection(params);
  }

  get id(): string {
    return this._id;
  }

  get status(): string {
    return this._status;
  }

  get voteCount(): number {
    return this._voteCount;
  }

  get finalResults(): boolean {
    return this._finalResults;
  }

  get results(): Array<Array<string>> {
    return this._results;
  }

  get electionCount(): number {
    return this._electionCount;
  }

  get creationTime(): Date {
    return this._creationTime;
  }

  get metadataURL(): string {
    return this._metadataURL;
  }

  get raw(): object {
    return this._raw;
  }
}
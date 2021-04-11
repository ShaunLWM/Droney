export class TorrentDetails {
	private _trackers: string[];
	private _errors: string[];
	private _pieces: number[];

	constructor(trackers: string[], errors: string[] = [], pieces: number[] = []) {
		this._trackers = trackers;
		this._errors = errors;
		this._pieces = pieces;
	}

	get trackers(): string[] {
		return this._trackers;
	}

	get errors(): string[] {
		return this._errors;
	}

	get pieces(): number[] {
		return this._pieces;
	}

	getTrackersText() {
		return this._trackers.join("\n");
	}

	getErrorsText() {
		return this._errors.join("\n");
	}
}

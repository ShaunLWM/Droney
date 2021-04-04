export interface RuTorrentOptions {
	host: string;
	path: string;
	port: number;
	ssl: boolean;
	url?: string;
	headers?: { [header: string]: string };
	method?: string;
	username?: string;
	password?: string;
}

export interface Torrent {
	id: number;
	hash: string;
	name: string;
	statusCode: TorrentStatus;
	locationDir: string;
	rateDownload: number;
	rateUpload: number;
	seedersConnected: number;
	seedersKnown: number;
	leechersConnected: number;
	leechersKnown: number;
	eta: number;
	downloadedEver: number;
	uploadedEver: number;
	totalSize: number;
	partDone: number;
	available: number;
	label: string;
	dateAdded: Date;
	realDateDone: Date | null;
	error: string;
}

export type RawTorrentObject = [
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string
];

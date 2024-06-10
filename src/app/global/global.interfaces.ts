export enum BotKind {
	Unknown = 'unknown',
	HeadlessChrome = 'headless_chrome',
	PhantomJS = 'phantomjs',
	Nightmare = 'nightmare',
	Selenium = 'selenium',
	Electron = 'electron',
	NodeJS = 'nodejs',
	Rhino = 'rhino',
	CouchJS = 'couchjs',
	Sequentum = 'sequentum',
	SlimerJS = 'slimerjs',
	CefSharp = 'cefsharp',
}

export interface IBotDetectionResult {
	bot: boolean;
	botKind?: BotKind;
	error?: any;
}

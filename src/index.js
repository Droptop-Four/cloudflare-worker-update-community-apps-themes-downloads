import * as Realm from 'realm-web';
import { Toucan } from 'toucan-js';

const base64 = require('base-64');
const JSONbig = require('json-bigint');

const {
	BSON: { ObjectId },
} = Realm;

async function realmLogin(appId, apiKey) {
	const app = new Realm.App({ id: appId });
	const credentials = Realm.Credentials.apiKey(apiKey);
	const user = await app.logIn(credentials);
	console.assert(user.id === app.currentUser.id);
	return user;
}

async function updateAppDownloads(apiKey, collection, url) {
	const path = 'data/community_apps/community_apps.json';

	let completeUrl = `${url}${path}`;

	let response = await fetch(completeUrl, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			Accept: 'application/vnd.github.v3+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'User-Agent': 'update-community-apps-themes-downloads',
		},
	});
	const fileData = await response.json();
	const contentDecoded = base64.decode(fileData.content);

	let jsonData = JSONbig.parse(contentDecoded);

	for (let app of jsonData.apps) {
		const downloadNumber = await collection.findOne({ uuid: app.app.uuid });
		if (downloadNumber) {
			app.app.downloads = downloadNumber.downloads;
		} else {
			console.log(`Download number not found for app ${app.app.uuid}`);
			app.app.downloads = 0;
		}
	}

	const updatedContent = JSONbig.stringify(jsonData, null, 4);

	const updatedContentEncoded = base64.encode(updatedContent);

	response = await fetch(completeUrl, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			Accept: 'application/vnd.github.v3+json',
			'Content-Type': 'application/json',
			'X-GitHub-Api-Version': '2022-11-28',
			'User-Agent': 'update-community-apps-themes-downloads',
		},
		body: JSON.stringify({
			message: 'Update download numbers',
			content: updatedContentEncoded,
			sha: fileData.sha,
		}),
	});

	if (response.ok) {
		console.log('Community Apps download numbers updated and committed successfully');
	} else {
		console.log('Failed to commit updated Community Apps download numbers');
	}
}

async function updateThemeDownloads(apiKey, collection, url) {
	const path = 'data/community_themes/community_themes.json';

	let completeUrl = `${url}${path}`;

	let response = await fetch(completeUrl, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			Accept: 'application/vnd.github.v3+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'User-Agent': 'update-community-apps-themes-downloads',
		},
	});
	const fileData = await response.json();
	const contentDecoded = base64.decode(fileData.content);

	let jsonData = JSONbig.parse(contentDecoded);

	for (let theme of jsonData.themes) {
		const downloadNumber = await collection.findOne({ uuid: theme.theme.uuid });
		if (downloadNumber) {
			theme.theme.downloads = downloadNumber.downloads;
		} else {
			console.log(`Download number not found for theme ${theme.theme.uuid}`);
			theme.theme.downloads = 0;
		}
	}

	const updatedContent = JSONbig.stringify(jsonData, null, 4);

	const updatedContentEncoded = base64.encode(updatedContent);

	response = await fetch(completeUrl, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			Accept: 'application/vnd.github.v3+json',
			'Content-Type': 'application/json',
			'X-GitHub-Api-Version': '2022-11-28',
			'User-Agent': 'update-community-apps-themes-downloads',
		},
		body: JSON.stringify({
			message: 'Update download numbers',
			content: updatedContentEncoded,
			sha: fileData.sha,
		}),
	});

	if (response.ok) {
		console.log('Community Themes download numbers updated and committed successfully');
	} else {
		console.log('Failed to commit updated Community Themes download numbers');
	}
}

export default {
	async scheduled(event, env, ctx) {
		const sentry = new Toucan({
			dsn: env.SENTRY_DSN,
			context: ctx,
		});

		const url = `https://api.github.com/repos/Droptop-Four/GlobalData/contents/`;

		try {
			const user = await realmLogin(env.REALM_APPID, env.REALM_APIKEY);
			const app_collection = user.mongoClient('mongodb-atlas').db(env.DB).collection(env.APP_COLLECTION);
			const theme_collection = user.mongoClient('mongodb-atlas').db(env.DB).collection(env.THEME_COLLECTION);
			await updateAppDownloads(env.GITHUB_APIKEY, app_collection, url);
			await updateThemeDownloads(env.GITHUB_APIKEY, theme_collection, url);

			console.log('Downloads updated successfully');
		} catch (error) {
			sentry.captureException(error);
			console.log('Error updating downloads:', error.message);
		}
	},
};

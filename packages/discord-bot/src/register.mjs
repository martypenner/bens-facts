import { ApiHandler } from 'sst/node/api';
import { Config } from 'sst/node/config';
import { ADD_COMMAND } from './commands.mjs';

const token = Config.DISCORD_TOKEN;
const applicationId = Config.DISCORD_APPLICATION_ID;

const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;

/**
 * Register all commands globally.  This can take o(minutes), so wait until
 * you're sure these are the commands you want.
 */
export const handler = ApiHandler(async () => {
	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bot ${token}`
		},
		method: 'PUT',
		body: JSON.stringify([ADD_COMMAND])
	});

	if (response.ok) {
		console.log('Registered all commands');
		const data = await response.json();
		console.log(JSON.stringify(data, null, 2));
	} else {
		console.error('Error registering commands');
		let errorText = `Error registering commands \n ${response.url}: ${response.status} ${response.statusText}`;
		try {
			const error = await response.text();
			if (error) {
				errorText = `${errorText} \n\n ${error}`;
			}
		} catch (err) {
			console.error('Error reading body from request:', err);
		}
		console.error(errorText);
	}

	return 'Successfully registered all discord commands.';
});

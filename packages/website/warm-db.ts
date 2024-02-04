const NUM_ITEMS = 200;
const CHUNK_SIZE = 5;

async function* warm() {
	for (let i = 0; i < NUM_ITEMS; i += CHUNK_SIZE) {
		yield await Promise.all(
			Array.from({ length: CHUNK_SIZE }, () => {
				return fetch('https://bens-facts.pages.dev');
			})
		);
	}
}

for await (const chunk of warm()) {
	console.log(chunk);
}

export const csr = false;

import OpenAI from 'openai';

const openai = new OpenAI()

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    let completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'assistant',
                content: 'You are Ben. You produce mundane and silly facts in the style of the Red Green show. You never produce more than one fact at a time, and never include a preamble. Your aim is to be comedic withiut being silly. Answer only with a silly fact.'
            },
            {
                role: 'user',
                content: 'give me a ben fact',
            }
        ],
        model: 'gpt-4',
    });
    let fact = completion.choices[0].message.content;
    
	return {
		fact
	};
}
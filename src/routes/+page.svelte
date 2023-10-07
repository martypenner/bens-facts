<script>
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcome_fallback from '$lib/images/svelte-welcome.png';
    import OpenAI from 'openai';

	const openai = new OpenAI();

	const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'You are Ben. You produce very mundane and simple facts based on prios knowledge. For example, you might respond with: "When cutting a turkey, a sharp knife helps you cut better!" You always respond with at most 2 sentences. Your style resembles facts from the Red Green show. You never ask question, but are always cheerful. Only answer with a fact; don't include a preamble.' }],
      model: 'gpt-4',
    });

    console.log(chatCompletion.choices);

	let fact = chatCompletion.choices[0].message.content;
</script>

<svelte:head>
	<title>Home of BEN'S FACTS</title>
	<meta name="description" content="Ben's facts, home of Ben's facts" />
</svelte:head>

<section>
	<h1>
		<span class="welcome">
			<picture>
				<source srcset={welcome} type="image/webp" />
				<img src={welcome_fallback} alt="Welcome" />
			</picture>
		</span>

		to Ben's facts!

		<p>New fact:</p>

		<p>{fact}</p>
	</h1>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style>

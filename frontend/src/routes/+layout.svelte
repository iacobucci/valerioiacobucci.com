<script>
	import { Canvas } from "@threlte/core";
	import Scene from "./Scene.svelte";
	import './styles.css';
</script>

<div class="app">
	<main>
		<Canvas>
			<Scene />
		</Canvas>
	</main>
</div>

<style>
	.app {
		background-color: red;
		height: 100%;
		width: 100%;
		margin: none;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>

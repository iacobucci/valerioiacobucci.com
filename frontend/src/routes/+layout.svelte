<script>
	import { Canvas } from "@threlte/core";
	import Scene from "./Scene.svelte";
	import "./styles.css";
</script>

<main>
	<div class="bg">
		<Canvas>
			<Scene />
		</Canvas>
	</div>

	<div class="center-box">
		<div class="title">Valerio Iacobucci</div>
	</div>
</main>

<style>
	.bg {
		background-color: var(--col-6);

		width: 100%;
		height: 100%;
		display: block;
		position: fixed;
		top: 0;
		left: 0;
		z-index: -9999;
	}

	@font-face {
		font-family: "gazebo";
		src: url("/fonts/gazebo.otf") format("opentype");
	}

	@font-face {
		font-family: "capuche";
		src: url("/fonts/capuche.otf") format("opentype");
	}

	@font-face {
		font-family: "sake_moru";
		src: url("/fonts/sake_moru.ttf") format("truetype");
	}
	
	.center-box {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		
		border: var(--col-1) 3px solid;
	}

	.title {
		/* add the font in ../fonts/title.ttf  */
		font-family: "gazebo";
		font-size: 10vw;
		display: flex;
		text-align: center;
		color: var(--col-1);
	}
</style>

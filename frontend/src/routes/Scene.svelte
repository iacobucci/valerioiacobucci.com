<script>
	import { T } from "@threlte/core";
	import { interactivity } from "@threlte/extras";
	import { spring } from "svelte/motion";
	import { useFrame } from "@threlte/core";

	interactivity();
	const scale = spring(1);

	let rotation = 0;
	useFrame((state, delta) => {
		rotation -= delta;
	});

	// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
	// import { useLoader } from "@threlte/core";

	// const gltf = useLoader(GLTFLoader).load("/assets/suzanne.gltf");
	import Suzanne from "./Suzanne.svelte";
</script>

<T.PerspectiveCamera
	makeDefault
	position={[10, 10, 10]}
	on:create={({ ref }) => {
		ref.lookAt(0, 0, 0);
	}}
/>

<T.DirectionalLight position={[3, 10, 7]} />

<!-- {#if $gltf}
	<T is={$gltf.scene} />
{/if} -->

<Suzanne />
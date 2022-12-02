<script>
	import { T } from "@threlte/core";
	import { interactivity } from "@threlte/extras";
	import { spring } from "svelte/motion";
	import { Text } from "@threlte/extras";
	import { useFrame } from "@threlte/core";

	interactivity();
	const scale = spring(1);

	let rotation = 0;
	useFrame((state, delta) => {
		rotation -= delta;
	});
	
</script>

<T.PerspectiveCamera
	makeDefault
	position={[10, 10, 10]}
	on:create={({ ref }) => {
		ref.lookAt(0, 0, 0);
	}}
/>

<T.DirectionalLight position={[3, 10, 7]} />

<Text
	rotation.y={rotation}
	position={[0, 5, 0]}
	fontSize={1}
	text="Valerio Iacobucci"
	scale={$scale}
	on:pointerenter={() => scale.set(1.5)}
	on:pointerleave={() => scale.set(1)}
/>

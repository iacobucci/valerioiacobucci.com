<script>
	import { T } from "@threlte/core";
	import { interactivity, useCursor } from "@threlte/extras";
	import { spring } from "svelte/motion";
	import { MeshStandardMaterial } from "three";

	interactivity();
	const scale = spring(1);
	const { onPointerEnter, onPointerLeave } = useCursor();

	import { useFrame } from "@threlte/core";
	let rotation = 0;
	useFrame((state, delta) => {
		rotation -= delta;
	});
	
	import Suzanne from "./models/Suzanne.svelte";
	import Teapot from "./models/Teapot.svelte";
	import Leica from "./models/Leica.svelte";
	import Typewriter from "./models/Typewriter.svelte";
</script>

<T.PerspectiveCamera
	makeDefault
	position={[0, 10, 10]}
	on:create={({ ref }) => {
		ref.lookAt(0, 0, 0);
	}}
/>

<T.DirectionalLight position={{ x: 3, y: 10, z: 10 }} />
<T.HemisphereLight intensity={1} />
<T.AmbientLight intensity={1} />

<Leica />

<Typewriter />

<Teapot />

<!-- TODO: pass on:click property to component -->

<!-- <T.Mesh
	rotation.x={rotation}
	rotation.y={rotation * 1.2}
	rotation.z={rotation * 0.8}
	scale={2}
	on:pointerenter={onPointerEnter}
	on:pointerleave={onPointerLeave}
	on:pointerenter={() => {
		$scale = 2;
	}}
	on:pointerleave={() => {
		$scale = 1;
	}}
>
	<T.BoxGeometry />
</T.Mesh> -->

<script>
	import { T } from "@threlte/core";
	import { interactivity, useCursor } from "@threlte/extras";
	import { spring } from "svelte/motion";
	import { useFrame } from "@threlte/core";
	import { MeshStandardMaterial } from "three";

	interactivity();
	const scale = spring(1);

	let rotation = 0;
	useFrame((state, delta) => {
		rotation -= delta;
	});

	const { onPointerEnter, onPointerLeave } = useCursor();

	// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
	// import { useLoader } from "@threlte/core";

	// const gltf = useLoader(GLTFLoader).load("/assets/suzanne.gltf");
	import Suzanne from "./Suzanne.svelte";
	import Teapot from "./Teapot.svelte";
</script>

<T.PerspectiveCamera
	makeDefault
	position={[10, 10, 10]}
	on:create={({ ref }) => {
		ref.lookAt(0, 0, 0);
	}}
/>

<T.DirectionalLight position={{ x: 3, y: 10, z: 10 }} />
<T.HemisphereLight intensity={1} />
<T.AmbientLight intensity={1} />

<Teapot
	rotation.x={rotation}
	rotation.y={rotation * 1.2}
	rotation.z={rotation * 0.8}
	scale={[1, 2, 1]}
/>

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

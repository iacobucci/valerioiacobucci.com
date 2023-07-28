<script>
    import { T } from "@threlte/core";
    import { Group } from "three";
    import { useGltf } from "@threlte/extras";

    import {
        MeshNormalMaterial,
    } from "three";

    export const ref = new Group();
    
	import { useFrame } from "@threlte/core";
	let rotation = 0;
	useFrame((state, delta) => {
		rotation -= delta;
	});

    const gltf = useGltf("/assets/teapot.gltf");
</script>

{#if $gltf}
    <T is={ref} {...$$restProps}>
        <T.Group
            position={[-3, 0, 0]}
            rotation.x={rotation}
            rotation.y={rotation * 1.2}
            rotation.z={rotation * 0.8}
        >
            <T.Mesh
                material={new MeshNormalMaterial({})}
                geometry={$gltf.nodes.teapot.geometry}
                scale={1.0}
            />
            <slot {ref} />
        </T.Group>

        
        <slot {ref} />
    </T>
{/if}

<script>
    import { T } from "@threlte/core";
    import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
    import { useLoader } from "@threlte/core";
    import { Group } from "three";
    import { useGltf } from "@threlte/extras";

	import { MeshStandardMaterial, DoubleSide } from 'three';
    
    export const ref = new Group();

    const gltf = useGltf("/assets/teapot.gltf");
</script>

{#if $gltf}
    <T is={ref} {...$$restProps}>
        <T.Mesh
            recieveShadows
            material={new MeshStandardMaterial({ side: DoubleSide, color: 'green', roughness: 0.5, metalness: 0.5 })}
            geometry={$gltf.nodes.teapot.geometry}
            rotation={[0,0,0]}
            scale={1.0}
        />
        <slot {ref} />
    </T>
{/if}

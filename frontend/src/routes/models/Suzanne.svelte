<script>
    import { T } from "@threlte/core";
    import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
    import { useLoader } from "@threlte/core";
    import { Group } from "three";
    import { useGltf } from "@threlte/extras";

    export const ref = new Group();

    // const gltf = useLoader(GLTFLoader).load("/assets/suzanne.gltf");
    const gltf = useGltf("/assets/suzanne.gltf");
</script>

{#if $gltf}
    <T is={ref} {...$$restProps}>
        <T.Mesh
            geometry={$gltf.nodes.Suzanne.geometry}
            rotation={[0,0,0]}
            scale={1.0}
        />
        <slot {ref} />
    </T>
{/if}

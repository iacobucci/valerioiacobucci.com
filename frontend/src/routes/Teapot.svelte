<script>
    import { T } from "@threlte/core";
    import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
    import { useLoader } from "@threlte/core";
    import { Group } from "three";
    import { useGltf } from "@threlte/extras";

    import {
        MeshStandardMaterial,
        MeshBasicMaterial,
        MeshMatcapMaterial,
        MeshNormalMaterial,
        Color,
    } from "three";

    export const ref = new Group();

    const gltf = useGltf("/assets/teapot.gltf");
</script>

{#if $gltf}
    <T is={ref} {...$$restProps}>
        <T.Mesh
            material={new MeshNormalMaterial({})}
            geometry={$gltf.nodes.teapot.geometry}
            rotation={[0, 0, 0]}
            scale={1.0}
        />
        <slot {ref} />
    </T>
{/if}

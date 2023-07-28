<script>
    import { T } from "@threlte/core";
    import { Group } from "three";
    import { useGltf } from "@threlte/extras";

    import {
        MeshNormalMaterial,
    } from "three";

    export const ref = new Group();

    const gltf = useGltf("/assets/teapot.gltf");
</script>

{#if $gltf}
    <T is={ref} {...$$restProps}>
        <T.Mesh
            material={new MeshNormalMaterial({})}
            geometry={$gltf.nodes.teapot.geometry}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1.0}
        />
        <slot {ref} />
    </T>
{/if}

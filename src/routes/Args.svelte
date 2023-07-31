<script>
    export let arg = "default";

    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();
    function sayHello() {
        dispatch("hello", {
            text: "Hello!"
        });
    }
</script>

<p>Arg={arg}</p>
{#each [1, 2, 3] as number, i}
    <p>{i}={number}</p>
{/each}

<button on:click={sayHello}>Say Hello</button>
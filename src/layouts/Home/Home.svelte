<script>
import Profile from '../../components/Profile';
import MainView from '../../components/MainView';
import { isSidebarHidden, language } from '../../shared/store';
import { getProfile, initialRequestOrchestrator } from '../../shared/requester';
import Loader from '../../components/Loader/Loader.svelte';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.svelte';

let className = '';

const toggleSidebar = () => {
	isSidebarHidden.update(isHidden => !isHidden);
};

$: className = $isSidebarHidden ? ' skz-sidebar--hidden' : '';
</script>

<style src="./Home.scss">
</style>


<!-- {#if $event.isHalloween}
			<PumpkinLoader />
		{:else}
			<Loader />
		{/if} -->

<div class="skz-container">
	{#await initialRequestOrchestrator()}
		<Loader />
	{:then _}
		<nav class="{`skz-sidebar${className}`}">
			<Profile />
		</nav>

		<button class="skz-sidebar-overlay" on:click="{toggleSidebar}">
			{language.getWord('HideMenu')}
		</button>
		<main class="skz-content">
			<MainView />
		</main>
	{:catch error}
		<ErrorMessage
			retry="{getProfile}"
			label="{language.getWord('ProfileNotFound')}"
		/>
	{/await}
</div>

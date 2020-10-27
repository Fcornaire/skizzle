<script>
import Projects from '../Projects';
import Settings from '../Settings';
import {
	profile,
	isSidebarHidden,
	theme,
	language,
	firstOrganization,
event,
} from '../../shared/store';
import { getAvatar } from '../../shared/requester';
import GhostAvatar from '../GhostAvatar/GhostAvatar.svelte';

let currentTabIndex = 1;

const onTabChange = index => {
	currentTabIndex = index;
};

const toggleSidebar = () => {
	isSidebarHidden.update(isHidden => !isHidden);
};

const setFocus = (e, index) => {
	currentTabIndex = index;
	document.getElementById(e.detail).focus();
};
</script>

<!-- {#if $event.isHalloween}
			<PumpkinLoader />
		{:else}
			<Loader />
		{/if} -->

<div class="skz-profile">
	{#if $profile}
		<div class="skz-avatar__gradient skz-avatar__gradient--{$theme}"></div>
		<div class="skz-avatar">
			-
			{#await getAvatar($profile.id, $firstOrganization)}
				<img
					class="skz-avatar__image"
					alt="{$profile.displayName}"
					src="./assets/user.svg"
				/>
			{:then avatar}
				{#if $event.isHalloween}
					<div class="skz-avatar__image skz-avatar__image--halloween">
						<GhostAvatar>
							<img
								class="skz-avatar__image"
								alt={$profile.displayName}
								src="data:image/jpeg;base64,{avatar.value}" />
						</GhostAvatar>
					</div>
				{:else}
					<img
						class="skz-avatar__image"
						alt={$profile.displayName}
						src="data:image/jpeg;base64,{avatar.value}" />
				{/if}
			{:catch error}
				<img
					class="skz-avatar__image"
					alt="{$profile.displayName}"
					src="./assets/user.svg"
				/>
			{/await}
			<button class="skz-profile-toggle" on:click="{toggleSidebar}">
				{language.getWord('Menu')}
			</button>
		</div>
		<p class="skz-profile-name">{$profile.displayName}</p>
		<nav class="skz-profile-nav skz-profile-nav--{currentTabIndex}">
			<button
				on:click="{() => onTabChange(1)}"
				class="skz-profile-nav__item skz-profile-nav__item--projects"
			>
				{language.getWord('Projects')}
			</button>
			<button
				on:click="{() => onTabChange(2)}"
				class="skz-profile-nav__item skz-profile-nav__item--settings"
			>
				{language.getWord('Settings')}
			</button>
			<span class="skz-profile-nav__indicator"></span>
		</nav>
		<div class="skz-profile-content skz-profile-content--{currentTabIndex}">
			<div class="skz-profile-content__item">
				<Projects on:focus="{e => setFocus(e, 1)}" />
			</div>
			<div class="skz-profile-content__item">
				<Settings />
			</div>
		</div>
	{/if}
</div>

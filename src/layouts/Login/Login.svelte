<script>
	import { language } from '../../shared/store';
	const app = require('electron').ipcRenderer;

	let isFormOpen = false;
	let proxyLogin = null;
	let proxyPassword = null;
	let isValidated = false;

	const toggleForm = () => (isFormOpen = !isFormOpen);
	const updateLogin = event => {
		isValidated = false;
		proxyLogin = event.target.value;
	};

	const updatePassword = event => {
		isValidated = false;
		proxyPassword = event.target.value;
	};

	const configureProxy = e => {
		e.preventDefault();
		isValidated = true;
		app.send('proxy-config', {
			proxyLogin,
			proxyPassword,
		});
	};
</script>

<style src="./Login.scss">

</style>

<div class="skz-login">
	<img class="skz-login__logo" src="./assets/logo-skizzle.svg" alt="Skizzle" />
	<img
		class="skz-login__logo skz-login__logo--dark"
		src="./assets/logo-skizzle-dark-context.svg"
		alt="Skizzle" />
	<p class="skz-login__intro">
		{@html language.getWord('Login')}
	</p>
	<button
		class="skz-login__button skz-login__button--azure"
		on:click={() => app.send('azure-devops-oauth')}>
		Azure DevOps
	</button>

	<div
		class={`skz-login__config ${isFormOpen ? 'skz-login__config--open' : ''}`}>
		<button class="skz-button" on:click={toggleForm}>
			Vous utilisez un proxy ou une authentification NTLM ?
		</button>
		<form on:submit={configureProxy}>
			<label for="identifiant">Identifiant pour le proxy/NTLM</label>
			<input id="identifiant" on:input={updateLogin} type="text" />
			<label for="password">Mot de passe</label>
			<input id="password" on:input={updatePassword} type="password" />
			<input
				disabled={!proxyLogin || !proxyPassword}
				type="submit"
				value="Valider" />
			{#if isValidated}
				<p class="skz-confirmation">Proxy configuré</p>
			{/if}
		</form>
	</div>
</div>

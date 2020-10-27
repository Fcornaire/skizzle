<style src="./Repositories.scss">
</style>

<script>
import { updateRepository, isOffline, language } from '../../shared/store';
import type { Repository } from '../../shared/Domain/Models/Repository';

export let repositories: Repository[] = [];
</script>

{#if repositories && repositories.length > 0}
	<ul class="skz-repos">
		{#each repositories as repository (repository.id)}
			<li class="skz-repo">
				<input
					disabled="{$isOffline}"
					type="checkbox"
					id="{repository.id}"
					on:change="{e => updateRepository(e, repository)}"
					checked="{repository.checked}"
				/>
				<label
					class="skz-repo__name"
					for="{repository.id}"
				>{repository.name}</label>
			</li>
		{/each}
	</ul>
{:else}
	<div class="skz-repos">
		<p>{language.getWord('NoRepository')}</p>
	</div>
{/if}

<style src="./Project.scss">
</style>

<script>
import type { Organization } from '../../shared/Domain/Models/Organization';

import type { Project } from '../../shared/Domain/Models/Project';
import type { Repository } from '../../shared/Domain/Models/Repository';
import { getRepositories } from '../../shared/requester';

import { organizations, repositories } from '../../shared/store';
import Loader from '../Loader/Loader.svelte';

import Repositories from '../Repositories';

export let project: Project;
export let checked = false;

let repo: Repository[] = [];
let organizationsData: Organization[] = [];

repositories.subscribe(rep => {
	repo = $repositories.filter(rep => rep.projectId === project.id);
});

organizations.subscribe(orgs => {
	organizationsData = orgs;
});

const getAndUpdateRepositoriesAsync = async () => {
	const repo = await getRepositories(
		project.id,
		organizationsData.filter(org => org.accountId === project.organizationId)[0]
			.accountName,
	);

	repositories.update(rep => [...rep, ...repo]);
};

$: isOpen = checked;
$: hasSelectedRepos = !!repo.find(({ checked }) => checked);
</script>

<li class="{`skz-project ${hasSelectedRepos ? 'skz-project--selected' : ''}`}">
	{#await getAndUpdateRepositoriesAsync()}
		<Loader />
	{:then _}
		<input
			type="checkbox"
			id="{project.id}"
			class="skz-project__check"
			on:change="{() => (isOpen = !isOpen)}"
			value="{isOpen}"
		/>
		<label class="skz-project__name" for="{project.id}">{project.name}</label>
		{#if isOpen}
			<Repositories repositories="{repo}" />
		{/if}
	{/await}
</li>

<style src="./Projects.scss">
</style>

<script>
import { createEventDispatcher } from 'svelte';
import {
	language,
	organizations,
	projects,
	repositories,
} from '../../shared/store';
import Project from '../Project';
import type { Project as ProjectType } from '../../shared/Domain/Models/Project';
import Loader from '../Loader/Loader.svelte';
import type { Organization } from '../../shared/Domain/Models/Organization';
import { getProjects } from '../../shared/requester';

const titles = [language.getWord('NoProject'), language.getWord('OneProject')];
let searchInput = '';
let searchableProject = [];
let checkedProjects: ProjectType[] = [];
let organizationsData: Organization[] = [];

projects.subscribe(prjs => {
	checkedProjects = prjs
		.filter(
			prj =>
				organizationsData.filter(org => org.accountId === prj?.organizationId)[0]
					?.checked,
		)
		.sort((a, b) => (a.name > b.name ? 1 : -1));
});

organizations.subscribe(orgs => {
	organizationsData = orgs;
});

$: searchableProject = checkedProjects.filter(
	p =>
		p.name.toLowerCase().indexOf(searchInput.toLowerCase()) !== -1 ||
		$repositories.filter(
			r =>
				r.projectId === p.id &&
				r.name.toLowerCase().indexOf(searchInput.toLowerCase()) !== -1,
		).length > 0,
);
$: checked = searchableProject.length > 0 && searchableProject.length <= 5;
$: title =
	titles[searchableProject.length] ||
	`${searchableProject.length} ${language.getWord('Projects')}`;

const dispatch = createEventDispatcher();
let map = {};

const handleKeydown = e => {
	let keydown = e.type === 'keydown';
	map[e.keyCode] = keydown;

	if (map['70'] && map['17']) {
		dispatch('focus', 'search');
	}
};

const getAndUpdateProjectsAsync = async (organizations: Organization[]) => {
	await Promise.all(
		organizations.map(async organization => {
			const projectsResp = await getProjects(organization, organizations.length);

			projects.update(prjs => [...prjs, ...projectsResp]);
		}),
	);
};

const canCheckedProject = project =>
	project.repositories.length <= 10 ||
	project.repositories.find(
		r => r.name.toLowerCase() === searchInput.toLowerCase(),
	);
</script>

<svelte:window on:keydown="{handleKeydown}" on:keyup="{handleKeydown}" />

<div class="skz-projects">
	{#await getAndUpdateProjectsAsync(organizationsData)}
		<Loader />
	{:then _}
		<header class="skz-projects__header">
			<div class="skz-projects__search">
				<input
					id="search"
					type="text"
					bind:value="{searchInput}"
					placeholder="{language.getWord('Search')}"
				/>
			</div>
			<h2>{title}</h2>
		</header>
		<div class="skz-projects__list-container">
			<ul class="skz-projects__list">
				{#each searchableProject as project}
					<Project
						project="{project}"
						checked="{checked && canCheckedProject(project)}"
					/>
				{:else}
					<li>
						<p class="skz-projects__empty">
							{language.getWord('NoProjectOnOrganization')}
						</p>
					</li>
				{/each}
			</ul>
		</div>
	{/await}
</div>

const app = require('electron').ipcRenderer;
import {
	getItem,
	existValue,
	updateSubItem,
	removeItem,
	addItem,
} from './storage';
import {
	pullRequests,
	profile,
	clientToken,
	organizations,
	isFetchingPullRequests,
	pullRequestsFetchHasError,
	firstOrganization,
	projects,
	repositories,
} from './store';
import { getDiffDays } from './helpers';
import { Descriptor, toProfileModel } from './Domain/Models/Profile';
import {
	Organization,
	toOrganizationModel,
} from './Domain/Models/Organization';
import { toProjectModel, Project } from './Domain/Models/Project';
import { toRepositoryModel, Repository } from './Domain/Models/Repository';
import { get } from 'svelte/store';

let data: any[] = [];
let loadedRepositories = 0;
let loadedOrganizations = 0;
let numberOfLoadedPullRequests = 0;
let loadedPullRequests: any[] = [];
let brokenOrganizations: any[] = [];
let refreshing = false;

export const getHeader = () => {
	const headers = new window.Headers();
	headers.append('Content-Type', 'application/json');
	headers.append(
		'Authorization',
		`Bearer ${getItem('clientToken').clientToken}`,
	);

	const params = {
		method: 'GET',
		headers,
	};

	return params;
};

export const getToken = async ({
	url,
	redirect_uri,
	client_assertion,
	access_code,
	refresh_token,
}: {
	url: string;
	redirect_uri: string;
	client_assertion: string;
	access_code: string;
	refresh_token: string;
}) => {
	refreshing = true;
	const body = `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=${client_assertion}&grant_type=${
		refresh_token
			? 'refresh_token'
			: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
	}&assertion=${refresh_token || access_code}&redirect_uri=${redirect_uri}`;

	const headers = new window.Headers();
	headers.append('Content-Type', 'application/x-www-form-urlencoded');
	headers.append('Content-Length', body.length.toString());

	const result = await fetch(url, {
		method: 'POST',
		body,
		headers,
	});

	if (result.ok) {
		const value = await result.json();

		const { token, access_token, expires_in, refresh_token } = value;

		let checkToken = token;

		if (!checkToken) {
			checkToken = access_token;
		}

		if (!checkToken) {
			removeItem('clientToken');
			throw new Error('No token recieved!');
		}

		const current_date = new Date();
		const expiresIn = parseInt(expires_in);

		addItem('clientToken', {
			clientToken: checkToken,
			refresh_token,
			expires_in: expiresIn,
			url,
			redirect_uri,
			client_assertion,
			current_date,
		});
		clientToken.set({
			clientToken: checkToken,
			refresh_token,
			expires_in: expiresIn,
			url,
			redirect_uri,
			client_assertion,
			current_date,
		});
	}

	refreshing = false;
};

export const customFetch = async (url: string) => {
	const client = getItem('clientToken');

	if (!client) {
		clientToken.set(undefined);
		clear();

		throw new Error("Token doesn't exist!");
	}

	const diffSecondes = Math.abs(
		(new Date(client.current_date).getTime() - new Date().getTime()) / 1000,
	);

	if (diffSecondes > client.expires_in && !refreshing) {
		await getToken(client);
	}

	const params = getHeader();

	return await fetch(url, params);
};

export const initialRequestOrchestrator = async () => {
	const user = await getProfile();
	profile.set(user);

	const organizationsResp = await getOrganizations(user.id);
	organizations.set(organizationsResp);

	// organizationsResp.forEach(async organization => {
	// 	const projectsResp = await getProjects(
	// 		organization,
	// 		organizationsResp.length,
	// 	);

	// 	projects.update(prjs => [...prjs, ...projectsResp]);

	// 	projectsResp.forEach(async project => {
	// 		const repo = await getRepositories({
	// 			projectId: project.id,
	// 			organizationName: organization.accountName,
	// 			numberOfProjects: projectsResp.length,
	// 		});
	// 		repositories.update(rep => {
	// 			return [...rep, ...repo];
	// 		});
	// 	});
	// });
};

export const getMemberName = async memberId => {
	const res = await customFetch(
		`https://app.vssps.visualstudio.com/_apis/profile/profiles/${memberId}?api-version=5.1`,
	);

	if (res.ok) {
		const data = await res.json();
		return data.displayName;
	}

	return '';
};

export const getProfile = async () => {
	try {
		const res = await customFetch(
			'https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=5.1-preview.3',
		);

		if (res.ok) {
			const user = await res.json();

			clientToken.set(getItem('clientToken'));
			return toProfileModel(user);
		} else {
			clientToken.set(undefined);
			removeItem('clientToken');
			return toProfileModel({});
		}
	} catch (e) {
		throw e;
	}
};

export const getOrganizations = async (id: string) => {
	try {
		const res = await customFetch(
			`https://app.vssps.visualstudio.com/_apis/accounts?memberId=${id}&api-version=5.1-preview.1`,
		);

		const result = await res.json();

		if (result && result.count > 0) {
			const fstOrganization = result.value[0].accountName;

			firstOrganization.set(fstOrganization);
		}

		const orgs = result.value.map((organization: any) =>
			toOrganizationModel(
				organization,
				existValue(getItem('organizations'), organization.accountId),
			),
		);

		return orgs as Organization[];
	} catch (e) {
		throw new Error(e);
	}
};

export const getProjects = async (
	organization: Organization,
	numberOfOrganizations: number,
) => {
	const res = await customFetch(
		`https://dev.azure.com/${organization.accountName}/_apis/projects?$top=1000&api-version=5.1`,
	);

	const result = await res.json();

	// loadedOrganizations += 1;

	// data = data.map(organizationItem => ({
	// 	...organizationItem,
	// 	projects:
	// 		organizationItem.accountId === organization.accountId
	// 			? result.value
	// 			: organizationItem.projects,
	// }));

	const projects = result.value.map(project =>
		toProjectModel(project, organization.accountId),
	) as Project[];

	return projects;
};

export const getRepositories = async (
	projectId: string,
	organizationName: string,
) => {
	const res = await customFetch(
		`https://dev.azure.com/${organizationName}/${projectId}/_apis/git/repositories?includeLinks=true&api-version=5.0`,
	);

	try {
		const result = await res.json();

		const repositories = result.value.map(repo =>
			toRepositoryModel(
				repo,
				getItem('repositories').includes(repo.id),
				projectId,
			),
		);

		return repositories as Repository[];
	} catch (e) {
		throw new Error(e);
	}
};

export const updatePullRequestsStore = ({
	shouldNotify = false,
	isFiltered = false,
	profileId,
}: {
	shouldNotify: boolean;
	isFiltered: boolean;
	profileId: string;
}) => {
	pullRequests.update(pullRequestsList => {
		const newList = loadedPullRequests.reduce((acc, curr) => {
			acc.push(...curr);
			return acc;
		}, []);
		const filteredList = isFiltered
			? newList.filter((item: any) => {
					return (
						item.isDraft === false &&
						item.mergeStatus !== 'conflicts' &&
						profileId !== item.createdBy.id &&
						getDiffDays(item.creationDate) < 30 &&
						!item.reviewers.find(({ id }: { id: string }) => id === profileId)
					);
			  })
			: newList;

		if (
			shouldNotify &&
			pullRequestsList.length &&
			pullRequestsList.length < filteredList.length
		) {
			const newPullRequests = filteredList.filter(
				(item: any) =>
					!pullRequestsList.find(
						({ pullRequestId }) => pullRequestId === item.pullRequestId,
					),
			);

			if (newPullRequests.length) {
				let title = 'Nouvelle pull request';
				let body = `Le projet ${newPullRequests[0].repository.project.name} a une nouvelle pull request.`;

				if (newPullRequests.length > 1) {
					const projectsNames = newPullRequests.reduce((acc: any, curr: any) => {
						if (!acc.includes(curr.repository.project.name)) {
							acc.push(curr.repository.project.name);
						}
						return acc;
					}, []);

					title = 'Nouvelles pull requests';
					body = `Les projets ${projectsNames.reduce((acc: any, curr: any) => {
						acc = `${curr}, `;
						return acc;
					}, '')} ont de nouvelles pull requests`;
				}

				app.send('notifier', {
					title,
					body,
				});
			}
		}

		return filteredList.sort(
			(a: any, b: any) =>
				new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime(),
		);
	});

	loadedPullRequests = [];
};

export const checkedElements = ({ checked }: { checked: boolean }) => !!checked;
export const getCheckedRepositories = () => {
	const repos = get(repositories) as Repository[];

	return repos.filter(repo => repo.checked);
};

export const getPullRequests = async ({
	shouldNotify = false,
	isFiltered,
	profileId,
}: {
	shouldNotify: boolean;
	isFiltered: boolean;
	profileId: string;
}) => {
	console.log('here');

	const repos = get(repositories) as Repository[];
	const projs = get(projects) as Project[];
	const orgs = get(organizations) as Organization[];

	await Promise.all(
		repos
			.filter(repo => repo.checked)
			.map(repo =>
				fetchPullRequests({
					id: repo.id,
					projectId: repo.projectId,
					organizationName: orgs.filter(
						org =>
							org.accountId ===
							projs.filter(prj => prj.id === repo.projectId)[0].organizationId,
					)[0].accountName,
					shouldNotify,
					isFiltered,
					profileId,
					repositoriesToFetch: [],
				}),
			),
	);

	//  else {
	// 	updatePullRequestsStore({ shouldNotify, isFiltered, profileId });
	// }
};

export const fetchPullRequests = async ({
	id,
	projectId,
	organizationName,
	shouldNotify,
	isFiltered,
	profileId,
	repositoriesToFetch,
}: {
	id: string;
	projectId: string;
	organizationName: string;
	shouldNotify: boolean;
	isFiltered: boolean;
	profileId: string;
	repositoriesToFetch: any[];
}) => {
	const res = await customFetch(
		`https://dev.azure.com/${organizationName}/${projectId}/_apis/git/repositories/${id}/pullRequests?searchCriteria.status=active&includeLinks=true&api-version=5.0`,
	);

	if (res.ok && res.status === 200) {
		const result = await res.json();

		console.log(result);

		loadedPullRequests.push(
			result.value.map((value: any[]) => ({ ...value, organizationName })),
		);
	} else {
		pullRequestsFetchHasError.set(true);
	}

	numberOfLoadedPullRequests += 1;

	if (numberOfLoadedPullRequests === repositoriesToFetch.length) {
		isFetchingPullRequests.set(false);
		updatePullRequestsStore({ shouldNotify, isFiltered, profileId });
	}
};

export const fetchPullRequestComments = async ({
	pullRequestId,
	repositoryId,
	projectId,
	organizationName,
}: {
	pullRequestId: string;
	repositoryId: string;
	projectId: string;
	organizationName: string;
}) => {
	const res = await customFetch(
		`https://dev.azure.com/${organizationName}/${projectId}/_apis/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads?api-version=5.1`,
	);

	if (res.ok) {
		return await res.json();
	} else {
		throw new Error(res.statusText);
	}
};

export const getAvatar = async (userId: string, organization: string) => {
	const imgs = getItem('images');
	let avatar;

	if (imgs && imgs.length > 0) {
		avatar = imgs.find((x: any) => x[userId]);
	}

	if (avatar) {
		return Promise.resolve({ value: avatar[userId] });
	}

	const subjectDescriptor = await getDescriptor(userId);

	const res = await customFetch(
		`https://vssps.dev.azure.com/${organization}/_apis/graph/Subjects/${subjectDescriptor}/avatars?size=large&api-version=5.1-preview.1`,
	);

	if (res.ok) {
		const response = res.json();

		response.then(x => {
			updateSubItem('images', userId, x.value);
		});

		return response;
	} else {
		throw new Error(res.statusText);
	}
};

export const getDescriptor = async (userId: string) => {
	const response = await customFetch(
		`https://vssps.dev.azure.com/_apis/graph/descriptors/${userId}?api-version=5.0-preview.1`,
	);

	const data = await response.json();

	return data as Descriptor;
};

export const clear = () => {
	data = [];
	loadedRepositories = 0;
	loadedOrganizations = 0;
	loadedPullRequests = [];
	numberOfLoadedPullRequests = 0;
};

export const getPullRequestFiles = async (
	projectId,
	repositoryId,
	organization,
	pullRequestId,
) => {
	const response = await customFetch(
		`https://dev.azure.com/${organization}/${projectId}/_apis/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/attachments/?api-version=5.1-preview.1`,
	);

	if (response.ok) {
		return response.json();
	}
	throw new Error(response.statusText);
};

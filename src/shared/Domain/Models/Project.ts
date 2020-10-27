export type Project = {
	description: string;
	id: string;
	name: string;
	organizationId: string;
};

export const toProjectModel = (data: any, organizationId) => {
	const project: Project = {
		description: data.description,
		id: data.id,
		name: data.name,
		organizationId,
	};

	return project;
};

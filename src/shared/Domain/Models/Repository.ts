export type Repository = {
	checked: boolean;
	id: string;
	name: string;
	projectId: string;
};

export const toRepositoryModel = (
	data: any,
	checked: boolean,
	projectId: string,
) => {
	const org: Repository = {
		id: data.id,
		name: data.name,
		checked,
		projectId,
	};

	return org;
};

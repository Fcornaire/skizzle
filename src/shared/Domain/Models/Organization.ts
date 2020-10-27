export type Organization = {
	accountId: string;
	accountName: string;
	accountUri: string;
	checked: boolean;
};

export const toOrganizationModel = (data: any, checked: boolean) => {
	const org: Organization = {
		accountId: data.accountId,
		accountName: data.accountName,
		accountUri: data.accountUri,
		checked,
	};

	return org;
};

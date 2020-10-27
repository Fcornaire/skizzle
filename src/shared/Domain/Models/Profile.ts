export type Profile = {
	displayName: string;
	emailAddress: string;
	id: string;
};

export type Descriptor = {
	value: string;
};

export const toProfileModel = (data: any) => {
	const profile: Profile = {
		displayName: data.displayName,
		emailAddress: data.emailAddress,
		id: data.id,
	};

	return profile;
};

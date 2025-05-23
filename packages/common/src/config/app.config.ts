/**
 * Main application configuration for Halogen
 */

export const appConfig = {
    name: 'Halogen',
    description: 'A powerful site builder and CMS platform',
    version: '1.0.0',
    cloudinaryPath: 'mortar-studio-lite',
    ServerIPAddress: "165.227.89.156"
};

export const pricingData: {
    tier: number,
    name: string;
    ngnAmount: number,
    cmsCollectionLimit: number,
    storageLimitInGB: number,
    maxPages: number,
    teamMemberLimit: number,
    monthlyPageVisitLimit: number,
    prioritySupport: boolean,
    customDomain: boolean,
    brandingBadge: boolean,
}[] = [
    {
        tier: 0,
        name: 'Hobby',
        ngnAmount: 0,
        cmsCollectionLimit: 5,
        storageLimitInGB: 1,
        maxPages: 3,
        teamMemberLimit: 2,
        monthlyPageVisitLimit: 200,
        prioritySupport: false,
        customDomain: false,
        brandingBadge: true,
    },
    {
        tier: 1,
        name: 'Pro',
        ngnAmount: 6000,
        cmsCollectionLimit: 10,
        storageLimitInGB: 5,
        maxPages: 10,
        teamMemberLimit: 5,
        monthlyPageVisitLimit: 1000,
        prioritySupport: false,
        customDomain: true,
        brandingBadge: false,
    },
    {
        tier: 2,
        name: 'Growth',
        ngnAmount: 11000,
        cmsCollectionLimit: 20,
        storageLimitInGB: 10,
        maxPages: 20,
        teamMemberLimit: 10,
        monthlyPageVisitLimit: 5000,
        prioritySupport: true,
        customDomain: true,
        brandingBadge: false,
    },
    {
        tier: 3,
        name: 'Enterprise',
        ngnAmount: 20000,
        cmsCollectionLimit: 100,
        storageLimitInGB: 50,
        maxPages: 100,
        teamMemberLimit: 30,
        monthlyPageVisitLimit: 20000,
        prioritySupport: true,
        customDomain: true,
        brandingBadge: false,
    },
]

export default appConfig;

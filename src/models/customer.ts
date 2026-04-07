export type RecordStatus = 'active' | 'inactive';

export type UtilityServiceType = 'electric' | 'water' | 'gas';

export type CustomerProfile = {
  id: string;
  displayName: string;
  status: RecordStatus;
};

export type UtilityAccount = {
  id: string;
  accountNumber: string;
  displayName: string;
  status: RecordStatus;
};

export type UtilityService = {
  id: string;
  serviceType: UtilityServiceType;
  serviceName: string;
  serviceAddress: string | null;
  status: RecordStatus;
};

export type FieldDevice = {
  id: string;
  deviceSlug: string;
  deviceType: string;
  vendorModel: string;
  status: RecordStatus;
};

export type Gateway = {
  id: string;
  gatewaySlug: string;
  displayName: string;
  status: RecordStatus;
  devices: FieldDevice[];
};

export type Microgrid = {
  id: string;
  microgridCode: string;
  displayName: string;
  status: RecordStatus;
  timezone: string;
  gateways: Gateway[];
};

export type MeApiResponse = {
  email: string;
  profile: CustomerProfile;
  account: UtilityAccount;
  services: UtilityService[];
  microgrids: Microgrid[];
};

export type OnboardingServiceInput = {
  serviceType: UtilityServiceType;
  serviceName: string;
  serviceAddress?: string | null;
  status?: RecordStatus;
};

export type OnboardingCustomerInput = {
  email: string;
  profileDisplayName: string;
  accountNumber: string;
  accountDisplayName: string;
  profileStatus?: RecordStatus;
  accountStatus?: RecordStatus;
  services: OnboardingServiceInput[];
};

export function isRecordStatus(value: string): value is RecordStatus {
  return value === 'active' || value === 'inactive';
}

export function isUtilityServiceType(value: string): value is UtilityServiceType {
  return value === 'electric' || value === 'water' || value === 'gas';
}

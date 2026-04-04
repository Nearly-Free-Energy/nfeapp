export type LegacyCustomerRecord = {
  email: string;
  customerId: string;
  customerName: string;
};

export const legacyCustomerMap: LegacyCustomerRecord[] = [
  {
    email: 'aaron.tushabe@nearlyfreeenergy.com',
    customerId: 'nfe-demo',
    customerName: 'Nearly Free Energy Demo',
  },
  {
    email: 'customer@example.com',
    customerId: 'customer-demo',
    customerName: 'Customer Demo Account',
  },
  {
    email: 'team@nearlyfreeenergy.com',
    customerId: 'nfe-team',
    customerName: 'Nearly Free Energy Team',
  },
];

export type CustomerRecord = {
  customerId: string;
  customerName: string;
};

export const customerMap: Record<string, CustomerRecord> = {
  'aaron.tushabe@nearlyfreeenergy.com': {
    customerId: 'nfe-demo',
    customerName: 'Nearly Free Energy Demo',
  },
  'customer@example.com': {
    customerId: 'customer-demo',
    customerName: 'Customer Demo Account',
  },
  'team@nearlyfreeenergy.com': {
    customerId: 'nfe-team',
    customerName: 'Nearly Free Energy Team',
  },
};

const PRIORITIES = [0, 1, 2, 3, 4];

const FINANCIAL_IMPACT = ['very_high', 'high', 'moderate', 'low', 'none'];

const COMM_MODES = ['email', 'in_person', 'remote_meeting', 'chat', 'phone', 'none'];

const FUNCTION_TYPES = [
  'HR', 'Admin', 'Lead', 'Sales', 'Solution',
  'Proposal', 'Finance', 'Operations', 'Marketing', 'Technical',
];

const ROLES = ['user', 'admin'];

module.exports = { PRIORITIES, FINANCIAL_IMPACT, COMM_MODES, FUNCTION_TYPES, ROLES };
